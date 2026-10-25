'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '@/lib/auth/authService';

export const IDLE_LOCK_STORAGE_KEY = 'amendesk_terminal_is_locked';
export const IDLE_TIMEOUT_STORAGE_KEY = 'amendesk_idle_lock_minutes';
export const IDLE_ENABLED_STORAGE_KEY = 'amendesk_idle_lock_enabled';
export const LAST_ACTIVITY_STORAGE_KEY = 'amendesk_terminal_last_activity';
export const DEFAULT_IDLE_LOCK_MINUTES = 15; // Statutory standard: 15 minutes default

export interface IdleLockContextType {
  isLocked: boolean;
  lockTerminal: () => void;
  unlockTerminal: (password: string) => { success: boolean; error?: string };
  timeoutMinutes: number;
  setTimeoutMinutes: (minutes: number) => void;
  isAutoLockEnabled: boolean;
  setIsAutoLockEnabled: (enabled: boolean) => void;
  remainingSeconds: number;
  lastActiveTime: number;
}

const IdleLockContext = createContext<IdleLockContextType | undefined>(undefined);

function getInitialActivityTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const stored = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return Date.now();
}

export function IdleLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [timeoutMinutes, setInternalTimeoutMinutes] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_IDLE_LOCK_MINUTES;
    try {
      const stored = localStorage.getItem(IDLE_TIMEOUT_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) return val;
      }
      const session = authService.getSession();
      if (session?.tenant?.id) {
        const ws = authService.getWorkspaceSettings(session.tenant.id);
        if (ws?.idleLockMinutes) return ws.idleLockMinutes;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_IDLE_LOCK_MINUTES;
  });

  const [isAutoLockEnabled, setInternalAutoLockEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem(IDLE_ENABLED_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
      const session = authService.getSession();
      if (session?.tenant?.id) {
        const ws = authService.getWorkspaceSettings(session.tenant.id);
        if (typeof ws?.enableIdleLock === 'boolean') return ws.enableIdleLock;
      }
    } catch {
      // Fallback
    }
    return true;
  });

  const lastActivityRef = useRef<number>(getInitialActivityTime());
  const [lastActiveTime, setLastActiveTime] = useState<number>(getInitialActivityTime);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => timeoutMinutes * 60);

  const lockTerminal = useCallback(() => {
    setIsLocked(true);
    setRemainingSeconds(0);
    try {
      localStorage.setItem(IDLE_LOCK_STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('amendesk-idle-lock-change'));
    } catch {
      // Ignore
    }
  }, []);

  const unlockTerminal = useCallback((password: string): { success: boolean; error?: string } => {
    const session = authService.getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Terminal session expired or not authenticated. Please log in.' };
    }

    const isValid = authService.verifyPassword(session.user.id, password);
    if (!isValid) {
      return {
        success: false,
        error: `Incorrect password for ${session.user.fullName}. Please verify your credentials and try again.`,
      };
    }

    const now = Date.now();
    lastActivityRef.current = now;
    setLastActiveTime(now);
    lastActivityRef.current = now;
    setIsLocked(false);
    setRemainingSeconds(timeoutMinutes * 60);

    try {
      localStorage.removeItem(IDLE_LOCK_STORAGE_KEY);
      localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
      window.dispatchEvent(new Event('amendesk-idle-lock-change'));
    } catch {
      // Ignore
    }

    return { success: true };
  }, [timeoutMinutes]);

  const setTimeoutMinutes = useCallback((minutes: number) => {
    const safeMinutes = Math.max(1, Math.min(minutes, 240));
    setInternalTimeoutMinutes(safeMinutes);
    try {
      localStorage.setItem(IDLE_TIMEOUT_STORAGE_KEY, String(safeMinutes));
      const session = authService.getSession();
      if (session?.tenant?.id) {
        authService.updateWorkspaceSettings(session.tenant.id, { idleLockMinutes: safeMinutes });
      }
    } catch {
      // Ignore
    }
  }, []);

  const setIsAutoLockEnabled = useCallback((enabled: boolean) => {
    setInternalAutoLockEnabled(enabled);
    try {
      localStorage.setItem(IDLE_ENABLED_STORAGE_KEY, String(enabled));
      const session = authService.getSession();
      if (session?.tenant?.id) {
        authService.updateWorkspaceSettings(session.tenant.id, { enableIdleLock: enabled });
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync with WorkspaceSettings if tenant changes
  useEffect(() => {
    const handleTenantChange = () => {
      const session = authService.getSession();
      if (!session?.tenant?.id) return;
      try {
        const ws = authService.getWorkspaceSettings(session.tenant.id);
        if (ws.idleLockMinutes && !localStorage.getItem(IDLE_TIMEOUT_STORAGE_KEY)) {
          setInternalTimeoutMinutes(ws.idleLockMinutes);
        }
        if (typeof ws.enableIdleLock === 'boolean' && localStorage.getItem(IDLE_ENABLED_STORAGE_KEY) === null) {
          setInternalAutoLockEnabled(ws.enableIdleLock);
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('amendesk-tenant-change', handleTenantChange);
    return () => window.removeEventListener('amendesk-tenant-change', handleTenantChange);
  }, []);

  // Activity listeners across all window events
  useEffect(() => {
    const recordActivity = () => {
      // If currently locked, ignore background activity
      if (isLocked) return;

      const now = Date.now();
      // Throttle recording to at most once per 2 seconds
      if (now - lastActivityRef.current > 2000) {
        lastActivityRef.current = now;
        setLastActiveTime(now);
        try {
          localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
        } catch {
          // Ignore
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick manual lock keyboard shortcut: Ctrl+Alt+L or ⌘+Alt+L or Ctrl+Shift+L
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.altKey || e.shiftKey) &&
        (e.key === 'l' || e.key === 'L')
      ) {
        e.preventDefault();
        lockTerminal();
        return;
      }
      recordActivity();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === IDLE_LOCK_STORAGE_KEY) {
        setIsLocked(e.newValue === 'true');
      } else if (e.key === IDLE_TIMEOUT_STORAGE_KEY && e.newValue) {
        const val = parseInt(e.newValue, 10);
        if (!isNaN(val) && val > 0) setInternalTimeoutMinutes(val);
      } else if (e.key === IDLE_ENABLED_STORAGE_KEY && e.newValue !== null) {
        setInternalAutoLockEnabled(e.newValue === 'true');
      } else if (e.key === LAST_ACTIVITY_STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed) && parsed > 0) {
          lastActivityRef.current = parsed;
          setLastActiveTime(parsed);
        }
      }
    };

    const handleCustomLockEvent = () => {
      try {
        const locked = localStorage.getItem(IDLE_LOCK_STORAGE_KEY) === 'true';
        setIsLocked(locked);
      } catch {
        // Ignore
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const storedLast = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
        const last = storedLast ? parseInt(storedLast, 10) : lastActivityRef.current;
        if (!isNaN(last) && last > 0) {
          lastActivityRef.current = last;
        }

        if (!isLocked && isAutoLockEnabled) {
          const elapsed = (now - lastActivityRef.current) / 1000;
          const totalSec = timeoutMinutes * 60;
          if (elapsed >= totalSec) {
            lockTerminal();
          }
        }
      }
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'touchstart',
      'scroll',
      'wheel',
      'click',
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('amendesk-idle-lock-change', handleCustomLockEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('amendesk-idle-lock-change', handleCustomLockEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, isAutoLockEnabled, timeoutMinutes, lockTerminal]);

  // Periodic heartbeat timer (checks idle timeout every second)
  useEffect(() => {
    if (isLocked || !isAutoLockEnabled) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastActivityRef.current) / 1000;
      const totalSeconds = timeoutMinutes * 60;
      const remaining = Math.max(0, Math.ceil(totalSeconds - elapsedSeconds));

      setRemainingSeconds(remaining);

      if (elapsedSeconds >= totalSeconds) {
        lockTerminal();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, isAutoLockEnabled, timeoutMinutes, lockTerminal]);

  return (
    <IdleLockContext.Provider
      value={{
        isLocked,
        lockTerminal,
        unlockTerminal,
        timeoutMinutes,
        setTimeoutMinutes,
        isAutoLockEnabled,
        setIsAutoLockEnabled,
        remainingSeconds,
        lastActiveTime,
      }}
    >
      {children}
    </IdleLockContext.Provider>
  );
}

export function useIdleLock(): IdleLockContextType {
  const context = useContext(IdleLockContext);
  if (!context) {
    throw new Error('useIdleLock must be used within an IdleLockProvider');
  }
  return context;
}

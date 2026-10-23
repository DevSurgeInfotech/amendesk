'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  db,
  getActiveEnvironmentMode,
  isDevSurgeAuthorized as checkDevSurgeAuth,
  setEnvironmentMode as setDbEnvMode,
  authorizeDevSurge as performDevSurgeAuth,
  revokeDevSurgeAuth as performDevSurgeRevoke,
  type EnvironmentMode,
} from '@/lib/db';
import { syncEngine, type SyncResult } from '@/lib/sync/syncEngine';

export type UserRole =
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'AUCTION_MANAGER'
  | 'CASHIER'
  | 'DEALERSHIP_AGENT'
  | 'INVENTORY_OFFICER';

interface TerminalContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentStaffName: string;
  staffAvatarUrl: string | null;
  setStaffAvatarUrl: (dataUrl: string | null) => void;
  facilityLocation: string;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<SyncResult>;
  resetDatabase: () => Promise<void>;
  isDbReady: boolean;

  // Dev Surge Engineering Staging & Gate Controls
  environmentMode: EnvironmentMode;
  isDevSurgeAuthorized: boolean;
  isDevGateOpen: boolean;
  openDevGate: () => void;
  closeDevGate: () => void;
  switchEnvironment: (mode: EnvironmentMode) => void;
  authorizePasscode: (passcode: string) => boolean;
  revokeDevSurge: () => void;
}

const ROLE_STAFF_NAMES: Record<UserRole, string> = {
  ADMIN: 'Kwesi Boateng (Managing Director)',
  ACCOUNTANT: 'Esi Mansa (Chief Accountant)',
  AUCTION_MANAGER: 'Kofi Asante (Chief Auctioneer)',
  CASHIER: 'Mary Afriyie (Senior Cashier)',
  DEALERSHIP_AGENT: 'Yaw Osei (Showroom Manager)',
  INVENTORY_OFFICER: 'David Mensah (Yard Supervisor)',
};

const AVATAR_STORAGE_KEY = 'amendesk_staff_avatar';
const DEVSURGE_EVENT = 'amendesk-devsurge-change';

function subscribeAvatar(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('amendesk-avatar-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('amendesk-avatar-change', callback);
  };
}

function getAvatarSnapshot(): string | null {
  try {
    return localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerAvatarSnapshot(): string | null {
  return null;
}

function subscribeDevSurge(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(DEVSURGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(DEVSURGE_EVENT, callback);
  };
}

function getAuthSnapshot(): boolean {
  return checkDevSurgeAuth();
}

function getServerAuthSnapshot(): boolean {
  return false;
}

function getEnvSnapshot(): EnvironmentMode {
  return getActiveEnvironmentMode();
}

function getServerEnvSnapshot(): EnvironmentMode {
  return 'LIVE';
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [facilityLocation] = useState('Amen Mart Yard & Cash Office — Gbawe');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // Dev Surge Gate UI State
  const [isDevGateOpen, setIsDevGateOpen] = useState(false);

  const staffAvatarUrl = useSyncExternalStore(
    subscribeAvatar,
    getAvatarSnapshot,
    getServerAvatarSnapshot
  );

  const isDevSurgeAuthorized = useSyncExternalStore(
    subscribeDevSurge,
    getAuthSnapshot,
    getServerAuthSnapshot
  );

  const environmentMode = useSyncExternalStore(
    subscribeDevSurge,
    getEnvSnapshot,
    getServerEnvSnapshot
  );

  const setStaffAvatarUrl = (dataUrl: string | null) => {
    try {
      if (dataUrl) {
        localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
      } else {
        localStorage.removeItem(AVATAR_STORAGE_KEY);
      }
      window.dispatchEvent(new Event('amendesk-avatar-change'));
    } catch (err) {
      console.error('Failed to persist staff avatar in localStorage:', err);
    }
  };

  useEffect(() => {
    // Check URL parameters for direct developer gate access
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('devsurge_token');
      if (token && performDevSurgeAuth(token)) {
        window.dispatchEvent(new Event(DEVSURGE_EVENT));
        setTimeout(() => setIsDevGateOpen(true), 0);
      } else if (urlParams.get('devsurge_gate') === '1') {
        setTimeout(() => setIsDevGateOpen(true), 0);
      }
    } catch {
      // Ignored in non-browser context
    }

    // Populate DB on client-side boot if empty
    db.populateIfEmpty()
      .then(() => {
        setIsDbReady(true);
        void syncEngine.init().then(() => {
          setLastSyncedAt(syncEngine.getLastSyncedAt());
        });
      })
      .catch((err) => console.error('Failed to populate local Dexie DB:', err));

    // Subscribe to sync engine status
    const unsubscribe = syncEngine.subscribe((online, count, syncing, lastSync) => {
      setIsOnline(online);
      setPendingSyncCount(count);
      setIsSyncing(syncing);
      if (lastSync) {
        setLastSyncedAt(lastSync);
      }
    });

    // Keyboard shortcut: Ctrl + Shift + D (or Cmd + Shift + D) to open Dev Surge Gate
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDevGateOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openDevGate = () => setIsDevGateOpen(true);
  const closeDevGate = () => setIsDevGateOpen(false);

  const switchEnvironment = (mode: EnvironmentMode) => {
    setDbEnvMode(mode);
  };

  const authorizePasscode = (passcode: string): boolean => {
    const success = performDevSurgeAuth(passcode);
    if (success) {
      window.dispatchEvent(new Event(DEVSURGE_EVENT));
    }
    return success;
  };

  const revokeDevSurge = () => {
    performDevSurgeRevoke();
    window.dispatchEvent(new Event(DEVSURGE_EVENT));
  };

  const triggerManualSync = async (): Promise<SyncResult> => {
    return await syncEngine.triggerSync({ isManual: true });
  };

  const resetDatabase = async () => {
    await db.resetToSeedData();
    const count = await syncEngine.getPendingCount();
    setPendingSyncCount(count);
  };

  return (
    <TerminalContext.Provider
      value={{
        role,
        setRole,
        currentStaffName: ROLE_STAFF_NAMES[role],
        staffAvatarUrl,
        setStaffAvatarUrl,
        facilityLocation,
        isOnline,
        pendingSyncCount,
        isSyncing,
        lastSyncedAt,
        triggerManualSync,
        resetDatabase,
        isDbReady,
        environmentMode,
        isDevSurgeAuthorized,
        isDevGateOpen,
        openDevGate,
        closeDevGate,
        switchEnvironment,
        authorizePasscode,
        revokeDevSurge,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}

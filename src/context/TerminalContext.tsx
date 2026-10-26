'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  db,
  type TenantId,
  type Tenant,
  SYSTEM_TENANTS,
  getActiveTenantId,
  setActiveTenantId,
  isProductionDeployment,
} from '@/lib/db';
import { syncEngine, type SyncResult } from '@/lib/sync/syncEngine';
import type { AppRole, AuthSession, TenantRecord } from '@/lib/types/auth';
import { ROLE_LABELS } from '@/lib/types/auth';
import { authService, SESSION_STORAGE_KEY } from '@/lib/auth/authService';
import {
  getNotificationPermission,
  isDesktopNotificationEnabled,
  setDesktopNotificationEnabled,
  isDesktopNotificationSoundEnabled,
  setDesktopNotificationSoundEnabled,
  requestDesktopNotificationPermission,
  sendDesktopNotification,
  notifyInboundInquiry,
} from '@/lib/notifications/desktopNotification';

export type UserRole =
  | AppRole
  | 'ADMIN'
  | 'DEALERSHIP_AGENT'
  | 'INVENTORY_OFFICER';

export const ROLE_STAFF_NAMES: Record<UserRole, string> = {
  OWNER: 'Managing Director & Owner',
  ACCOUNTANT: 'Chief Accountant & Payroll Lead',
  HR_ADMIN: 'HR & Administrative Officer',
  SECRETARY: 'Auction Secretary & Staff Onboarding',
  AUCTION_MANAGER: 'Auction & Yard Manager',
  CASHIER: 'Front Desk Cashier (POS)',
  SALES_OFFICER: 'Dealership, Land & Property Officer',
  STAFF: 'Operations & Yard Officer',
  ADMIN: 'Kwesi Boateng (Managing Director)',
  DEALERSHIP_AGENT: 'Yaw Osei (Showroom Manager)',
  INVENTORY_OFFICER: 'David Mensah (Yard Supervisor)',
};

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
  cleanSlateDatabase: () => Promise<void>;
  isDbReady: boolean;

  // Encore SMS Style Multi-Tenant RBAC Session
  session: AuthSession | null;
  isAuthenticated: boolean;
  currentUser: AuthSession['user'] | null;
  currentTenant: TenantRecord | null;
  logout: () => void;

  tenantId: TenantId;
  activeTenant: Tenant;
  switchTenant: (id: TenantId) => void;
  isProduction: boolean;

  // Windows & Desktop Notifications
  desktopNotifsAllowed: boolean;
  desktopNotifsEnabled: boolean;
  desktopNotifsSound: boolean;
  requestDesktopNotifPermission: () => Promise<boolean>;
  toggleDesktopNotifs: (enabled: boolean) => void;
  toggleDesktopNotifSound: (enabled: boolean) => void;
  testDesktopNotification: () => void;
}

const AVATAR_STORAGE_KEY = 'amendesk_staff_avatar';
const ROLE_STORAGE_KEY = 'amendesk_staff_role';
const TENANT_EVENT = 'amendesk-tenant-change';
const ROLE_EVENT = 'amendesk-role-change';

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

function subscribeRole(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(ROLE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(ROLE_EVENT, callback);
  };
}

function getRoleSnapshot(): UserRole {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (saved && ROLE_STAFF_NAMES[saved]) {
      return saved;
    }
    const session = authService.getSession();
    if (session?.user?.role) return session.user.role;
  } catch {
    // Ignore
  }
  return 'OWNER';
}

function getServerRoleSnapshot(): UserRole {
  return 'OWNER';
}

function subscribeTenant(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(TENANT_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(TENANT_EVENT, callback);
  };
}

function getTenantSnapshot(): TenantId {
  const session = authService.getSession();
  if (session?.tenant?.id) return session.tenant.id as TenantId;
  return getActiveTenantId();
}

function getServerTenantSnapshot(): TenantId {
  return 'amen-mart-live';
}

let cachedSessionSnapshot: AuthSession | null = null;
let cachedSessionRaw: string | null = null;

function subscribeAuthSession(callback: () => void) {
  return authService.subscribeAuth(callback);
}

function getSessionSnapshot(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === cachedSessionRaw && cachedSessionSnapshot) {
    if (cachedSessionSnapshot.expiresAt > Date.now()) {
      return cachedSessionSnapshot;
    }
  }
  cachedSessionRaw = raw;
  cachedSessionSnapshot = authService.getSession();
  return cachedSessionSnapshot;
}

function getServerSessionSnapshot(): AuthSession | null {
  return null;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [facilityLocation] = useState('Amen Mart Yard & Cash Office — Gbawe');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [desktopNotifsAllowed, setDesktopNotifsAllowed] = useState(false);
  const [desktopNotifsEnabled, setDesktopNotifsEnabled] = useState(false);
  const [desktopNotifsSound, setDesktopNotifsSound] = useState(true);

  // Sync initial notification permissions and preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNotifState = () => {
      setDesktopNotifsAllowed(getNotificationPermission() === 'granted');
      setDesktopNotifsEnabled(isDesktopNotificationEnabled());
      setDesktopNotifsSound(isDesktopNotificationSoundEnabled());
    };

    updateNotifState();

    window.addEventListener('amendesk-notification-pref-change', updateNotifState);
    window.addEventListener('storage', updateNotifState);

    return () => {
      window.removeEventListener('amendesk-notification-pref-change', updateNotifState);
      window.removeEventListener('storage', updateNotifState);
    };
  }, []);

  const requestDesktopNotifPermission = async (): Promise<boolean> => {
    const granted = await requestDesktopNotificationPermission();
    setDesktopNotifsAllowed(granted);
    setDesktopNotifsEnabled(isDesktopNotificationEnabled());
    return granted;
  };

  const toggleDesktopNotifs = (enabled: boolean) => {
    setDesktopNotificationEnabled(enabled);
    setDesktopNotifsEnabled(enabled);
  };

  const toggleDesktopNotifSound = (enabled: boolean) => {
    setDesktopNotificationSoundEnabled(enabled);
    setDesktopNotifsSound(enabled);
  };

  const testDesktopNotification = () => {
    sendDesktopNotification({
      title: '🔔 AmenDesk Windows Alert Test',
      body: 'Desktop notifications are active. Inbound inquiries will alert here on Windows in real time.',
      url: '/desk/communication',
      playChime: true,
    });
  };

  const session = useSyncExternalStore(
    subscribeAuthSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  const isAuthenticated = Boolean(session);
  const currentUser = session?.user ?? null;
  const currentTenant = session?.tenant ?? null;

  const role = useSyncExternalStore(
    subscribeRole,
    getRoleSnapshot,
    getServerRoleSnapshot
  );

  const staffAvatarUrl = useSyncExternalStore(
    subscribeAvatar,
    getAvatarSnapshot,
    getServerAvatarSnapshot
  );

  const tenantId = useSyncExternalStore(
    subscribeTenant,
    getTenantSnapshot,
    getServerTenantSnapshot
  );

  const activeTenant: Tenant = SYSTEM_TENANTS[tenantId] || {
    id: tenantId,
    name: currentTenant?.name || 'Amen Mart Ghana',
    shortName: currentTenant?.shortName || 'Amen Mart',
    code: currentTenant?.code || 'LIVE',
    isSandbox: currentTenant?.environment === 'SANDBOX',
    badgeLabel: currentTenant?.environment === 'SANDBOX' ? 'SANDBOX DEMO' : 'LIVE PRODUCTION',
    description: currentTenant?.description || 'Commercial operations & clean general ledger.',
  };

  const isProduction = isProductionDeployment();

  const currentStaffName = currentUser
    ? `${currentUser.fullName} (${ROLE_LABELS[currentUser.role] || currentUser.role})`
    : 'Kwesi Boateng (Managing Director)';

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

  const handleSetRole = (newRole: UserRole) => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
      window.dispatchEvent(new Event(ROLE_EVENT));
    } catch (err) {
      console.error('Failed to persist staff role in localStorage:', err);
    }
  };

  const logout = () => {
    authService.logout();
    router.push('/login');
  };

  const switchTenant = (id: TenantId) => {
    setActiveTenantId(id);
    window.dispatchEvent(new Event(TENANT_EVENT));
  };

  useEffect(() => {
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

    // 3. Real-time Inbound Inquiry BroadcastChannel Listener
    let leadsChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        leadsChannel = new BroadcastChannel('amendesk_leads_sync');
        leadsChannel.onmessage = async (event) => {
          if (event.data?.type === 'NEW_LEAD' && event.data?.customer) {
            try {
              await db.customers.put(event.data.customer);
              notifyInboundInquiry(event.data.customer);
            } catch (err) {
              console.error('Failed to put broadcasted lead into db:', err);
            }
          }
        };
      } catch {
        // BroadcastChannel not available in this environment
      }
    }

    // 4. Background Server Inquiry Poller (fetches inquiries created from other devices or browsers)
    const syncInquiriesFromServer = async () => {
      try {
        const res = await fetch('/api/inquiries', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.inquiries) && data.inquiries.length > 0) {
            for (const inq of data.inquiries) {
              const existing = await db.customers.get(inq.id);
              if (!existing) {
                await db.customers.put(inq);
                notifyInboundInquiry(inq);
              }
            }
          }
        }
      } catch {
        // Offline or server not responding
      }
    };

    void syncInquiriesFromServer();
    const inquiriesInterval = setInterval(() => {
      void syncInquiriesFromServer();
    }, 4000);

    return () => {
      unsubscribe();
      leadsChannel?.close();
      clearInterval(inquiriesInterval);
    };
  }, []);

  const triggerManualSync = async (): Promise<SyncResult> => {
    return await syncEngine.triggerSync({ isManual: true });
  };

  const resetDatabase = async () => {
    await db.resetToSeedData();
    const count = await syncEngine.getPendingCount();
    setPendingSyncCount(count);
  };

  const cleanSlateDatabase = async () => {
    await db.resetToCleanSlate();
    const count = await syncEngine.getPendingCount();
    setPendingSyncCount(count);
  };

  return (
    <TerminalContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        currentStaffName,
        staffAvatarUrl,
        setStaffAvatarUrl,
        facilityLocation,
        isOnline,
        pendingSyncCount,
        isSyncing,
        lastSyncedAt,
        triggerManualSync,
        resetDatabase,
        cleanSlateDatabase,
        isDbReady,
        session,
        isAuthenticated,
        currentUser,
        currentTenant,
        logout,
        tenantId,
        activeTenant,
        switchTenant,
        isProduction,
        desktopNotifsAllowed,
        desktopNotifsEnabled,
        desktopNotifsSound,
        requestDesktopNotifPermission,
        toggleDesktopNotifs,
        toggleDesktopNotifSound,
        testDesktopNotification,
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

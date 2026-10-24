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

export type UserRole =
  | AppRole
  | 'ADMIN'
  | 'AUCTION_MANAGER'
  | 'CASHIER'
  | 'DEALERSHIP_AGENT'
  | 'INVENTORY_OFFICER';

export const ROLE_STAFF_NAMES: Record<UserRole, string> = {
  OWNER: 'Managing Director & Owner',
  ACCOUNTANT: 'Chief Accountant & Finance Lead',
  SECRETARY: 'Auction Secretary & Operations',
  STAFF: 'Operations Staff & Cashier',
  ADMIN: 'Kwesi Boateng (Managing Director)',
  AUCTION_MANAGER: 'Kofi Asante (Chief Auctioneer)',
  CASHIER: 'Mary Afriyie (Senior Cashier)',
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
    const session = authService.getSession();
    if (session?.user?.role) return session.user.role;
    const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (saved && ROLE_STAFF_NAMES[saved]) {
      return saved;
    }
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

    return () => {
      unsubscribe();
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

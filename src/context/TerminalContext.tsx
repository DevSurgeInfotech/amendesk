'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { db } from '@/lib/db';
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

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [facilityLocation] = useState('Amen Mart Yard & Cash Office — Gbawe');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  const staffAvatarUrl = useSyncExternalStore(
    subscribeAvatar,
    getAvatarSnapshot,
    getServerAvatarSnapshot
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

    return () => unsubscribe();
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

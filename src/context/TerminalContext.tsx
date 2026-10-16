'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';

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
  facilityLocation: string;
  isOnline: boolean;
  pendingSyncCount: number;
  triggerManualSync: () => Promise<void>;
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

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [facilityLocation] = useState('Amen Mart Yard & Cash Office — Tema');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    // Populate DB on client-side boot if empty
    db.populateIfEmpty()
      .then(() => setIsDbReady(true))
      .catch((err) => console.error('Failed to populate local Dexie DB:', err));

    // Subscribe to sync engine status
    const unsubscribe = syncEngine.subscribe((online, count) => {
      setIsOnline(online);
      setPendingSyncCount(count);
    });

    return () => unsubscribe();
  }, []);

  const triggerManualSync = async () => {
    await syncEngine.triggerSync();
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
        facilityLocation,
        isOnline,
        pendingSyncCount,
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

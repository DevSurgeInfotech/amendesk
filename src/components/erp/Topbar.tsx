'use client';

import Link from 'next/link';
import { useTerminal, type UserRole } from '@/context/TerminalContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  RotateCcw,
  MapPin,
  UserCheck,
  CreditCard,
} from 'lucide-react';

export function Topbar() {
  const {
    role,
    setRole,
    facilityLocation,
    isOnline,
    pendingSyncCount,
    triggerManualSync,
    resetDatabase,
  } = useTerminal();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-10">
      {/* Location & Facility Badge + Quick Record Payment */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>{facilityLocation}</span>
        </div>

        <Link
          href="/desk/payments"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors border border-indigo-200 dark:border-indigo-800"
        >
          <CreditCard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Record Payment</span>
        </Link>
      </div>

      {/* Right Controls: Role, Sync Status, Reset, Theme */}
      <div className="flex items-center gap-3">
        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-400 font-normal">Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ADMIN" className="dark:bg-slate-900">Admin</option>
            <option value="AUCTION_MANAGER" className="dark:bg-slate-900">Auction Manager</option>
            <option value="ACCOUNTANT" className="dark:bg-slate-900">Accountant</option>
            <option value="CASHIER" className="dark:bg-slate-900">Front Desk Cashier</option>
            <option value="DEALERSHIP_AGENT" className="dark:bg-slate-900">Dealership Agent</option>
            <option value="INVENTORY_OFFICER" className="dark:bg-slate-900">Inventory Officer</option>
          </select>
        </div>

        {/* Online / Offline Connectivity Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {isOnline ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="h-3.5 w-3.5" />
              <span>Online Terminal</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline Yard Mode</span>
            </>
          )}
        </div>

        {/* Sync Status Button */}
        <button
          type="button"
          onClick={() => void triggerManualSync()}
          title="Manual sync with central server"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
          <span>
            {pendingSyncCount > 0 ? (
              <span className="text-amber-600 font-semibold dark:text-amber-400">
                {pendingSyncCount} Pending Sync
              </span>
            ) : (
              'Synced'
            )}
          </span>
        </button>

        {/* Reset Seed Data */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset local AmenDesk database to fresh seed data?')) {
              void resetDatabase();
            }
          }}
          title="Reset local database to initial demonstration dataset"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
}

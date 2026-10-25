'use client';

import { Suspense, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/erp/Sidebar';
import { Topbar } from '@/components/erp/Topbar';
import { Breadcrumbs } from '@/components/erp/Breadcrumbs';
import { SidebarProvider } from '@/context/SidebarContext';
import { useTerminal } from '@/context/TerminalContext';
import { IdleLockProvider } from '@/context/IdleLockContext';
import { IdleLockScreen } from '@/components/erp/IdleLockScreen';
import { authService, SESSION_STORAGE_KEY } from '@/lib/auth/authService';
import type { AuthSession } from '@/lib/types/auth';
import { FlaskConical, LogOut } from 'lucide-react';

let cachedDeskSessionSnapshot: AuthSession | null = null;
let cachedDeskSessionRaw: string | null = null;

function subscribeDeskAuth(callback: () => void) {
  return authService.subscribeAuth(callback);
}

function getDeskSessionSnapshot(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === cachedDeskSessionRaw && cachedDeskSessionSnapshot) {
    if (cachedDeskSessionSnapshot.expiresAt > Date.now()) {
      return cachedDeskSessionSnapshot;
    }
  }
  cachedDeskSessionRaw = raw;
  cachedDeskSessionSnapshot = authService.getSession();
  return cachedDeskSessionSnapshot;
}

function getDeskServerSessionSnapshot(): AuthSession | null {
  return null;
}

function SandboxModeBanner() {
  const { activeTenant, logout } = useTerminal();

  // ONLY render if in Demo Yard sandbox
  if (!activeTenant.isSandbox) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs z-30 select-none">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4" />
        <span>🧪 AMENDESK DEMO YARD (SANDBOX) — Dev Surge client demonstration workspace with Ghanaian seed dataset</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-400 text-[11px] font-bold hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <LogOut className="h-3 w-3" />
          <span>Log Out to Switch Account</span>
        </button>
      </div>
    </div>
  );
}

export default function DeskLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const session = useSyncExternalStore(
    subscribeDeskAuth,
    getDeskSessionSnapshot,
    getDeskServerSessionSnapshot
  );

  useEffect(() => {
    if (!authService.getSession()) {
      router.push('/login');
    }
  }, [router]);

  // Prevent flash of private desk contents if unauthenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Checking terminal session authorization...
      </div>
    );
  }

  return (
    <IdleLockProvider>
      <SidebarProvider>
        <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-[var(--background)]">
          <SandboxModeBanner />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="no-print h-full shrink-0 flex flex-col">
              <Suspense fallback={<aside className="w-[264px] h-full shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />}>
                <Sidebar />
              </Suspense>
            </div>
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <div className="no-print shrink-0">
                <Topbar />
                <Breadcrumbs />
              </div>
              <main className="flex-1 p-6 overflow-y-auto min-h-0">
                <Suspense fallback={<div className="p-6 text-slate-500 text-xs">Loading terminal...</div>}>
                  {children}
                </Suspense>
              </main>
            </div>
          </div>
        </div>
        <IdleLockScreen />
      </SidebarProvider>
    </IdleLockProvider>
  );
}

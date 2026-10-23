'use client';

import { Suspense, type ReactNode } from 'react';
import { Sidebar } from '@/components/erp/Sidebar';
import { Topbar } from '@/components/erp/Topbar';
import { DevSurgeGateModal } from '@/components/erp/DevSurgeGateModal';
import { SidebarProvider } from '@/context/SidebarContext';
import { useTerminal } from '@/context/TerminalContext';
import { FlaskConical } from 'lucide-react';

function SandboxModeBanner() {
  const { environmentMode, isDevSurgeAuthorized, openDevGate, switchEnvironment } = useTerminal();

  if (!isDevSurgeAuthorized || environmentMode !== 'SANDBOX') return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs z-30 select-none">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4" />
        <span>DEV SURGE INTERNAL SANDBOX — Amen Mart Dummy Yard (Data is isolated from live operations)</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openDevGate}
          className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-400 text-[11px] font-bold hover:bg-slate-900 transition-colors cursor-pointer"
        >
          Dev Gate
        </button>
        <button
          type="button"
          onClick={() => switchEnvironment('LIVE')}
          className="px-2.5 py-0.5 rounded-lg bg-white text-slate-900 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
        >
          Switch to Live
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
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-[var(--background)]">
        <SandboxModeBanner />
        <div className="flex flex-1 min-h-0">
          <div className="no-print">
            <Suspense fallback={<aside className="w-[264px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />}>
              <Sidebar />
            </Suspense>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="no-print">
              <Topbar />
            </div>
            <main className="flex-1 p-6 overflow-y-auto">
              <Suspense fallback={<div className="p-6 text-slate-500 text-xs">Loading terminal...</div>}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
        <DevSurgeGateModal />
      </div>
    </SidebarProvider>
  );
}

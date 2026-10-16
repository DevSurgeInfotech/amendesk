'use client';

import { Suspense, type ReactNode } from 'react';
import { Sidebar } from '@/components/erp/Sidebar';
import { Topbar } from '@/components/erp/Topbar';
import { SidebarProvider } from '@/context/SidebarContext';

export default function DeskLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
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
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

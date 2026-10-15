'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/erp/Sidebar';
import { Topbar } from '@/components/erp/Topbar';

export default function DeskLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="no-print">
        <Sidebar />
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
  );
}

import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

export default function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="light flex flex-col min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

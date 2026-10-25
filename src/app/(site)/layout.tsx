import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteBreadcrumbs } from '@/components/site/SiteBreadcrumbs';
import { AmenAiAssistant } from '@/components/site/AmenAiAssistant';

export default function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <SiteBreadcrumbs />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AmenAiAssistant />
    </div>
  );
}

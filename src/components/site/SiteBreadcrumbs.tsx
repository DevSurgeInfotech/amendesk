'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ChevronRight,
  Car,
  Gavel,
  MapPin,
  Building,
  Newspaper,
  BookOpen,
  Info,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react';

interface SiteRouteConfig {
  label: string;
  icon: LucideIcon;
}

const SITE_ROUTES: Record<string, SiteRouteConfig> = {
  showroom: { label: 'Vehicle Showroom', icon: Car },
  auctions: { label: 'Public Auction Notices', icon: Gavel },
  land: { label: 'Land Parcels', icon: MapPin },
  properties: { label: 'Property Developments', icon: Building },
  news: { label: 'News & Gazettes', icon: Newspaper },
  blog: { label: 'Guides & Insights', icon: BookOpen },
  about: { label: 'About Amen Mart', icon: Info },
  contact: { label: 'Contact & Inquiries', icon: PhoneCall },
};

export function SiteBreadcrumbs() {
  const pathname = usePathname();

  // Do not render breadcrumbs on homepage
  if (!pathname || pathname === '/' || pathname === '') {
    return null;
  }

  const segment = pathname.split('/')[1];
  const route = SITE_ROUTES[segment];

  if (!route) {
    return null;
  }

  const Icon = route.icon;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors py-2 px-4 sm:px-6 lg:px-8 select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <li className="flex items-center gap-1.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </li>

          <li className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight
              className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0"
              aria-hidden="true"
            />
            <div
              className="inline-flex items-center gap-1.5 font-black text-slate-900 dark:text-white"
              aria-current="page"
            >
              <Icon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{route.label}</span>
            </div>
          </li>
        </ol>

        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <span>&larr; Back to Home</span>
        </Link>
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gavel,
  Receipt,
  CalendarClock,
  Car,
  MapPin,
  Building2,
  Warehouse,
  Users,
  Globe,
  ShieldCheck,
  Building,
  Database,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { label: 'Overview', href: '/desk', icon: LayoutDashboard },
  { label: 'Auctions (3 Categories)', href: '/desk/auctions', icon: Gavel },
  { label: 'Accounts & Receipts', href: '/desk/accounts', icon: Receipt },
  { label: '14-Day Payment Plans', href: '/desk/payment-plans', icon: CalendarClock },
  { label: 'Car Dealership', href: '/desk/dealership', icon: Car },
  { label: 'Land Parcels', href: '/desk/land', icon: MapPin },
  { label: 'Property Units', href: '/desk/property', icon: Building2 },
  { label: 'Inventory & Yard', href: '/desk/inventory', icon: Warehouse },
  { label: 'CRM & KYC', href: '/desk/crm', icon: Users },
  { label: 'Data Migration & Backup', href: '/desk/migration', icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg">
          AM
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              AmenDesk
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              ERP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Amen Mart Ghana
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Government Affiliations
        </div>
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <Building className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Govt Fleet Disposals</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Judicial Court Auctions</span>
          </div>
        </div>
      </nav>

      {/* Footer Switch to Public Site */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Link
          href="/"
          className="flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            <span>View Public Website</span>
          </div>
          <span className="text-[10px] text-slate-400">Live &rarr;</span>
        </Link>
      </div>
    </aside>
  );
}

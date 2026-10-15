'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Scale,
  Gavel,
  CalendarClock,
  Car,
  MapPin,
  Building2,
  Warehouse,
  Users,
  Database,
  ChevronDown,
  Globe,
  Building,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

interface SubmoduleItem {
  label: string;
  href: string;
  badge?: string;
}

interface ModuleItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  submodules?: SubmoduleItem[];
}

const erpModules: ModuleItem[] = [
  {
    id: 'overview',
    label: 'Overview & Dashboard',
    href: '/desk',
    icon: LayoutDashboard,
  },
  {
    id: 'payments',
    label: 'Record Payment (POS)',
    href: '/desk/payments',
    icon: CreditCard,
    submodules: [
      { label: 'Payment Terminal (POS)', href: '/desk/payments' },
      { label: 'Till Shift & Drawer Balancing', href: '/desk/payments?view=shift' },
      { label: 'Recent Collections Ledger', href: '/desk/payments?view=collections' },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounting & Finance',
    href: '/desk/accounts',
    icon: Scale,
    submodules: [
      { label: 'Financial Overview', href: '/desk/accounts?tab=OVERVIEW' },
      { label: 'Chart of Accounts (COA)', href: '/desk/accounts?tab=CHART_OF_ACCOUNTS' },
      { label: 'General Ledger & Journals', href: '/desk/accounts?tab=GENERAL_LEDGER' },
      { label: 'Financial Statements (P&L, BS)', href: '/desk/accounts?tab=FINANCIAL_REPORTS' },
      { label: 'Operating Expenses (AP)', href: '/desk/accounts?tab=EXPENSES' },
      { label: 'Invoices & Billing', href: '/desk/accounts?tab=INVOICES' },
      { label: 'Cashier Receipts Ledger', href: '/desk/accounts?tab=RECEIPTS' },
    ],
  },
  {
    id: 'auctions',
    label: 'Auctions (3 Categories)',
    href: '/desk/auctions',
    icon: Gavel,
    submodules: [
      { label: 'All Auction Lots', href: '/desk/auctions' },
      { label: 'Judicial Court Auctions', href: '/desk/auctions?cat=JUDICIAL' },
      { label: 'Government Fleet Disposals', href: '/desk/auctions?cat=GOVERNMENT' },
      { label: 'Private Consignments', href: '/desk/auctions?cat=PRIVATE' },
      { label: 'Lot Intake Wizard', href: '/desk/auctions/intake' },
    ],
  },
  {
    id: 'payment-plans',
    label: '14-Day Payment Plans',
    href: '/desk/payment-plans',
    icon: CalendarClock,
    submodules: [
      { label: 'All Payment Plans', href: '/desk/payment-plans' },
      { label: 'Awaiting Final Balance', href: '/desk/payment-plans?filter=AWAITING_BALANCE' },
      { label: 'Overdue Instalments', href: '/desk/payment-plans?filter=OVERDUE' },
    ],
  },
  {
    id: 'dealership',
    label: 'Car Dealership',
    href: '/desk/dealership',
    icon: Car,
    submodules: [
      { label: 'All Showroom Inventory', href: '/desk/dealership' },
      { label: 'Available Vehicles', href: '/desk/dealership?status=AVAILABLE' },
      { label: 'Reserved Cars', href: '/desk/dealership?status=RESERVED' },
      { label: 'Sold & Delivered', href: '/desk/dealership?status=SOLD' },
    ],
  },
  {
    id: 'land',
    label: 'Land Parcels',
    href: '/desk/land',
    icon: MapPin,
    submodules: [
      { label: 'All Land Parcels', href: '/desk/land' },
      { label: 'Customary Indenture', href: '/desk/land?type=INDENTURE' },
      { label: 'Leasehold Titles', href: '/desk/land?type=LEASEHOLD' },
      { label: 'Titled Freehold', href: '/desk/land?type=FREEHOLD' },
    ],
  },
  {
    id: 'property',
    label: 'Property Units',
    href: '/desk/property',
    icon: Building2,
    submodules: [
      { label: 'All Property Developments', href: '/desk/property' },
      { label: 'Residential Units', href: '/desk/property?type=RESIDENTIAL' },
      { label: 'Commercial Units', href: '/desk/property?type=COMMERCIAL' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Yard',
    href: '/desk/inventory',
    icon: Warehouse,
    submodules: [
      { label: 'Stock Registry & SKUs', href: '/desk/inventory' },
      { label: 'Stock Movements & Transfers', href: '/desk/inventory?tab=movements' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & KYC Compliance',
    href: '/desk/crm',
    icon: Users,
    submodules: [
      { label: 'Client Directory', href: '/desk/crm' },
      { label: 'KYC Verified Clients', href: '/desk/crm?filter=VERIFIED' },
    ],
  },
  {
    id: 'migration',
    label: 'Data Sync & Backup',
    href: '/desk/migration',
    icon: Database,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Accordion state: track which modules are expanded
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      accounts: true,
      payments: true,
      auctions: true,
    };
    // Expand matching module on initial load
    for (const mod of erpModules) {
      if (mod.href !== '/desk' && pathname.startsWith(mod.href)) {
        initial[mod.id] = true;
      }
    }
    return initial;
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const currentFullUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  return (
    <aside className="w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0">
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

      {/* Accordion Navigation */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex justify-between items-center">
          <span>ERP Modules &amp; Submodules</span>
        </div>

        {erpModules.map((module) => {
          const Icon = module.icon;
          const isModuleActive =
            module.href === '/desk'
              ? pathname === '/desk'
              : pathname.startsWith(module.href);
          const hasSubmodules = Boolean(module.submodules && module.submodules.length > 0);
          const isExpanded = Boolean(expandedModules[module.id]);

          return (
            <div key={module.id} className="rounded-xl overflow-hidden">
              {/* Module Accordion Header */}
              {hasSubmodules ? (
                <div
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors select-none',
                    isModuleActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                  onClick={() => toggleModule(module.id)}
                >
                  <Link
                    href={module.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isExpanded) toggleModule(module.id);
                    }}
                    className="flex items-center gap-2.5 flex-1 py-0.5"
                  >
                    <Icon
                      className={clsx(
                        'h-4 w-4 shrink-0',
                        isModuleActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                    <span>{module.label}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModule(module.id);
                    }}
                    className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-transform"
                    aria-label="Toggle accordion"
                  >
                    <ChevronDown
                      className={clsx(
                        'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                        isExpanded ? 'transform rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                      )}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  href={module.href}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                    isModuleActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4 w-4 shrink-0',
                      isModuleActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <span>{module.label}</span>
                </Link>
              )}

              {/* Submodules Accordion Content */}
              {hasSubmodules && isExpanded && (
                <div className="pl-6 pr-2 py-1 space-y-0.5 border-l-2 border-indigo-200 dark:border-indigo-900 ml-4 my-1">
                  {module.submodules?.map((sub) => {
                    const isSubActive =
                      currentFullUrl === sub.href ||
                      (sub.href === module.href && currentFullUrl === module.href);

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={clsx(
                          'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                          isSubActive
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        )}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Government Affiliations
        </div>
        <div className="px-3 space-y-1.5">
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
          className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-slate-700"
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

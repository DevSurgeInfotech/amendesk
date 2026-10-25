'use client';

import { useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIdleLock } from '@/context/IdleLockContext';
import {
  LayoutDashboard,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Scale,
  Gavel,
  PlusCircle,
  Clock,
  Car,
  MapPin,
  Building,
  Package,
  Users,
  MessageSquare,
  Briefcase,
  Settings,
  Database,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface ModuleConfig {
  title: string;
  icon: LucideIcon;
  subtitles?: Record<string, string>;
  tabParamName?: string;
  defaultSubtitle?: string;
}

const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  payments: {
    title: 'POS & Payments',
    icon: CreditCard,
    tabParamName: 'tab',
    defaultSubtitle: 'Front-Desk Till',
    subtitles: {
      pos: 'Front-Desk POS',
      receipts: 'Receipts Ledger',
      'daily-summary': 'Daily Till Summary',
    },
  },
  accounts: {
    title: 'Accounting & Finance',
    icon: Scale,
    tabParamName: 'tab',
    defaultSubtitle: 'General Ledger',
    subtitles: {
      coa: 'Chart of Accounts',
      journal: 'Journal Entries',
      expenses: 'Operating Expenses',
      banking: 'Bank Deposits',
      reports: 'Financial Statements',
      invoices: 'Commercial Invoices',
    },
  },
  auctions: {
    title: 'Auctions Registry',
    icon: Gavel,
    tabParamName: 'cat',
    defaultSubtitle: 'All Lots',
    subtitles: {
      ALL: 'All Lots',
      JUDICIAL: 'Judicial Auctions',
      GOVERNMENT: 'Government Movable',
      PRIVATE: 'Private Consignments',
    },
  },
  'payment-plans': {
    title: 'Payment Plans & Ageing',
    icon: Clock,
    tabParamName: 'filter',
    defaultSubtitle: '14-Day Hammer Window',
    subtitles: {
      AWAITING_BALANCE: 'Active 14-Day Plans',
      OVERDUE: 'Overdue Watchlist',
      FULLY_PAID: 'Settled Accounts',
    },
  },
  dealership: {
    title: 'Car Dealership',
    icon: Car,
    tabParamName: 'status',
    defaultSubtitle: 'Showroom Stock',
    subtitles: {
      ALL: 'All Vehicles',
      AVAILABLE: 'Available Stock',
      RESERVED: 'Reserved Vehicles',
      SOLD: 'Disposed Units',
    },
  },
  land: {
    title: 'Land Desk',
    icon: MapPin,
    tabParamName: 'titleType',
    defaultSubtitle: 'Parcels & Plots',
    subtitles: {
      ALL: 'All Parcels',
      TITLED: 'Titled Parcels',
      INDENTURE: 'Indenture Plots',
    },
  },
  property: {
    title: 'Property Desk',
    icon: Building,
    tabParamName: 'propertyType',
    defaultSubtitle: 'Property Units',
    subtitles: {
      ALL: 'All Properties',
      RESIDENTIAL: 'Residential Units',
      COMMERCIAL: 'Commercial Units',
    },
  },
  inventory: {
    title: 'Inventory & Yard',
    icon: Package,
    tabParamName: 'location',
    defaultSubtitle: 'Stock Registry',
    subtitles: {
      ALL: 'All Stock',
      AUCTION_YARD: 'Auction Yard Bay',
      DEALERSHIP_SHOWROOM: 'Dealership Showroom',
    },
  },
  crm: {
    title: 'CRM & KYC Directory',
    icon: Users,
    tabParamName: 'filter',
    defaultSubtitle: 'Client Profiles',
    subtitles: {
      ALL: 'All Clients',
      INQUIRIES: 'Inbound Inquiries',
      KYC_VERIFIED: 'KYC Verified Clients',
      PENDING_KYC: 'Pending Verification',
    },
  },
  communication: {
    title: 'Communication Hub',
    icon: MessageSquare,
    tabParamName: 'tab',
    defaultSubtitle: 'Messages',
    subtitles: {
      inbox: 'Inbound Messages',
      email: 'Send Branded Email',
      whatsapp: 'WhatsApp Quick Dispatch',
    },
  },
  hr: {
    title: 'Staff & Payroll',
    icon: Briefcase,
    tabParamName: 'tab',
    defaultSubtitle: 'Salaried Staff',
    subtitles: {
      directory: 'Staff Directory',
      payroll: 'Monthly Payroll',
      filings: 'GRA & SSNIT Filings',
      attendance: 'Attendance',
      leave: 'Leave Requests',
    },
  },
  settings: {
    title: 'Workspace Settings',
    icon: Settings,
    tabParamName: 'tab',
    defaultSubtitle: 'System Configuration',
    subtitles: {
      users: 'Staff & Roles',
      profile: 'Facility Profile',
      rules: 'Business Rules & Margins',
      security: 'Security & RBAC Matrix',
    },
  },
  migration: {
    title: 'Data & Migration Hub',
    icon: Database,
    tabParamName: 'tab',
    defaultSubtitle: 'Portability',
    subtitles: {
      import: 'CSV Data Ingestion',
      export: 'JSON Backup Export',
      audit: 'System Activity Logs',
    },
  },
};

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string;
  isCurrent?: boolean;
}

function formatSegmentTitle(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function BreadcrumbsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLocked } = useIdleLock();

  // Global hotkey: Alt + D jumps directly to the Dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        router.push('/desk');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, isLocked]);

  const items: BreadcrumbItem[] = useMemo(() => {
    // If we're on the dashboard root
    if (pathname === '/desk' || pathname === '/desk/') {
      return [
        {
          label: 'Dashboard',
          icon: LayoutDashboard,
          isCurrent: true,
          badge: 'Operations Overview',
        },
      ];
    }

    const segments = pathname.replace(/^\/desk\/?/, '').split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: '/desk',
        icon: LayoutDashboard,
      },
    ];

    if (segments.length === 0) return result;

    const rootModuleKey = segments[0];
    const moduleConfig = MODULE_REGISTRY[rootModuleKey];

    if (segments.length === 1) {
      // Single-level module (e.g. /desk/accounts, /desk/hr)
      const moduleTitle = moduleConfig ? moduleConfig.title : formatSegmentTitle(rootModuleKey);
      const moduleIcon = moduleConfig ? moduleConfig.icon : undefined;

      // Check if there is an active sub-tab/query param
      let tabBadge: string | undefined;
      if (moduleConfig?.tabParamName) {
        const paramVal = searchParams.get(moduleConfig.tabParamName);
        if (paramVal && moduleConfig.subtitles && moduleConfig.subtitles[paramVal]) {
          tabBadge = moduleConfig.subtitles[paramVal];
        }
      }

      result.push({
        label: moduleTitle,
        icon: moduleIcon,
        isCurrent: true,
        badge: tabBadge,
      });
    } else {
      // Multi-level nested module (e.g. /desk/auctions/intake)
      const parentTitle = moduleConfig ? moduleConfig.title : formatSegmentTitle(rootModuleKey);
      const parentIcon = moduleConfig ? moduleConfig.icon : undefined;

      result.push({
        label: parentTitle,
        href: `/desk/${rootModuleKey}`,
        icon: parentIcon,
      });

      // Child segment
      const childSegment = segments[1];
      let childTitle = formatSegmentTitle(childSegment);
      let childIcon: LucideIcon | undefined;

      if (rootModuleKey === 'auctions' && childSegment === 'intake') {
        childTitle = 'Lot Intake Wizard';
        childIcon = PlusCircle;
      }

      result.push({
        label: childTitle,
        icon: childIcon,
        isCurrent: true,
        badge: segments.length > 2 ? formatSegmentTitle(segments[2]) : undefined,
      });
    }

    return result;
  }, [pathname, searchParams]);

  const isDashboard = pathname === '/desk' || pathname === '/desk/';

  return (
    <nav
      aria-label="Breadcrumb"
      className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 min-h-[44px] transition-colors select-none shadow-2xs"
    >
      {/* Breadcrumb Trail */}
      <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0"
                  aria-hidden="true"
                />
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="group inline-flex items-center gap-1.5 py-1 px-2 -mx-1 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-all truncate"
                >
                  {Icon && (
                    <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-black text-slate-950 dark:text-white shadow-2xs truncate"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && (
                    <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>

                  {item.badge && (
                    <span className="hidden sm:inline-flex items-center ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Right Flank Actions: Direct Jump to Dashboard or Overview Telemetry */}
      <div className="flex items-center gap-2 shrink-0">
        {!isDashboard ? (
          <Link
            href="/desk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/70 transition-all shadow-2xs hover:shadow-xs cursor-pointer group active:scale-95"
            title="Return to Operations Dashboard (Alt+D)"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform text-indigo-600 dark:text-indigo-400" />
            <span className="font-extrabold">Dashboard</span>
            <kbd className="hidden md:inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800 font-bold shadow-2xs">
              Alt+D
            </kbd>
          </Link>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Operations Matrix</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export function Breadcrumbs() {
  return (
    <Suspense
      fallback={
        <div className="h-[44px] bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-2.5 flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      }
    >
      <BreadcrumbsContent />
    </Suspense>
  );
}

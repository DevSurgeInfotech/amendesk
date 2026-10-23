'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Globe,
  Building,
  ShieldCheck,
  Award,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurveStrip } from '@/components/ui/CurveStrip';
import { useSidebar } from '@/context/SidebarContext';
import { useTerminal } from '@/context/TerminalContext';

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
      { label: 'Bank Deposits & Clearance', href: '/desk/accounts?tab=BANK_DEPOSITS' },
      { label: 'Products & Services (Item Master)', href: '/desk/accounts?tab=PRODUCTS_SERVICES' },
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
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { activeTenant } = useTerminal();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentFullUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  // Auto-expand active module on route changes — single accordion module matching Encore SMS
  useEffect(() => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    const activeMod = erpModules.find((mod) => {
      if (mod.href === '/desk') return pathname === '/desk' || pathname === '/';
      const strippedMod = mod.href.replace(/^\/desk/, '') || '/';
      if (
        pathname === mod.href ||
        pathname.startsWith(mod.href + '/') ||
        pathname === strippedMod ||
        (strippedMod !== '/' && pathname.startsWith(strippedMod + '/'))
      ) {
        return true;
      }
      if (
        mod.submodules?.some((s) => {
          const subClean = s.href.split('?')[0];
          const subStripped = subClean.replace(/^\/desk/, '') || '/';
          return (
            currentFullUrl === s.href ||
            currentFullUrl === s.href.replace(/^\/desk/, '') ||
            pathname === subClean ||
            pathname === subStripped
          );
        })
      ) {
        return true;
      }
      return false;
    });

    requestAnimationFrame(() => {
      setNavigatingHref(null);
      if (activeMod && activeMod.submodules && activeMod.submodules.length > 0) {
        setExpandedSection(activeMod.id);
      }
    });
  }, [pathname, currentFullUrl]);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar overlay"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setMobileOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden cursor-pointer print:hidden animate-in fade-in"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'sidebar fixed lg:relative z-50 inset-y-0 left-0 flex flex-col transition-all duration-300 select-none print:hidden',
          collapsed ? 'w-[72px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          width: collapsed ? 72 : 264,
          minWidth: collapsed ? 72 : 264,
          maxWidth: collapsed ? 72 : 264,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          background: 'var(--sidebar-bg, #ffffff)',
          borderRight: '1px solid var(--sidebar-border, #e2e8f0)',
          boxShadow: '4px 0 24px -4px rgba(15, 23, 42, 0.08), 1px 0 3px 0 rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Brand Header — Far Left Unified Topbar Alignment */}
        <div
          className={cn(
            'flex items-center flex-shrink-0 border-b border-slate-200 dark:border-slate-800 transition-all duration-300',
            collapsed ? 'h-[76px] justify-center px-2' : 'h-[76px] px-4 justify-start'
          )}
        >
          {collapsed ? (
            <Link
              href="/desk"
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-full transition-opacity cursor-pointer hover:opacity-85"
              title="AmenDesk ERP"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
                AM
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link
                href="/desk"
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 min-w-0 flex-1 transition-opacity cursor-pointer hover:opacity-85"
                title="AmenDesk ERP"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-600/30 shrink-0">
                  AM
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-[15px] leading-tight tracking-tight text-slate-900 dark:text-white truncate">
                      AmenDesk
                    </span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/50">
                      ERP
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                    <span className="truncate">{activeTenant.name}</span>
                    <span
                      className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full shrink-0 ${
                        activeTenant.isSandbox
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {activeTenant.code}
                    </span>
                  </p>
                </div>
              </Link>

              {/* Close Button on Mobile Drawer */}
              {mobileOpen && (
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ml-2 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3.5 px-3 space-y-1 pb-16">
          {erpModules.map((module, i) => {
            const Icon = module.icon;
            const hasSubmodules = Boolean(module.submodules && module.submodules.length > 0);
            const isExpanded = expandedSection === module.id;

            // Determine if any item in this module is currently active
            const strippedHref = module.href.replace(/^\/desk/, '') || '/';
            const hasSectionActive =
              module.href === '/desk'
                ? pathname === '/desk' || pathname === '/'
                : pathname === module.href ||
                  (pathname.startsWith(module.href + '/') && module.href !== '/desk') ||
                  pathname === strippedHref ||
                  (strippedHref !== '/' && pathname.startsWith(strippedHref + '/')) ||
                  Boolean(
                    module.submodules?.some((s) => {
                      const subClean = s.href.split('?')[0];
                      const subStripped = subClean.replace(/^\/desk/, '') || '/';
                      return (
                        currentFullUrl === s.href ||
                        currentFullUrl === s.href.replace(/^\/desk/, '') ||
                        pathname === subClean ||
                        pathname === subStripped
                      );
                    })
                  );

            return (
              <div key={i} className="mb-0.5">
                {collapsed ? (
                  /* Collapsed mode: icon button for module */
                  <div className="flex flex-col items-center py-1">
                    {hasSubmodules ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(module.id)}
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative cursor-pointer',
                          hasSectionActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500/40'
                            : 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                        )}
                        title={module.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {hasSectionActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={module.href}
                        prefetch={true}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative cursor-pointer',
                          hasSectionActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500/40'
                            : 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                        )}
                        title={module.label}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {hasSectionActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </Link>
                    )}
                  </div>
                ) : (
                  /* Expanded mode */
                  hasSubmodules ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(module.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-2 rounded-xl group',
                        'outline-none focus:outline-none focus-visible:outline-none',
                        'select-none transition-colors cursor-pointer border',
                        hasSectionActive
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs'
                          : isExpanded
                            ? 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
                      )}
                      style={!hasSectionActive && !isExpanded ? { borderColor: 'transparent' } : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Frosted Accent Icon Badge */}
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                            hasSectionActive
                              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 border border-indigo-600'
                              : isExpanded
                                ? 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                        </div>

                        {/* Section Label */}
                        <span
                          className={cn(
                            'font-sans text-[14px] tracking-tight leading-none transition-colors truncate',
                            hasSectionActive
                              ? 'font-black text-indigo-950 dark:text-white'
                              : isExpanded
                                ? 'font-bold text-slate-900 dark:text-white'
                                : 'font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-950 dark:group-hover:text-white'
                          )}
                        >
                          {module.label}
                        </span>
                      </div>

                      {/* Animated Chevron */}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                          hasSectionActive
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={module.href}
                      prefetch={true}
                      onClick={() => {
                        setMobileOpen(false);
                        if (pathname !== module.href) {
                          if (navTimerRef.current) clearTimeout(navTimerRef.current);
                          navTimerRef.current = setTimeout(() => {
                            setNavigatingHref(module.href);
                          }, 120);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        ...(hasSectionActive
                          ? {
                              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                              color: '#ffffff',
                              boxShadow: '0 4px 14px -2px rgba(79, 70, 229, 0.4)',
                              borderLeft: 'none',
                            }
                          : {
                              color: 'var(--sidebar-text, #334155)',
                            }),
                      }}
                      className={cn(
                        'sidebar-item font-sans relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl group overflow-hidden cursor-pointer border select-none transition-all',
                        hasSectionActive
                          ? 'active font-bold !text-white text-white keep-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500/20 border-transparent'
                          : navigatingHref === module.href
                            ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 ring-1 ring-indigo-400/40 animate-pulse border-transparent'
                            : 'border-transparent text-slate-700 dark:text-slate-200 hover:text-indigo-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                      )}
                    >
                      {hasSectionActive && <CurveStrip />}
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          hasSectionActive
                            ? 'bg-white/20 text-white border border-white/20 shadow-xs'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-3.5 h-3.5 shrink-0 transition-colors',
                            hasSectionActive ? '!text-white text-white stroke-[2.2]' : 'stroke-[2]'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'font-sans text-[14px] tracking-tight leading-none transition-colors truncate',
                          hasSectionActive
                            ? '!text-white text-white font-bold'
                            : 'font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-950 dark:group-hover:text-white'
                        )}
                      >
                        {module.label}
                      </span>
                    </Link>
                  )
                )}

                {/* Submodules Accordion Reveal */}
                {hasSubmodules && (
                  <div
                    className={cn(
                      'grid transition-all duration-200 ease-in-out',
                      isExpanded || collapsed
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    )}
                    style={!(isExpanded || collapsed) ? { display: 'none' } : undefined}
                  >
                    <div className="overflow-hidden border-none" style={{ border: 'none' }}>
                      <div
                        className={cn(
                          'space-y-0.5',
                          !collapsed &&
                            cn(
                              'mt-1.5 mb-2 ml-4 pl-2.5 border-l border-t-0 border-r-0 border-b-0',
                              hasSectionActive
                                ? 'border-indigo-200 dark:border-indigo-900/60'
                                : 'border-slate-200/80 dark:border-slate-800'
                            )
                        )}
                        style={
                          !collapsed
                            ? { borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 }
                            : undefined
                        }
                      >
                        {module.submodules?.map((sub) => {
                          const subClean = sub.href.split('?')[0];
                          const isSubActive = sub.href.includes('?')
                            ? currentFullUrl === sub.href || currentFullUrl === sub.href.replace(/^\/desk/, '')
                            : currentFullUrl === sub.href ||
                              currentFullUrl === sub.href.replace(/^\/desk/, '') ||
                              pathname === subClean ||
                              pathname === subClean.replace(/^\/desk/, '');
                          const isNavigating = navigatingHref === sub.href;

                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              prefetch={true}
                              onClick={() => {
                                setMobileOpen(false);
                                if (currentFullUrl !== sub.href) {
                                  if (navTimerRef.current) clearTimeout(navTimerRef.current);
                                  navTimerRef.current = setTimeout(() => {
                                    setNavigatingHref(sub.href);
                                  }, 120);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                                ...(isSubActive
                                  ? {
                                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                      color: '#ffffff',
                                      boxShadow: '0 4px 14px -2px rgba(79, 70, 229, 0.4)',
                                      borderLeft: 'none',
                                    }
                                  : {
                                      color: 'var(--sidebar-text, #334155)',
                                    }),
                              }}
                              className={cn(
                                'sidebar-item font-sans relative flex items-center justify-between gap-2.5 transition-all group/item overflow-hidden cursor-pointer',
                                collapsed
                                  ? 'justify-center px-2 py-2 rounded-xl'
                                  : 'px-3 py-2 rounded-xl text-[13px] tracking-tight',
                                isSubActive
                                  ? 'active font-bold !text-white text-white keep-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500/20'
                                  : isNavigating
                                    ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 ring-1 ring-indigo-400/40 animate-pulse'
                                    : 'font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70',
                                Boolean(navigatingHref) && !isNavigating && !isSubActive && 'opacity-70'
                              )}
                              title={collapsed ? sub.label : undefined}
                            >
                              {/* Illuminated CurveStrip Active Indicator */}
                              {isSubActive && !collapsed && <CurveStrip />}

                              <span
                                className={cn(
                                  'font-sans text-[13px] tracking-tight truncate transition-colors',
                                  isSubActive
                                    ? '!text-white text-white keep-white font-bold'
                                    : 'font-semibold text-slate-700 dark:text-slate-200 group-hover/item:text-slate-950 dark:group-hover/item:text-white'
                                )}
                              >
                                {sub.label}
                              </span>

                              {sub.badge && !collapsed && (
                                <span
                                  className={cn(
                                    'ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0',
                                    isSubActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  )}
                                >
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Affiliations & Compliance Block */}
          {!collapsed && (
            <div className="pt-4 pb-1">
              <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Licensing &amp; Affiliation
              </div>
              <div className="px-2 space-y-1 mt-1">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-850/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Ghana Auctioneers Assoc. (GAA)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-850/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">Lead: Dr. Francis Kwaku Yeboah</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-850/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <Building className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">Accra Yard &amp; Field Auctions</span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer: View Public Website */}
        <div
          className={cn(
            'border-t flex-shrink-0 transition-all bg-slate-50/50 dark:bg-slate-900/50',
            collapsed ? 'p-2.5 flex justify-center' : 'p-3'
          )}
          style={{ borderColor: 'var(--sidebar-divider, #f1f5f9)' }}
        >
          <Link
            href={process.env.NEXT_PUBLIC_SITE_URL || 'https://amenmartgh.com'}
            className={cn(
              'flex items-center rounded-xl text-xs font-bold transition-all border',
              collapsed
                ? 'w-10 h-10 justify-center p-0 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-slate-200/80 dark:border-slate-800'
                : 'justify-between px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200/80 dark:border-slate-800'
            )}
            title={collapsed ? 'View Public Showroom' : undefined}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              {!collapsed && <span className="truncate">Public Showroom</span>}
            </div>
            {!collapsed && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">&rarr;</span>
            )}
          </Link>

          {!collapsed && (
            <div className="mt-2 text-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono select-none">
                AmenDesk v1.2 &bull; Dev Surge
              </span>
            </div>
          )}
        </div>

        {/* Floating Desktop Collapse Toggle Button (Identical to Encore SMS) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border items-center justify-center transition-colors shadow-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 cursor-pointer z-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </aside>
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatGHS } from '@/lib/utils/currency';
import { useTerminal } from '@/context/TerminalContext';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  RotateCcw,
  Menu,
  Search,
  Bell,
  ChevronDown,
  Gavel,
  Users,
  Receipt,
  Car,
  LayoutDashboard,
  CreditCard,
  Scale,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Globe,
  X,
  Sparkles,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  category: 'MODULE' | 'LOT' | 'CLIENT' | 'RECEIPT' | 'ASSET';
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
}

const QUICK_MODULES: SearchResultItem[] = [
  {
    id: 'mod-overview',
    category: 'MODULE',
    title: 'Overview & Executive Dashboard',
    subtitle: 'KPIs, 14-day settlement watchlist, and recent receipts',
    badge: 'Module',
    href: '/desk',
  },
  {
    id: 'mod-payments',
    category: 'MODULE',
    title: 'Payment Terminal (POS) & Till Shift',
    subtitle: 'Multi-mode cashier receipting (Cash, MoMo, Bank, Card)',
    badge: 'POS',
    href: '/desk/payments',
  },
  {
    id: 'mod-accounts',
    category: 'MODULE',
    title: 'Accounting & General Ledger',
    subtitle: 'Chart of Accounts, journals, P&L, Balance Sheet, and bank deposits',
    badge: 'Finance',
    href: '/desk/accounts',
  },
  {
    id: 'mod-auctions',
    category: 'MODULE',
    title: 'Auctions Registry (Judicial, Govt & Private)',
    subtitle: 'Manage movable and immovable auction lots and bidding',
    badge: 'Auctions',
    href: '/desk/auctions',
  },
  {
    id: 'mod-intake',
    category: 'MODULE',
    title: 'Auction Lot Intake Wizard',
    subtitle: 'Register new consignment, court writ, or fleet disposal lot',
    badge: 'Intake',
    href: '/desk/auctions/intake',
  },
  {
    id: 'mod-plans',
    category: 'MODULE',
    title: '14-Day Payment Plans & Ageing',
    subtitle: 'Track hammer balance settlements and manager extensions',
    badge: '14-Day Window',
    href: '/desk/payment-plans',
  },
  {
    id: 'mod-dealership',
    category: 'MODULE',
    title: 'Car Dealership Inventory',
    subtitle: 'Direct vehicle sales, showroom stock, and reservations',
    badge: 'Vehicles',
    href: '/desk/dealership',
  },
  {
    id: 'mod-land',
    category: 'MODULE',
    title: 'Land Parcels & Title Registry',
    subtitle: 'Litigation-free titled plots, indentures, and site plans',
    badge: 'Land',
    href: '/desk/land',
  },
  {
    id: 'mod-property',
    category: 'MODULE',
    title: 'Property Developments & Units',
    subtitle: 'Residential and commercial property sales',
    badge: 'Property',
    href: '/desk/property',
  },
  {
    id: 'mod-inventory',
    category: 'MODULE',
    title: 'Inventory & Yard Operations',
    subtitle: 'Stock registry, SKUs, and yard movements',
    badge: 'Yard',
    href: '/desk/inventory',
  },
  {
    id: 'mod-crm',
    category: 'MODULE',
    title: 'CRM & KYC Compliance Directory',
    subtitle: 'Verified buyers, Ghana Card records, and bidder profiles',
    badge: 'CRM',
    href: '/desk/crm',
  },
  {
    id: 'mod-migration',
    category: 'MODULE',
    title: 'Data Sync & Local Backup',
    subtitle: 'Offline-first IndexedDB snapshots and cloud synchronization',
    badge: 'System',
    href: '/desk/migration',
  },
];

export function Topbar() {
  const router = useRouter();
  const { collapsed, toggleMobileOpen } = useSidebar();
  const {
    currentStaffName,
    staffAvatarUrl,
    setStaffAvatarUrl,
    isOnline,
    pendingSyncCount,
    triggerManualSync,
    resetDatabase,
  } = useTerminal();
  const { theme, setTheme } = useTheme();

  // Live Clock State (Hydration-safe)
  const [now, setNow] = useState<Date | null>(null);

  // Interactive Popovers & Command Palette States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Live Queries for Global Search & Real-Time Operational Notifications
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const receipts = useLiveQuery(() => db.receipts.toArray(), []);
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []);
  const landParcels = useLiveQuery(() => db.landParcels.toArray(), []);
  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []);

  // Tick live clock every second
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setNow(new Date());
    }, 0);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open search, Escape to close popovers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setNotificationsOpen(false);
        setStaffMenuOpen(false);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setStaffMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (!searchOpen) return undefined;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setStaffMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Clock & Date parts
  const formattedClock = useMemo(() => {
    if (!now) {
      return {
        hoursMinutes: '--:--',
        ampm: '--',
        seconds: '00',
        dateStr: 'Loading terminal clock...',
      };
    }
    const rawHours = now.getHours();
    const ampm = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 || 12;
    const hoursMinutes = `${String(hours12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return { hoursMinutes, ampm, seconds, dateStr };
  }, [now]);

  // Compute Global Search Results across ERP entities
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return QUICK_MODULES.slice(0, 7);
    }

    const results: SearchResultItem[] = [];

    // 1. Matching ERP Modules
    for (const mod of QUICK_MODULES) {
      if (
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        (mod.badge && mod.badge.toLowerCase().includes(q))
      ) {
        results.push(mod);
      }
    }

    // 2. Matching Auction Lots
    for (const lot of lots ?? []) {
      if (
        lot.lotNumber.toLowerCase().includes(q) ||
        lot.title.toLowerCase().includes(q) ||
        lot.category.toLowerCase().includes(q) ||
        (lot.winningBidderName && lot.winningBidderName.toLowerCase().includes(q))
      ) {
        results.push({
          id: `lot-${lot.id}`,
          category: 'LOT',
          title: `${lot.lotNumber} — ${lot.title}`,
          subtitle: `${lot.category} • ${lot.status.replace('_', ' ')} • ${formatGHS(lot.currentBidGhs || lot.reservePriceGhs)}`,
          badge: lot.category,
          href: '/desk/auctions',
        });
      }
    }

    // 3. Matching Clients
    for (const client of customers ?? []) {
      if (
        client.fullName.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        client.ghanaCardNumber.toLowerCase().includes(q)
      ) {
        results.push({
          id: `client-${client.id}`,
          category: 'CLIENT',
          title: client.fullName,
          subtitle: `${client.phone} • Ghana Card: ${client.ghanaCardNumber}`,
          badge: client.kycVerified ? 'KYC Verified' : 'Pending KYC',
          href: '/desk/crm',
        });
      }
    }

    // 4. Matching Receipts
    for (const rcp of receipts ?? []) {
      if (
        rcp.receiptNumber.toLowerCase().includes(q) ||
        rcp.customerName.toLowerCase().includes(q) ||
        rcp.referenceTitle.toLowerCase().includes(q)
      ) {
        results.push({
          id: `rcp-${rcp.id}`,
          category: 'RECEIPT',
          title: `${rcp.receiptNumber} — ${rcp.customerName}`,
          subtitle: `${rcp.referenceTitle} • Paid ${formatGHS(rcp.amountPaidGhs)} (${rcp.paymentMethod})`,
          badge: 'Receipt',
          href: '/desk/accounts?tab=RECEIPTS',
        });
      }
    }

    // 5. Matching Vehicles, Land & Properties
    for (const v of vehicles ?? []) {
      if (
        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q)
      ) {
        results.push({
          id: `veh-${v.id}`,
          category: 'ASSET',
          title: `${v.year} ${v.make} ${v.model}`,
          subtitle: `VIN: ${v.vin} • ${v.status} • ${formatGHS(v.askingPriceGhs)}`,
          badge: 'Dealership',
          href: '/desk/dealership',
        });
      }
    }

    for (const lp of landParcels ?? []) {
      if (
        lp.title.toLowerCase().includes(q) ||
        lp.siteRef.toLowerCase().includes(q) ||
        lp.location.toLowerCase().includes(q)
      ) {
        results.push({
          id: `land-${lp.id}`,
          category: 'ASSET',
          title: `${lp.siteRef} — ${lp.title}`,
          subtitle: `${lp.location} • ${lp.sizeAcres} Acres (${lp.titleType}) • ${formatGHS(lp.priceGhs)}`,
          badge: 'Land',
          href: '/desk/land',
        });
      }
    }

    for (const prop of properties ?? []) {
      if (
        prop.title.toLowerCase().includes(q) ||
        prop.unitRef.toLowerCase().includes(q) ||
        prop.location.toLowerCase().includes(q)
      ) {
        results.push({
          id: `prop-${prop.id}`,
          category: 'ASSET',
          title: `${prop.unitRef} — ${prop.title}`,
          subtitle: `${prop.location} • ${prop.propertyType} • ${formatGHS(prop.priceGhs)}`,
          badge: 'Property',
          href: '/desk/property',
        });
      }
    }

    return results.slice(0, 10);
  }, [searchQuery, lots, customers, receipts, vehicles, landParcels, properties]);

  // Compute Live ERP Notifications
  const notifications = useMemo(() => {
    const safeLots = lots ?? [];
    const safeReceipts = receipts ?? [];
    const list: Array<{
      id: string;
      type: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
      title: string;
      description: string;
      timeLabel: string;
      href: string;
    }> = [];

    // Overdue 14-day lots
    const overdueLots = safeLots.filter((l) => l.status === 'OVERDUE');
    for (const lot of overdueLots) {
      list.push({
        id: `notif-overdue-${lot.id}`,
        type: 'CRITICAL',
        title: `Overdue 14-Day Settlement: ${lot.lotNumber}`,
        description: `${lot.winningBidderName || 'Buyer'} owes ${formatGHS(lot.balanceDueGhs)} on ${lot.title}. Eligible for extension review or forfeiture.`,
        timeLabel: 'Action Required',
        href: '/desk/payment-plans?filter=OVERDUE',
      });
    }

    // Awaiting balance lots
    const awaitingLots = safeLots.filter((l) => l.status === 'AWAITING_BALANCE');
    for (const lot of awaitingLots.slice(0, 3)) {
      list.push({
        id: `notif-awaiting-${lot.id}`,
        type: 'WARNING',
        title: `14-Day Window Active: ${lot.lotNumber}`,
        description: `Outstanding balance of ${formatGHS(lot.balanceDueGhs)} from ${lot.winningBidderName || 'Buyer'}.`,
        timeLabel: '14-Day Watchlist',
        href: '/desk/payment-plans',
      });
    }

    // Pending sync items
    if (pendingSyncCount > 0) {
      list.push({
        id: 'notif-sync-pending',
        type: 'INFO',
        title: `${pendingSyncCount} Offline Ledger Entries Queued`,
        description: 'Local transactions are safely stored in IndexedDB and awaiting cloud synchronization.',
        timeLabel: 'Sync Engine',
        href: '/desk/migration',
      });
    }

    // Recent receipts
    for (const rcp of safeReceipts.slice(-2).reverse()) {
      list.push({
        id: `notif-rcp-${rcp.id}`,
        type: 'SUCCESS',
        title: `Receipt Issued: ${rcp.receiptNumber}`,
        description: `${formatGHS(rcp.amountPaidGhs)} received from ${rcp.customerName} via ${rcp.paymentMethod}.`,
        timeLabel: 'Verified POS',
        href: '/desk/accounts?tab=RECEIPTS',
      });
    }

    return list.filter((item) => !dismissedNotifIds.includes(item.id));
  }, [lots, receipts, pendingSyncCount, dismissedNotifIds]);

  // Parse Staff Identity for Avatar & Dropdown
  const staffProfile = useMemo(() => {
    const match = currentStaffName.match(/^([^(]+)\s*(?:\(([^)]+)\))?/);
    const name = match ? match[1].trim() : currentStaffName;
    const title = match && match[2] ? match[2].trim() : 'Executive Operations';
    const parts = name.split(' ').filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      name,
      title,
      initials,
      email: 'k.boateng@amenmart.gh',
      staffId: 'AM-EXEC-001',
    };
  }, [currentStaffName]);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(item.href);
  };

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;

      const img = new window.Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setStaffAvatarUrl(result);
          return;
        }

        // Center-crop square for crisp executive avatar display
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setStaffAvatarUrl(compressedDataUrl);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <header className="h-[76px] shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 select-none">
        {/* Left Cluster: Mobile Menu + Compact Brand (when sidebar collapsed/mobile) + Global Search (Ctrl+K) */}
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={toggleMobileOpen}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Far-left AmenDesk logo fallback on mobile or when sidebar is collapsed */}
          <Link
            href="/desk"
            className={`items-center gap-2.5 shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800 ${
              collapsed ? 'flex' : 'flex lg:hidden'
            }`}
            title="AmenDesk ERP"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-indigo-600/30">
              AM
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="font-sans font-black text-sm tracking-tight text-slate-950 dark:text-white">
                  AmenDesk
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                  ERP
                </span>
              </div>
            </div>
          </Link>

          {/* 1. Global Search Bar (Ctrl+K) */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              setNotificationsOpen(false);
              setStaffMenuOpen(false);
            }}
            className="group relative flex items-center justify-between w-full max-w-md h-11 px-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/70 transition-all cursor-pointer shadow-2xs"
            aria-label="Global ERP Search (Ctrl+K)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                Search lots, clients, receipts, vehicles...
              </span>
            </div>

            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 shadow-2xs shrink-0 ml-2">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Cluster: High-Contrast Clock & Date + Theme + Notification Bell + Staff Avatar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* 2. High-Contrast Live Clock & Date */}
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 border-l border-r border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1 leading-none">
                <span className="text-[19px] font-black tracking-tight text-slate-950 dark:text-white tabular-nums">
                  {formattedClock.hoursMinutes}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-indigo-300">
                  {formattedClock.ampm}
                </span>
                <span className="text-[12px] font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                  :{formattedClock.seconds}
                </span>
              </div>
              <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 tracking-tight mt-1 leading-none whitespace-nowrap">
                {formattedClock.dateStr}
              </p>
            </div>
          </div>

          {/* Connectivity & Sync Status Pill (Compact ERP Telemetry) */}
          <button
            type="button"
            onClick={() => void triggerManualSync()}
            title={
              isOnline
                ? 'Online Terminal — Click to sync with central server'
                : 'Offline Yard Mode — Transactions queued in local IndexedDB'
            }
            className={`hidden xl:flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800/80'
                : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>
              {pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Synced'}
            </span>
          </button>

          {/* Segmented High-Contrast Theme Switcher */}
          <div
            className="hidden sm:flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80"
            role="group"
            aria-label="Color theme switcher"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              title="Light Mode"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              aria-label="Switch to Light Mode"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              title="Dark Mode"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              aria-label="Switch to Dark Mode"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>

          {/* 4. Notification Bell with Live Operational Alerts Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setStaffMenuOpen(false);
              }}
              className="relative h-11 w-11 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      ERP Operational Alerts
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {notifications.length} Active
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDismissedNotifIds((prev) => [
                          ...prev,
                          ...notifications.map((n) => n.id),
                        ])
                      }
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        All caught up!
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        No pending operational alerts or overdue settlements.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3"
                      >
                        <div
                          className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                            item.type === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                              : item.type === 'WARNING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                              : item.type === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                          }`}
                        >
                          {item.type === 'CRITICAL' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : item.type === 'WARNING' ? (
                            <Clock className="h-4 w-4" />
                          ) : item.type === 'SUCCESS' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {item.timeLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDismissedNotifIds((prev) => [...prev, item.id])
                              }
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Link
                            href={item.href}
                            onClick={() => setNotificationsOpen(false)}
                            className="block mt-0.5 group"
                          >
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <Link
                    href="/desk/payment-plans"
                    onClick={() => setNotificationsOpen(false)}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>14-Day Settlement Watchlist</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/desk/accounts?tab=RECEIPTS"
                    onClick={() => setNotificationsOpen(false)}
                    className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Receipts Ledger
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. Staff Avatar with Dropdown & Profile Photo Upload */}
          <div ref={staffRef} className="relative">
            {/* Hidden file input for offline-persistent staff profile photo upload */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
              aria-label="Upload staff profile photo"
            />

            <button
              type="button"
              onClick={() => {
                setStaffMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 transition-all cursor-pointer"
              aria-label="Staff Profile & Terminal Menu"
            >
              <div className="relative">
                {staffAvatarUrl ? (
                  <Image
                    src={staffAvatarUrl}
                    alt={staffProfile.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 rounded-xl object-cover shadow-xs ring-2 ring-white dark:ring-slate-900"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
                    {staffProfile.initials}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <p className="text-xs font-black text-slate-950 dark:text-white leading-tight truncate max-w-[130px]">
                  {staffProfile.name}
                </p>
                <p className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 leading-tight truncate max-w-[130px]">
                  {staffProfile.title}
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                  staffMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Staff Dropdown Menu */}
            {staffMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-76 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
                {/* Staff Identity Header + Interactive Photo Uploader */}
                <div className="p-4 bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      title="Click to upload or change profile photo"
                      className="group/avatar relative h-12 w-12 rounded-xl overflow-hidden shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-900 cursor-pointer"
                    >
                      {staffAvatarUrl ? (
                        <Image
                          src={staffAvatarUrl}
                          alt={staffProfile.name}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white font-black text-sm flex items-center justify-center">
                          {staffProfile.initials}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="h-4 w-4" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-950 dark:text-white truncate">
                        {staffProfile.name}
                      </p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                        {staffProfile.title}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        ID: {staffProfile.staffId}
                      </p>
                    </div>
                  </div>

                  {/* Profile Photo Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{staffAvatarUrl ? 'Change Photo' : 'Upload Profile Photo'}</span>
                    </button>

                    {staffAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setStaffAvatarUrl(null)}
                        title="Remove profile photo"
                        className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        aria-label="Remove profile photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Terminal Status Bar inside Dropdown */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {isOnline ? 'Online Terminal' : 'Offline Yard Mode'}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {pendingSyncCount > 0 ? `${pendingSyncCount} unsynced` : '100% Synced'}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Shortcuts */}
                <div className="p-2 space-y-0.5">
                  <Link
                    href="/desk/payments"
                    onClick={() => setStaffMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Payment Terminal (POS)</span>
                  </Link>
                  <Link
                    href="/desk/accounts"
                    onClick={() => setStaffMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Accounting &amp; General Ledger</span>
                  </Link>
                  <Link
                    href="/desk/migration"
                    onClick={() => setStaffMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Data Sync &amp; Local Backup</span>
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setStaffMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Public Website Showroom</span>
                  </Link>
                </div>

                {/* System & Terminal Controls */}
                <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      void triggerManualSync();
                      setStaffMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Synchronize Terminal Now</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffMenuOpen(false);
                      if (confirm('Reset local AmenDesk database to fresh demonstration seed data?')) {
                        void resetDatabase();
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Demo Dataset</span>
                    </span>
                    <span className="text-[10px] font-mono">Seed</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Command Palette Modal (Ctrl+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                      searchResults.length > 0 ? (prev + 1) % searchResults.length : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                      searchResults.length > 0
                        ? (prev - 1 + searchResults.length) % searchResults.length
                        : 0
                    );
                  } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
                    e.preventDefault();
                    handleSelectSearchResult(searchResults[selectedIndex]);
                  }
                }}
                placeholder="Search auction lots, clients, Ghana Card, receipts, vehicles, land, or modules..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer shrink-0"
              >
                ESC
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-[420px] overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>
                  {searchQuery.trim()
                    ? `Matching ERP Records (${searchResults.length})`
                    : 'Quick ERP Navigation & Command Shortcuts'}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  <span>Offline IndexedDB Search</span>
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No matching records found for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching by lot number (e.g. LOT-2025), buyer name, receipt number, or vehicle make.
                  </p>
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {item.category === 'LOT' ? (
                            <Gavel className="h-4 w-4" />
                          ) : item.category === 'CLIENT' ? (
                            <Users className="h-4 w-4" />
                          ) : item.category === 'RECEIPT' ? (
                            <Receipt className="h-4 w-4" />
                          ) : item.category === 'ASSET' ? (
                            <Car className="h-4 w-4" />
                          ) : (
                            <LayoutDashboard className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-extrabold truncate ${
                              isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p
                            className={`text-[11px] truncate ${
                              isSelected
                                ? 'text-indigo-100'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">↑↓</strong> to navigate
                </span>
                <span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">↵</strong> to open
                </span>
                <span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">ESC</strong> to close
                </span>
              </div>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                AmenDesk Command Center
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

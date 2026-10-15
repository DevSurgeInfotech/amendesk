'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  Gavel,
  Car,
  MapPin,
  Building2,
  Phone,
  Sun,
  Moon,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Car Showroom', href: '/showroom', icon: Car },
  { label: 'Auction Notices', href: '/auctions', icon: Gavel },
  { label: 'Land', href: '/land', icon: MapPin },
  { label: 'Properties', href: '/properties', icon: Building2 },
  { label: 'Contact', href: '/contact', icon: Phone },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Top Announcement Bar */}
      <div className="bg-indigo-900 text-indigo-100 text-[11px] py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">
              Amen Mart — Government &amp; Judicial Service Registered Auctioneers
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-indigo-200">
            <span>Accra &bull; Tema Heavy Industrial Area</span>
            <span>Tel: +233 24 412 8990</span>
            <Link
              href="/desk"
              className="text-white bg-indigo-700 hover:bg-indigo-600 px-2.5 py-0.5 rounded font-bold transition-colors flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              <span>Staff AmenDesk ERP</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg">
            AM
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              AMEN MART
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Auctioneers &bull; Showroom &bull; Realty
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action button & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          <Link
            href="/showroom"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Explore Showroom
          </Link>
        </div>
      </div>
    </header>
  );
}

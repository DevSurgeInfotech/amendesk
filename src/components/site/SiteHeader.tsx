'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gavel,
  Car,
  MapPin,
  Building2,
  Phone,
  ShieldCheck,
  Menu,
  X,
  Award,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * Pixel-accurate, high-contrast SVG representation of the National Flag of Ghana:
 * Red, Gold/Yellow, and Green horizontal stripes with the central Black Star.
 */
export function GhanaFlag({ className = 'h-3.5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={clsx('inline-block shrink-0 rounded-[2px] shadow-2xs overflow-hidden ring-1 ring-slate-900/10', className)}
      aria-label="Flag of Ghana"
      role="img"
    >
      {/* Red Stripe (Top) */}
      <rect width="24" height="5.333" fill="#CE1126" />
      {/* Gold/Yellow Stripe (Middle) */}
      <rect y="5.333" width="24" height="5.334" fill="#FCD116" />
      {/* Green Stripe (Bottom) */}
      <rect y="10.667" width="24" height="5.333" fill="#006B3F" />
      {/* Central Black Star */}
      <polygon
        points="12,5.6 12.56,7.22 14.28,7.26 12.91,8.30 13.41,9.94 12,8.96 10.59,9.94 11.09,8.30 9.72,7.26 11.44,7.22"
        fill="#000000"
      />
    </svg>
  );
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Auction Notices', href: '/auctions', icon: Gavel },
  { label: 'Car Showroom', href: '/showroom', icon: Car },
  { label: 'Properties', href: '/properties', icon: Building2 },
  { label: 'Land', href: '/land', icon: MapPin },
  { label: 'About Us', href: '/about', icon: Award },
  { label: 'Contact', href: '/contact', icon: Phone },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Top Announcement Bar - Clean Light & Dark Styling */}
      <div className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] py-1.5 px-6 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Statutory Authority Statement with Ghana Flag */}
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Amen Mart Auctioning Services &bull; Approved by Auctioneers Registration Board &amp; Ministry of the Interior
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
              title="Republic of Ghana Registered Auctioneer"
            >
              <GhanaFlag className="h-2.5 w-4" />
              <span>GH</span>
            </span>
          </div>

          {/* Operational Contacts & Trailing Ghana Flag at End of Strip */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] text-slate-600 dark:text-slate-400">
            <span>Gbawe, Flower Junction &bull; Online Bidding</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">&bull;</span>
            <span>Tel: 0548517277 / 0558314744</span>
            <div
              className="flex items-center gap-1.5 pl-3 border-l border-slate-300 dark:border-slate-700 shrink-0"
              title="Republic of Ghana"
            >
              <GhanaFlag className="h-3 w-4.5" />
              <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wider text-[10px]">GHANA</span>
            </div>
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
              Auctioning Services &bull; Showroom &bull; Realty
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
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
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/showroom"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            Explore Showroom
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle mobile navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-2 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {Icon && <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <Link
              href="/showroom"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Explore Showroom
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;

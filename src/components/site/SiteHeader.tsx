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

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about', icon: Award },
  { label: 'Auction Notices', href: '/auctions', icon: Gavel },
  { label: 'Car Showroom', href: '/showroom', icon: Car },
  { label: 'Properties', href: '/properties', icon: Building2 },
  { label: 'Land', href: '/land', icon: MapPin },
  { label: 'Contact', href: '/contact', icon: Phone },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Announcement Bar - Clean Light Styling */}
      <div className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] py-1.5 px-6 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              Amen Mart Auctioning Services &bull; Approved by Auctioneers Registration Board &amp; Ministry of the Interior &bull; Led by Dr. Francis Kwaku Yeboah
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-600">
            <span>Accra Live Auctions &bull; Online Bidding</span>
            <span>Tel: +233 24 412 8990</span>
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
            <span className="text-xl font-black tracking-tight text-slate-900">
              AMEN MART
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600">
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
                    ? 'text-indigo-600 bg-indigo-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            Explore Showroom
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle mobile navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-2 shadow-lg">
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
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {Icon && <Icon className="h-4 w-4 text-indigo-600" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/showroom"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold"
            >
              Explore Showroom
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

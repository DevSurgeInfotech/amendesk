'use client';

import React from 'react';
import Link from 'next/link';
import {
  TotalCollectionsIcon,
  DrawerCashTillIcon,
  MoMoPhoneIcon,
  BankWiresIcon,
  ReceivablesClockIcon,
  AuctionGavelIcon,
  OverdueAlertIcon,
  PaystackCardIcon,
  EscrowScaleIcon,
  MarginProfitIcon,
} from './CardIcons';

export type GlassCardTheme =
  | 'amber'
  | 'emerald'
  | 'indigo'
  | 'purple'
  | 'orange'
  | 'slate'
  | 'blue'
  | 'rose';

export const CARD_THEME_CYCLE: GlassCardTheme[] = ['amber', 'emerald', 'indigo', 'purple'];

/**
 * Resolves a theme from a theme name or numeric index (repeating modulo 4 across cards)
 */
export function resolveCardTheme(theme?: GlassCardTheme | number): GlassCardTheme {
  if (typeof theme === 'number') {
    return CARD_THEME_CYCLE[Math.abs(theme) % CARD_THEME_CYCLE.length];
  }
  return theme || 'indigo';
}

export type CardIconName =
  | 'collections'
  | 'cash'
  | 'momo'
  | 'bank'
  | 'receivables'
  | 'gavel'
  | 'alert'
  | 'card'
  | 'scale'
  | 'profit';

export function renderNamedCardIcon(name: CardIconName, className = 'h-5 w-5') {
  switch (name) {
    case 'collections':
      return <TotalCollectionsIcon className={className} />;
    case 'cash':
      return <DrawerCashTillIcon className={className} />;
    case 'momo':
      return <MoMoPhoneIcon className={className} />;
    case 'bank':
      return <BankWiresIcon className={className} />;
    case 'receivables':
      return <ReceivablesClockIcon className={className} />;
    case 'gavel':
      return <AuctionGavelIcon className={className} />;
    case 'alert':
      return <OverdueAlertIcon className={className} />;
    case 'card':
      return <PaystackCardIcon className={className} />;
    case 'scale':
      return <EscrowScaleIcon className={className} />;
    case 'profit':
      return <MarginProfitIcon className={className} />;
    default:
      return null;
  }
}

interface ThemeConfig {
  cardClasses: string;
  topStreak?: string;
  glowOrb?: string;
  iconBadge: string;
  titleText: string;
  valueText: string;
  subtitleText: string;
  badge: string;
}

/**
 * Pure Solid Color Themes - Saturated, bold, distinct colors with high-contrast white text & circular badges.
 * Each color is semantically curated for AmenDesk:
 * - amber: 14-Day Hammer Settlement Countdown & Receivables Window
 * - emerald: Verified Multi-Channel Collections & Liquid Treasury (Cash, MoMo, Bank, Card)
 * - indigo: Amen Mart Enterprise Asset Portfolio Valuation (Showroom, Land, Property & Auctions)
 * - purple: Statutory Judicial Auction Commission (7%) & Dealership Gross Profit
 * - orange: Urgent Action & Active Intake
 * - blue: Bank Wires & Escrow Clearance Queue
 * - rose: Overdue Hammer Settlement Expirations & Forfeiture Risk
 * - slate: General Ledger, Staff Registers & Audit Balance
 */
const pureThemeStyles: Record<GlassCardTheme, ThemeConfig> = {
  amber: {
    cardClasses:
      'bg-amber-600 border border-amber-500/40 text-white shadow-md hover:shadow-lg hover:border-amber-400/60 ' +
      'dark:bg-amber-700 dark:border-amber-600/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  emerald: {
    cardClasses:
      'bg-emerald-700 border border-emerald-600/40 text-white shadow-md hover:shadow-lg hover:border-emerald-500/60 ' +
      'dark:bg-emerald-800 dark:border-emerald-700/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  indigo: {
    cardClasses:
      'bg-indigo-700 border border-indigo-600/40 text-white shadow-md hover:shadow-lg hover:border-indigo-500/60 ' +
      'dark:bg-indigo-800 dark:border-indigo-700/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  purple: {
    cardClasses:
      'bg-purple-800 border border-purple-700/40 text-white shadow-md hover:shadow-lg hover:border-purple-600/60 ' +
      'dark:bg-purple-900 dark:border-purple-800/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  orange: {
    cardClasses:
      'bg-orange-600 border border-orange-500/40 text-white shadow-md hover:shadow-lg hover:border-orange-400/60 ' +
      'dark:bg-orange-700 dark:border-orange-600/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  blue: {
    cardClasses:
      'bg-blue-700 border border-blue-600/40 text-white shadow-md hover:shadow-lg hover:border-blue-500/60 ' +
      'dark:bg-blue-800 dark:border-blue-700/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  rose: {
    cardClasses:
      'bg-rose-700 border border-rose-600/40 text-white shadow-md hover:shadow-lg hover:border-rose-500/60 ' +
      'dark:bg-rose-800 dark:border-rose-700/40',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
  slate: {
    cardClasses:
      'bg-slate-800 border border-slate-700/50 text-white shadow-md hover:shadow-lg hover:border-slate-600/60 ' +
      'dark:bg-slate-900 dark:border-slate-800/60',
    iconBadge:
      'h-10 w-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-white/25 group-hover:scale-105 transition-all duration-200',
    titleText: 'text-white/85',
    valueText: 'text-white',
    subtitleText: 'text-white/85',
    badge: 'bg-white/20 text-white border border-white/30',
  },
};

const glassThemeStyles: Record<GlassCardTheme, ThemeConfig> = {
  indigo: {
    cardClasses:
      'bg-gradient-to-br from-indigo-50/75 via-white/80 to-purple-50/50 ' +
      'border-indigo-200/70 hover:border-indigo-400 ' +
      'shadow-[0_8px_24px_rgba(79,70,229,0.06)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.16)] ' +
      'dark:from-indigo-950/40 dark:via-slate-900/85 dark:to-purple-950/25 ' +
      'dark:border-indigo-500/25 dark:hover:border-indigo-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(99,102,241,0.22)]',
    topStreak: 'via-indigo-400/60 dark:via-indigo-400/30',
    glowOrb: 'bg-indigo-500/12 dark:bg-indigo-500/22',
    iconBadge:
      'bg-indigo-500/10 text-indigo-600 border-indigo-200/80 ' +
      'dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/35',
    titleText: 'text-indigo-950/70 dark:text-indigo-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-indigo-700/80 dark:text-indigo-300/80',
    badge: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  },
  emerald: {
    cardClasses:
      'bg-gradient-to-br from-emerald-50/75 via-white/80 to-teal-50/50 ' +
      'border-emerald-200/70 hover:border-emerald-400 ' +
      'shadow-[0_8px_24px_rgba(16,185,129,0.06)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.16)] ' +
      'dark:from-emerald-950/40 dark:via-slate-900/85 dark:to-teal-950/25 ' +
      'dark:border-emerald-500/25 dark:hover:border-emerald-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(16,185,129,0.22)]',
    topStreak: 'via-emerald-400/60 dark:via-emerald-400/30',
    glowOrb: 'bg-emerald-500/12 dark:bg-emerald-500/22',
    iconBadge:
      'bg-emerald-500/10 text-emerald-600 border-emerald-200/80 ' +
      'dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/35',
    titleText: 'text-emerald-950/70 dark:text-emerald-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-emerald-700/80 dark:text-emerald-300/80',
    badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  },
  amber: {
    cardClasses:
      'bg-gradient-to-br from-amber-50/75 via-white/80 to-yellow-50/50 ' +
      'border-amber-200/70 hover:border-amber-400 ' +
      'shadow-[0_8px_24px_rgba(245,158,11,0.06)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.16)] ' +
      'dark:from-amber-950/40 dark:via-slate-900/85 dark:to-yellow-950/25 ' +
      'dark:border-amber-500/25 dark:hover:border-amber-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(245,158,11,0.22)]',
    topStreak: 'via-amber-400/60 dark:via-amber-400/30',
    glowOrb: 'bg-amber-500/12 dark:bg-amber-500/22',
    iconBadge:
      'bg-amber-500/10 text-amber-600 border-amber-200/80 ' +
      'dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/35',
    titleText: 'text-amber-950/70 dark:text-amber-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-amber-700/80 dark:text-amber-300/80',
    badge: 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  },
  blue: {
    cardClasses:
      'bg-gradient-to-br from-sky-50/75 via-white/80 to-blue-50/50 ' +
      'border-sky-200/70 hover:border-sky-400 ' +
      'shadow-[0_8px_24px_rgba(2,132,199,0.06)] hover:shadow-[0_12px_32px_rgba(2,132,199,0.16)] ' +
      'dark:from-sky-950/40 dark:via-slate-900/85 dark:to-blue-950/25 ' +
      'dark:border-sky-500/25 dark:hover:border-sky-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(2,132,199,0.22)]',
    topStreak: 'via-sky-400/60 dark:via-sky-400/30',
    glowOrb: 'bg-sky-500/12 dark:bg-sky-500/22',
    iconBadge:
      'bg-sky-500/10 text-sky-600 border-sky-200/80 ' +
      'dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/35',
    titleText: 'text-sky-950/70 dark:text-sky-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-sky-700/80 dark:text-sky-300/80',
    badge: 'bg-sky-100/80 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  },
  rose: {
    cardClasses:
      'bg-gradient-to-br from-rose-50/75 via-white/80 to-red-50/50 ' +
      'border-rose-200/70 hover:border-rose-400 ' +
      'shadow-[0_8px_24px_rgba(225,29,72,0.06)] hover:shadow-[0_12px_32px_rgba(225,29,72,0.16)] ' +
      'dark:from-rose-950/40 dark:via-slate-900/85 dark:to-red-950/25 ' +
      'dark:border-rose-500/25 dark:hover:border-rose-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(225,29,72,0.22)]',
    topStreak: 'via-rose-400/60 dark:via-rose-400/30',
    glowOrb: 'bg-rose-500/12 dark:bg-rose-500/22',
    iconBadge:
      'bg-rose-500/10 text-rose-600 border-rose-200/80 ' +
      'dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/35',
    titleText: 'text-rose-950/70 dark:text-rose-200/75',
    valueText: 'text-rose-600 dark:text-rose-400',
    subtitleText: 'text-rose-700/80 dark:text-rose-300/80',
    badge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  },
  purple: {
    cardClasses:
      'bg-gradient-to-br from-purple-50/75 via-white/80 to-indigo-50/50 ' +
      'border-purple-200/70 hover:border-purple-400 ' +
      'shadow-[0_8px_24px_rgba(147,51,234,0.06)] hover:shadow-[0_12px_32px_rgba(147,51,234,0.16)] ' +
      'dark:from-purple-950/40 dark:via-slate-900/85 dark:to-indigo-950/25 ' +
      'dark:border-purple-500/25 dark:hover:border-purple-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(147,51,234,0.22)]',
    topStreak: 'via-purple-400/60 dark:via-purple-400/30',
    glowOrb: 'bg-purple-500/12 dark:bg-purple-500/22',
    iconBadge:
      'bg-purple-500/10 text-purple-600 border-purple-200/80 ' +
      'dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/35',
    titleText: 'text-purple-950/70 dark:text-purple-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-purple-700/80 dark:text-purple-300/80',
    badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  },
  orange: {
    cardClasses:
      'bg-gradient-to-br from-orange-50/75 via-white/80 to-amber-50/50 ' +
      'border-orange-200/70 hover:border-orange-400 ' +
      'shadow-[0_8px_24px_rgba(234,88,12,0.06)] hover:shadow-[0_12px_32px_rgba(234,88,12,0.16)] ' +
      'dark:from-orange-950/40 dark:via-slate-900/85 dark:to-amber-950/25 ' +
      'dark:border-orange-500/25 dark:hover:border-orange-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(234,88,12,0.22)]',
    topStreak: 'via-orange-400/60 dark:via-orange-400/30',
    glowOrb: 'bg-orange-500/12 dark:bg-orange-500/22',
    iconBadge:
      'bg-orange-500/10 text-orange-600 border-orange-200/80 ' +
      'dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/35',
    titleText: 'text-orange-950/70 dark:text-orange-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-orange-700/80 dark:text-orange-300/80',
    badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  },
  slate: {
    cardClasses:
      'bg-gradient-to-br from-slate-50/75 via-white/80 to-gray-50/50 ' +
      'border-slate-200/70 hover:border-slate-400 ' +
      'shadow-[0_8px_24px_rgba(71,85,105,0.06)] hover:shadow-[0_12px_32px_rgba(71,85,105,0.16)] ' +
      'dark:from-slate-950/40 dark:via-slate-900/85 dark:to-gray-950/25 ' +
      'dark:border-slate-500/25 dark:hover:border-slate-400/50 ' +
      'dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_32px_rgba(71,85,105,0.22)]',
    topStreak: 'via-slate-400/60 dark:via-slate-400/30',
    glowOrb: 'bg-slate-500/12 dark:bg-slate-500/22',
    iconBadge:
      'bg-slate-500/10 text-slate-600 border-slate-200/80 ' +
      'dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/35',
    titleText: 'text-slate-950/70 dark:text-slate-200/75',
    valueText: 'text-slate-900 dark:text-slate-50',
    subtitleText: 'text-slate-700/80 dark:text-slate-300/80',
    badge: 'bg-slate-100/80 text-slate-700 dark:bg-slate-950/80 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
  },
};

export interface GlassCardProps {
  /**
   * Color theme: 'amber' | 'emerald' | 'indigo' | 'purple' | 'orange' | 'slate' | 'blue' | 'rose'
   * Or numeric index (cards will automatically cycle through: 0->amber, 1->emerald, 2->indigo, 3->purple)
   */
  theme?: GlassCardTheme | number;
  /**
   * Visual style variant:
   * 'pure' (default) - Solid bold saturated color background with crisp white typography and circular icon badge
   * 'glass' - Frosted glassmorphism with multi-stop gradient sheen and ambient glow orbs
   */
  variant?: 'pure' | 'glass';
  /**
   * Eyebrow title / metric label (e.g. "TODAY'S TOTAL COLLECTIONS")
   */
  title?: React.ReactNode;
  /**
   * Prominent metric figure (e.g. "GH₵0.00")
   */
  value?: React.ReactNode;
  /**
   * Helper description or status label (e.g. "Physical notes & coins in till")
   */
  subtitle?: React.ReactNode;
  /**
   * Custom SVG or React icon element
   */
  icon?: React.ReactNode;
  /**
   * Convenience shorthand to use one of the curated AmenDesk vector SVG icons
   */
  iconName?: CardIconName;
  /**
   * Optional status badge text or pill
   */
  badge?: React.ReactNode;
  /**
   * Optional percentage/trend metric
   */
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  /**
   * Optional destination link
   */
  href?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Custom additional class names
   */
  className?: string;
  /**
   * Custom body or nested components
   */
  children?: React.ReactNode;
}

/**
 * Automatically computes responsive, non-overflowing font size classes
 * based on the character length of the metric figure.
 */
function getValueFontSize(value: React.ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value).trim();
    const len = str.length;
    // Multi-million/eight-figure amounts: e.g. "GH₵17,665,000.00" (16 chars)
    if (len >= 15) {
      return 'text-lg sm:text-xl lg:text-base xl:text-lg 2xl:text-2xl';
    }
    // Hundred-thousand amounts: e.g. "GH₵928,650.00", "GH₵100,000.00" (13-14 chars)
    if (len >= 12) {
      return 'text-xl sm:text-2xl lg:text-lg xl:text-xl 2xl:text-[26px]';
    }
    // Five-figure amounts: e.g. "GH₵74,550.00" (12 chars)
    if (len >= 9) {
      return 'text-xl sm:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl';
    }
  }
  // Short counts/percentages: e.g. "203", "13", "98.2%", "GH₵0.00"
  return 'text-2xl sm:text-3xl';
}

/**
 * AmenDesk Metric Card
 * Supports pure solid color cards (default) and curated frosted glassmorphic cards.
 */
export function GlassCard({
  theme = 'indigo',
  variant = 'pure',
  title,
  value,
  subtitle,
  icon,
  iconName,
  badge,
  trend,
  href,
  onClick,
  className = '',
  children,
}: GlassCardProps) {
  const resolvedTheme = resolveCardTheme(theme);
  const isGlass = variant === 'glass';
  const cfg = isGlass ? glassThemeStyles[resolvedTheme] : pureThemeStyles[resolvedTheme];

  const resolvedIcon = icon ?? (iconName ? renderNamedCardIcon(iconName) : null);
  const valueFontSize = getValueFontSize(value);

  const cardContent = (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200 min-w-0 group ${
        isGlass ? 'border backdrop-blur-md ring-1 ring-inset ring-white/70 dark:ring-white/10' : ''
      } ${
        onClick || href ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${cfg.cardClasses} ${className}`}
    >
      {/* Top Specular Edge Sheen (Glass mode only) */}
      {isGlass && cfg.topStreak && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${cfg.topStreak} to-transparent`}
        />
      )}

      {/* Ambient Radial Glass Glow Orb (Glass mode only) */}
      {isGlass && cfg.glowOrb && (
        <div
          className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl transition-all duration-300 group-hover:scale-125 opacity-70 group-hover:opacity-100 ${cfg.glowOrb}`}
        />
      )}

      {/* Standard Metric Content if title or value is provided */}
      {(title || value || resolvedIcon) && (
        <div className="relative z-10 flex flex-col justify-between h-full min-w-0 w-full">
          {/* Header Row: Title & Circular/Glassmorphic Icon Badge */}
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0 pr-1 flex-1">
              {title && (
                <span
                  className={`block text-[11px] font-bold uppercase tracking-wider truncate ${cfg.titleText}`}
                  title={typeof title === 'string' ? title : undefined}
                >
                  {title}
                </span>
              )}
              {badge && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                  {badge}
                </span>
              )}
            </div>

            {resolvedIcon && (
              <div
                className={
                  isGlass
                    ? `p-2.5 rounded-xl border backdrop-blur-sm shadow-xs transition-transform duration-200 group-hover:scale-110 shrink-0 ${cfg.iconBadge}`
                    : cfg.iconBadge
                }
              >
                {resolvedIcon}
              </div>
            )}
          </div>

          {/* Value Figure */}
          {value !== undefined && (
            <div className="mt-3 sm:mt-4 min-w-0 w-full">
              <p
                className={`font-black font-mono tracking-tight tabular-nums truncate drop-shadow-2xs ${valueFontSize} ${cfg.valueText}`}
                title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
              >
                {value}
              </p>
            </div>
          )}

          {/* Subtitle / Helper / Trend */}
          {(subtitle || trend) && (
            <div className="mt-2.5 flex items-center justify-between text-xs min-w-0 gap-2">
              {subtitle && (
                <p className={`font-medium text-[11.5px] leading-snug line-clamp-2 min-w-0 flex-1 ${cfg.subtitleText}`}>
                  {subtitle}
                </p>
              )}
              {trend && (
                <span
                  className={
                    isGlass
                      ? `inline-flex items-center text-[11px] font-bold ml-auto shrink-0 ${
                          trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`
                      : 'inline-flex items-center text-[11px] font-bold ml-auto shrink-0 text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/25'
                  }
                >
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
              )}
            </div>
          )}

          {/* Extra Children (if any) */}
          {children && (
            <div className={`mt-3 pt-3 border-t ${isGlass ? 'border-black/5 dark:border-white/5' : 'border-white/15'}`}>
              {children}
            </div>
          )}
        </div>
      )}

      {/* Pure Container Mode if no title/value is provided */}
      {!title && !value && !resolvedIcon && children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export const PureColorCard = GlassCard;
export const PureCard = GlassCard;
export type PureColorCardProps = GlassCardProps;

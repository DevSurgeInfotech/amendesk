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

export type GlassCardTheme = 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose';

export const CARD_THEME_CYCLE: GlassCardTheme[] = ['indigo', 'emerald', 'amber', 'blue'];

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
  topStreak: string;
  glowOrb: string;
  iconBadge: string;
  titleText: string;
  valueText: string;
  subtitleText: string;
  badge: string;
}

const themeStyles: Record<GlassCardTheme, ThemeConfig> = {
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
};

export interface GlassCardProps {
  /**
   * Color theme: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose'
   * Or numeric index (cards will automatically cycle through the 4 distinct colors: 0->indigo, 1->emerald, 2->amber, 3->blue)
   */
  theme?: GlassCardTheme | number;
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
 * AmenDesk Curated Glassmorphic Card
 * Distinct 4-color repeating palette, authentic frosted glass blur, specular highlights, and ambient glow.
 */
export function GlassCard({
  theme = 'indigo',
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
  const cfg = themeStyles[resolvedTheme];

  const resolvedIcon = icon ?? (iconName ? renderNamedCardIcon(iconName) : null);

  const cardContent = (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md p-5 ring-1 ring-inset ring-white/70 dark:ring-white/10 transition-all duration-200 group ${
        onClick || href ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${cfg.cardClasses} ${className}`}
    >
      {/* Top Specular Edge Sheen */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${cfg.topStreak} to-transparent`}
      />

      {/* Ambient Radial Glass Glow Orb */}
      <div
        className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl transition-all duration-300 group-hover:scale-125 opacity-70 group-hover:opacity-100 ${cfg.glowOrb}`}
      />

      {/* Standard Metric Content if title or value is provided */}
      {(title || value || resolvedIcon) && (
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header Row: Title & Glassmorphic Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              {title && (
                <span className={`block text-[11px] font-bold uppercase tracking-wider ${cfg.titleText}`}>
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
                className={`p-2.5 rounded-xl border backdrop-blur-sm shadow-xs transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${cfg.iconBadge}`}
              >
                {resolvedIcon}
              </div>
            )}
          </div>

          {/* Value Figure */}
          {value !== undefined && (
            <div className="mt-3">
              <p className={`text-2xl font-black font-mono tracking-tight ${cfg.valueText}`}>
                {value}
              </p>
            </div>
          )}

          {/* Subtitle / Helper / Trend */}
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center justify-between text-xs">
              {subtitle && (
                <p className={`font-medium text-[11.5px] leading-snug ${cfg.subtitleText}`}>
                  {subtitle}
                </p>
              )}
              {trend && (
                <span
                  className={`inline-flex items-center text-[11px] font-bold ml-auto ${
                    trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
              )}
            </div>
          )}

          {/* Extra Children (if any) */}
          {children && <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">{children}</div>}
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

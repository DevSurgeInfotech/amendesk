'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { formatGHS } from '@/lib/utils/currency';

export interface BusinessLineValue {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
  valueGhs: number;
  unitCount: number;
  availableCount: number;
  unitNoun: string; // e.g. "lots", "cars", "parcels", "units"
}

interface PortfolioMixChartProps {
  lines: BusinessLineValue[];
}

/**
 * Ranked horizontal bars – easier to compare than donut slices, and every
 * business line is visible at once (no toggles).
 */
export function PortfolioMixChart({ lines }: PortfolioMixChartProps) {
  const totalGhs = lines.reduce((acc, l) => acc + l.valueGhs, 0);
  const totalUnits = lines.reduce((acc, l) => acc + l.unitCount, 0);
  const ranked = [...lines].sort((a, b) => b.valueGhs - a.valueGhs);

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Inventory Value by Business Line
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Where the asset value sits across Auctions, Showroom, Land &amp; Property
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total value
          </span>
          <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 leading-tight">
            {formatGHS(totalGhs)}
          </p>
          <span className="text-[10px] text-slate-500">{totalUnits} items on record</span>
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {ranked.map((line) => {
          const percent = totalGhs > 0 ? (line.valueGhs / totalGhs) * 100 : 0;
          const Icon = line.icon;
          return (
            <li key={line.id}>
              <Link
                href={line.href}
                className="group block rounded-xl px-3 py-2.5 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${line.color}1a`, color: line.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {line.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {line.unitCount} {line.unitNoun} &bull; {line.availableCount} available
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      {formatGHS(line.valueGhs)}
                    </span>
                    <span className="block text-[11px] font-bold text-slate-400">
                      {Math.round(percent)}% of total
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${line.valueGhs > 0 ? Math.max(percent, 1.5) : 0}%`,
                      backgroundColor: line.color,
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

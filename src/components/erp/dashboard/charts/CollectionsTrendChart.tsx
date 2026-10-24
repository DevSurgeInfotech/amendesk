'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PaymentMethod } from '@/lib/types';
import { formatGHS, formatGHSCompact } from '@/lib/utils/currency';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

export interface DailyChannelPoint {
  dateKey: string; // YYYY-MM-DD (UTC / Ghana time)
  dayLabel: string; // e.g. "05"
  monthLabel: string; // e.g. "Oct"
  weekdayLabel: string; // e.g. "Tue"
  isToday: boolean;
  totalGhs: number;
  receiptCount: number;
  byChannel: Record<PaymentMethod, number>;
}

export interface CollectionsTrendData {
  days: DailyChannelPoint[];
  previousPeriodTotalGhs: number;
  rangeLabel: string; // e.g. "08 Oct – 21 Oct"
}

interface CollectionsTrendChartProps {
  data: CollectionsTrendData | null;
}

/** Fixed channel order (bottom → top of each stacked column) and palette. */
export const CHANNEL_CONFIG: Array<{ key: PaymentMethod; label: string; color: string }> = [
  { key: 'CASH', label: 'Cash', color: '#10b981' },
  { key: 'MOMO', label: 'Mobile Money', color: '#f59e0b' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', color: '#6366f1' },
  { key: 'CARD_PAYSTACK', label: 'Card (Paystack)', color: '#0ea5e9' },
];

/** Rounds the axis maximum up to a "nice" number so gridlines read cleanly. */
function niceAxisMax(maxValue: number, tickCount: number): number {
  if (maxValue <= 0) return tickCount;
  const rawStep = maxValue / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((step) => step >= rawStep) ??
    10 * magnitude;
  return niceStep * tickCount;
}

/** Compact value without the currency symbol, for labels sitting on top of columns. */
function shortAmount(value: number): string {
  return formatGHSCompact(value).replace('GH₵ ', '');
}

export function CollectionsTrendChart({ data }: CollectionsTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const days = data?.days ?? [];
  const periodTotal = days.reduce((acc, d) => acc + d.totalGhs, 0);

  const previousTotal = data?.previousPeriodTotalGhs ?? 0;
  const deltaPercent =
    previousTotal > 0 ? ((periodTotal - previousTotal) / previousTotal) * 100 : null;

  const channelTotals = CHANNEL_CONFIG.map((channel) => {
    const amount = days.reduce((acc, d) => acc + d.byChannel[channel.key], 0);
    return {
      ...channel,
      amount,
      percent: periodTotal > 0 ? Math.round((amount / periodTotal) * 100) : 0,
    };
  });

  const tickCount = 3;
  // 12% headroom keeps the value label of the tallest column inside the card
  const axisMax = niceAxisMax(Math.max(...days.map((d) => d.totalGhs), 0) * 1.12, tickCount);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (axisMax / tickCount) * i);

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            14-Day Collections
          </h3>
          {data?.rangeLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data.rangeLabel}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:text-right shrink-0">
          <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 leading-tight">
            {formatGHS(periodTotal)}
          </p>
          <DeltaChip deltaPercent={deltaPercent} hasData={days.length > 0} />
        </div>
      </div>

      {/* Chart */}
      {days.length === 0 || periodTotal === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            No collections recorded in this period
          </span>
          <span>Receipts issued at the desk or in the field will appear here automatically.</span>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Y-axis labels */}
          <div className="relative w-12 shrink-0 h-52 mb-9 hidden sm:block" aria-hidden="true">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 translate-y-1/2 text-[10px] font-mono text-slate-400"
                style={{ bottom: `${(tick / axisMax) * 100}%` }}
              >
                {tick === 0 ? '0' : shortAmount(tick)}
              </span>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {/* Plot area */}
            <div className="relative h-52">
              {/* Gridlines */}
              {ticks.map((tick) => (
                <div
                  key={tick}
                  aria-hidden="true"
                  className={`absolute inset-x-0 border-t ${
                    tick === 0
                      ? 'border-slate-300 dark:border-slate-700'
                      : 'border-dashed border-slate-100 dark:border-slate-800'
                  }`}
                  style={{ bottom: `${(tick / axisMax) * 100}%` }}
                />
              ))}

              {/* Columns */}
              <div className="absolute inset-0 flex items-end">
                {days.map((day, index) => {
                  const heightPercent = (day.totalGhs / axisMax) * 100;
                  const isActive = activeIndex === index;
                  const ariaLabel = `${day.weekdayLabel} ${day.dayLabel} ${day.monthLabel}: ${formatGHS(
                    day.totalGhs
                  )} from ${day.receiptCount} receipt${day.receiptCount === 1 ? '' : 's'}`;

                  return (
                    <div
                      key={day.dateKey}
                      role="group"
                      tabIndex={0}
                      aria-label={ariaLabel}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(null)}
                      className={`relative flex-1 h-full flex flex-col justify-end items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isActive ? 'bg-slate-50 dark:bg-slate-800/40' : ''
                      }`}
                    >
                      <div
                        className="relative w-[60%] max-w-9 min-w-1.5 shrink-0 transition-[height] duration-300"
                        style={{
                          height: day.totalGhs > 0 ? `max(${heightPercent}%, 4px)` : '0px',
                        }}
                      >
                        {/* Value label sits on top of every non-empty column */}
                        {day.totalGhs > 0 && (
                          <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {shortAmount(day.totalGhs)}
                          </span>
                        )}

                        {/* Stacked channel segments */}
                        <div className="h-full flex flex-col-reverse rounded-t-md overflow-hidden">
                          {CHANNEL_CONFIG.map((channel) => {
                            const amount = day.byChannel[channel.key];
                            if (amount <= 0) return null;
                            return (
                              <div
                                key={channel.key}
                                style={{
                                  height: `${(amount / day.totalGhs) * 100}%`,
                                  backgroundColor: channel.color,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Detail popover (optional extra; all key numbers are already visible) */}
                      {isActive && day.totalGhs > 0 && (
                        <div
                          className={`absolute bottom-full mb-2 z-10 w-48 pointer-events-none rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-[11px] p-2.5 shadow-lg border border-slate-700 ${
                            index < 3 ? 'left-0' : index > days.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                          }`}
                        >
                          <p className="font-bold text-slate-200 mb-1.5">
                            {day.weekdayLabel} {day.dayLabel} {day.monthLabel} &bull; {day.receiptCount}{' '}
                            receipt{day.receiptCount === 1 ? '' : 's'}
                          </p>
                          {CHANNEL_CONFIG.filter((c) => day.byChannel[c.key] > 0).map((c) => (
                            <div key={c.key} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.label}
                              </span>
                              <span className="font-mono">{formatGHSCompact(day.byChannel[c.key])}</span>
                            </div>
                          ))}
                          <div className="flex justify-between mt-1.5 pt-1.5 border-t border-slate-700 font-bold">
                            <span>Total</span>
                            <span className="font-mono text-emerald-400">{formatGHS(day.totalGhs)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex h-9 pt-1.5" aria-hidden="true">
              {days.map((day) => (
                <div key={day.dateKey} className="flex-1 text-center leading-tight">
                  <span
                    className={`block text-[10px] font-mono ${
                      day.isToday
                        ? 'font-black text-indigo-600 dark:text-indigo-400'
                        : day.totalGhs > 0
                          ? 'font-semibold text-slate-600 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <span
                    className={`hidden sm:block text-[9px] uppercase ${
                      day.isToday ? 'font-bold text-indigo-500' : 'text-slate-400'
                    }`}
                  >
                    {day.isToday ? 'Today' : day.weekdayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Channel breakdown – doubles as the chart legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {channelTotals.map((channel) => (
          <div key={channel.key} className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: channel.color }} />
              <span className="truncate">{channel.label}</span>
              <span className="ml-auto font-bold font-mono text-slate-400">{channel.percent}%</span>
            </div>
            <p className="mt-0.5 text-sm font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
              {formatGHS(channel.amount)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-3">
        <Link
          href="/desk/payments?view=collections"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View all receipts</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function DeltaChip({ deltaPercent, hasData }: { deltaPercent: number | null; hasData: boolean }) {
  if (!hasData || deltaPercent === null) {
    return (
      <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500">
        <Minus className="h-3 w-3" />
        No prior-period data
      </span>
    );
  }

  const isUp = deltaPercent >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={`mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isUp
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
      }`}
      title="Compared with the previous 14 days"
    >
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}
      {Math.round(deltaPercent)}% vs prior 14 days
    </span>
  );
}

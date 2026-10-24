'use client';

import Link from 'next/link';
import { formatGHS } from '@/lib/utils/currency';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export type AgingBucketId = 'NOT_DUE' | 'DUE_THIS_WEEK' | 'OVERDUE_SHORT' | 'OVERDUE_LONG';

export interface AgingBucket {
  id: AgingBucketId;
  label: string;
  hint: string;
  amountGhs: number;
  count: number;
  color: string;
  isOverdue: boolean;
}

interface ReceivablesAgingChartProps {
  buckets: AgingBucket[];
}

export function ReceivablesAgingChart({ buckets }: ReceivablesAgingChartProps) {
  const totalGhs = buckets.reduce((acc, b) => acc + b.amountGhs, 0);
  const totalCount = buckets.reduce((acc, b) => acc + b.count, 0);
  const overdueGhs = buckets.filter((b) => b.isOverdue).reduce((acc, b) => acc + b.amountGhs, 0);
  const overduePercent = totalGhs > 0 ? Math.round((overdueGhs / totalGhs) * 100) : 0;

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Receivables Aging</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCount} open balance{totalCount === 1 ? '' : 's'}
          </p>
        </div>
        <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 leading-tight shrink-0">
          {formatGHS(totalGhs)}
        </p>
      </div>

      {totalGhs === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-xs text-slate-400">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            No outstanding balances
          </span>
        </div>
      ) : (
        <>
          {/* Single 100% stacked bar */}
          <div
            className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
            role="img"
            aria-label={`${overduePercent}% of outstanding balances are overdue`}
          >
            {buckets
              .filter((b) => b.amountGhs > 0)
              .map((b) => (
                <div
                  key={b.id}
                  style={{ width: `${(b.amountGhs / totalGhs) * 100}%`, backgroundColor: b.color }}
                />
              ))}
          </div>

          {/* Bucket rows */}
          <ul className="mt-4 space-y-3.5 flex-1">
            {buckets.map((b) => {
              const percent = totalGhs > 0 ? (b.amountGhs / totalGhs) * 100 : 0;
              return (
                <li key={b.id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {b.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-[11px] text-slate-400">{b.count}&times;</span>
                      <span
                        className={`font-bold ${
                          b.isOverdue && b.amountGhs > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatGHS(b.amountGhs)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${b.amountGhs > 0 ? Math.max(percent, 1.5) : 0}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="flex justify-end mt-4">
        <Link
          href="/desk/payment-plans"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>Payment plans</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

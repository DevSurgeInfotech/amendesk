'use client';

import { useState, useMemo } from 'react';
import type { AuctionLot } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { getInstalmentWindowInfo, formatDate, getDaysRemaining } from '@/lib/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CreditCard, CalendarPlus, ArrowRight, Truck, Clock, AlertTriangle } from 'lucide-react';

interface SettlementWatchlistProps {
  lots: AuctionLot[];
  onSelectLotForPayment: (lot: AuctionLot) => void;
  onSelectLotForExtension: (lot: AuctionLot) => void;
  onSelectLotForWaybill: (lot: AuctionLot) => void;
}

type SettlementFilter = 'ALL' | 'OVERDUE' | 'ACTIVE';

export function SettlementWatchlist({
  lots,
  onSelectLotForPayment,
  onSelectLotForExtension,
  onSelectLotForWaybill,
}: SettlementWatchlistProps) {
  const [filter, setFilter] = useState<SettlementFilter>('ALL');

  // Filter lots awaiting balance or flagged overdue, and sort overdue first
  const allSettlementLots = useMemo(() => {
    const raw = lots.filter(
      (l) => l.status === 'AWAITING_BALANCE' || l.status === 'OVERDUE'
    );

    return raw.sort((a, b) => {
      const aDays = a.balanceDueDate ? getDaysRemaining(a.balanceDueDate) : 0;
      const bDays = b.balanceDueDate ? getDaysRemaining(b.balanceDueDate) : 0;
      const aIsOverdue = a.status === 'OVERDUE' || aDays < 0;
      const bIsOverdue = b.status === 'OVERDUE' || bDays < 0;

      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      if (aIsOverdue && bIsOverdue) {
        // Most overdue first (lowest/most negative days remaining)
        return aDays - bDays;
      }
      // Soonest due date first
      return aDays - bDays;
    });
  }, [lots]);

  const overdueCount = useMemo(() => {
    return allSettlementLots.filter(
      (l) => l.status === 'OVERDUE' || (l.balanceDueDate && getDaysRemaining(l.balanceDueDate) < 0)
    ).length;
  }, [allSettlementLots]);

  const activeCount = allSettlementLots.length - overdueCount;

  const displayedLots = useMemo(() => {
    if (filter === 'OVERDUE') {
      return allSettlementLots.filter(
        (l) => l.status === 'OVERDUE' || (l.balanceDueDate && getDaysRemaining(l.balanceDueDate) < 0)
      );
    }
    if (filter === 'ACTIVE') {
      return allSettlementLots.filter(
        (l) => l.status !== 'OVERDUE' && (!l.balanceDueDate || getDaysRemaining(l.balanceDueDate) >= 0)
      );
    }
    return allSettlementLots;
  }, [allSettlementLots, filter]);

  return (
    <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pending Hammer Settlements &amp; Overdue Watchlist
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {allSettlementLots.length}
              </span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} Overdue
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              14-day statutory balance settlement engine across Judicial, Government, and Private auctions.
            </p>
          </div>
        </div>

        <Link
          href="/desk/payment-plans"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>View All Payment Plans</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Settlements ({allSettlementLots.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('OVERDUE')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Overdue</span>
          {overdueCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filter === 'OVERDUE' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
              }`}
            >
              {overdueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('ACTIVE')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'ACTIVE'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Within 14-Day Window ({activeCount})
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:border-slate-800 dark:divide-slate-800">
        {displayedLots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No auction lots in this category.
          </div>
        ) : (
          displayedLots.map((lot) => {
            const windowInfo = getInstalmentWindowInfo(lot.balanceDueDate);
            const isSettled = (lot.balanceDueGhs || 0) <= 0;
            const isOverdue =
              lot.status === 'OVERDUE' ||
              (lot.balanceDueDate && getDaysRemaining(lot.balanceDueDate) < 0);

            return (
              <div
                key={lot.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isOverdue
                    ? 'border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {lot.lotNumber}
                    </span>
                    <Badge
                      variant={
                        lot.category === 'JUDICIAL'
                          ? 'danger'
                          : lot.category === 'GOVERNMENT'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {lot.category}
                    </Badge>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${windowInfo.badgeClass}`}
                    >
                      {windowInfo.statusLabel}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded">
                        Action Required
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {lot.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {lot.winningBidderName}
                    </span>
                    <span>&bull; Due {formatDate(lot.balanceDueDate)}</span>
                    {lot.extensionCount > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        &bull; Extended ({lot.extensionCount}x)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-base font-black font-mono ${
                        isOverdue
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatGHS(lot.balanceDueGhs || 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Paid: {formatGHS(lot.depositAmountGhs || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSettled ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onSelectLotForPayment(lot)}
                          icon={<CreditCard className="h-3.5 w-3.5" />}
                        >
                          Pay
                        </Button>

                        <Button
                          size="sm"
                          variant={isOverdue ? 'danger' : 'outline'}
                          onClick={() => onSelectLotForExtension(lot)}
                          icon={<CalendarPlus className="h-3.5 w-3.5" />}
                        >
                          Extend
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSelectLotForWaybill(lot)}
                        icon={<Truck className="h-3.5 w-3.5" />}
                      >
                        Waybill
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

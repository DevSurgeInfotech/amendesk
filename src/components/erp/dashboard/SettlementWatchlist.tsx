'use client';

import type { AuctionLot } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { getInstalmentWindowInfo, formatDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CreditCard, CalendarPlus, ArrowRight, Truck } from 'lucide-react';

interface SettlementWatchlistProps {
  lots: AuctionLot[];
  onSelectLotForPayment: (lot: AuctionLot) => void;
  onSelectLotForExtension: (lot: AuctionLot) => void;
  onSelectLotForWaybill: (lot: AuctionLot) => void;
}

export function SettlementWatchlist({
  lots,
  onSelectLotForPayment,
  onSelectLotForExtension,
  onSelectLotForWaybill,
}: SettlementWatchlistProps) {
  const awaitingLots = lots.filter(
    (l) => l.status === 'AWAITING_BALANCE' || l.status === 'OVERDUE'
  );

  return (
    <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Pending Hammer Settlements
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {awaitingLots.length}
          </span>
        </div>

        <Link
          href="/desk/payment-plans"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:border-slate-800 dark:divide-slate-800">
        {awaitingLots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No auction lots awaiting settlement.
          </div>
        ) : (
          awaitingLots.map((lot) => {
            const windowInfo = getInstalmentWindowInfo(lot.balanceDueDate);
            const isSettled = (lot.balanceDueGhs || 0) <= 0;

            return (
              <div
                key={lot.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
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
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
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
                          variant="outline"
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

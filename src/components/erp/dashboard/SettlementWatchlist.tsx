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
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              14-Day Hammer Rule
            </span>
            <span className="text-xs text-slate-400">
              Strict Gate Clearance on Full Settlement
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            14-Day Balance Settlement &amp; Yard Dispatch Watchlist
          </h2>
          <p className="text-xs text-slate-500">
            All hammer sales carry a 14-day balance window. Movable goods &amp; title deeds remain in yard custody until settled.
          </p>
        </div>

        <Link
          href="/desk/payment-plans"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View Ageing Ledger</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200 dark:border-slate-800 dark:divide-slate-800">
        {awaitingLots.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No auction lots currently awaiting 14-day balance settlement.
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
                <div className="space-y-1">
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
                    <Badge variant="outline" size="sm">
                      {lot.assetType}
                    </Badge>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${windowInfo.badgeClass}`}
                    >
                      {windowInfo.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {lot.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Buyer:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {lot.winningBidderName}
                      </strong>{' '}
                      ({lot.winningBidderPhone})
                    </span>
                    <span>
                      Due Date: <strong>{formatDate(lot.balanceDueDate)}</strong>
                    </span>
                    {lot.extensionCount > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        Extended ({lot.extensionCount}x)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Balance Remaining</span>
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                      {formatGHS(lot.balanceDueGhs || 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Deposit: {formatGHS(lot.depositAmountGhs || 0)}
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
                          Pay Instalment
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
                        Issue A5 Waybill
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

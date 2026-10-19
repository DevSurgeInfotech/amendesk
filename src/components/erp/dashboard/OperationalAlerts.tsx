'use client';

import { useMemo } from 'react';
import type { AuctionLot, Receipt } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import {
  AlertTriangle,
  Clock,
  Truck,
  Banknote,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface OperationalAlertsProps {
  lots: AuctionLot[];
  receipts: Receipt[];
  onSelectLotForExtension?: (lot: AuctionLot) => void;
  onSelectLotForWaybill?: (lot: AuctionLot) => void;
}

export function OperationalAlerts({
  lots,
  receipts,
  onSelectLotForExtension,
  onSelectLotForWaybill,
}: OperationalAlertsProps) {
  // 1. Overdue 14-day hammer balance settlements
  const overdueLots = useMemo(
    () => lots.filter((l) => l.status === 'OVERDUE'),
    [lots]
  );

  const totalOverdueAmount = useMemo(
    () => overdueLots.reduce((acc, l) => acc + (l.balanceDueGhs || 0), 0),
    [overdueLots]
  );

  // 2. Fully-paid lots that haven't been issued an A5 Waybill yet (goods sitting in yard ready for release)
  const pendingWaybillLots = useMemo(
    () =>
      lots.filter(
        (l) =>
          l.assetType === 'MOVABLE' &&
          (l.status === 'FULLY_PAID' || (l.balanceDueGhs === 0 && l.hammerPriceGhs && l.hammerPriceGhs > 0)) &&
          !l.waybillId
      ),
    [lots]
  );

  // 3. Unbanked physical cash in office / mobile field collection
  const unclearedCashReceipts = useMemo(
    () =>
      receipts.filter(
        (r) => r.paymentMethod === 'CASH' && r.depositStatus !== 'DEPOSITED'
      ),
    [receipts]
  );

  const unbankedCashTotal = useMemo(
    () => unclearedCashReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0),
    [unclearedCashReceipts]
  );

  const hasHighCashInOffice = unbankedCashTotal >= 20000;

  // If no critical alerts, show operational health badge
  const hasAlerts =
    overdueLots.length > 0 || pendingWaybillLots.length > 0 || hasHighCashInOffice;

  if (!hasAlerts) {
    return (
      <div className="surface-card bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Operational Status: Clear &amp; In Order
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              No overdue hammer settlements or unreleased goods requiring immediate attention.
            </p>
          </div>
        </div>

        <Link
          href="/desk/payment-plans"
          className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View Ledger</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Operational Attention &bull; Executive Action Center</span>
        </h3>
        <span className="text-[10px] text-slate-400">
          Field &amp; Office Compliance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Overdue 14-Day Hammer Balances */}
        {overdueLots.length > 0 && (
          <div className="surface-card p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                  <Clock className="h-3 w-3" />
                  14-Day Window Overdue
                </span>
                <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                  {overdueLots.length} Lot{overdueLots.length > 1 ? 's' : ''}
                </span>
              </div>

              <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100 mb-1">
                {formatGHS(totalOverdueAmount)} Outstanding
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300 line-clamp-2">
                14-day settlement grace period elapsed. Review for forfeiture or granted extension.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between text-xs">
              <Link
                href="/desk/payment-plans?filter=OVERDUE"
                className="font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
              >
                <span>Review Accounts</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {onSelectLotForExtension && (
                <button
                  type="button"
                  onClick={() => onSelectLotForExtension(overdueLots[0])}
                  className="font-bold text-[11px] px-2 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  Quick Extend
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pending A5 Waybills for Fully Paid Goods */}
        {pendingWaybillLots.length > 0 && (
          <div className="surface-card p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  <Truck className="h-3 w-3" />
                  Awaiting Dispatch Waybill
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {pendingWaybillLots.length} Asset{pendingWaybillLots.length > 1 ? 's' : ''}
                </span>
              </div>

              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-100 mb-1">
                Settled in Full &bull; Ready for Gate Release
              </h4>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 line-clamp-2">
                Buyer has cleared 100% of hammer price. Generate A5 Gate Pass for security clearance.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                {pendingWaybillLots[0].lotNumber}
              </span>
              {onSelectLotForWaybill && (
                <button
                  type="button"
                  onClick={() => onSelectLotForWaybill(pendingWaybillLots[0])}
                  className="font-bold text-[11px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Issue A5 Waybill
                </button>
              )}
            </div>
          </div>
        )}

        {/* Unbanked Physical Cash Holding */}
        {hasHighCashInOffice && (
          <div className="surface-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Banknote className="h-3 w-3" />
                  Cash Holding Threshold
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                  Office Safe
                </span>
              </div>

              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">
                {formatGHS(unbankedCashTotal)} Physical Cash
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 line-clamp-2">
                Total physical cash in hand exceeds GHS 20,000. Sweep cash to bank account to reduce field risk.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between text-xs">
              <Link
                href="/desk/accounts?tab=BANK_DEPOSITS"
                className="font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Deposit to Bank</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

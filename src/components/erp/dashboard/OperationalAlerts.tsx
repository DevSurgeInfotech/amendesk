'use client';

import { useMemo } from 'react';
import type { AuctionLot, Receipt, Customer } from '@/lib/types';
import { isCustomerInboundLead, extractInquiryDetails } from '@/lib/crm/leads';
import { formatGHS } from '@/lib/utils/currency';
import {
  Clock,
  Truck,
  Banknote,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface OperationalAlertsProps {
  lots: AuctionLot[];
  receipts: Receipt[];
  customers?: Customer[];
  onSelectLotForExtension?: (lot: AuctionLot) => void;
  onSelectLotForWaybill?: (lot: AuctionLot) => void;
}

export function OperationalAlerts({
  lots,
  receipts,
  customers,
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

  // 2. Fully-paid lots that haven't been issued an A5 Waybill yet
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

  // 3. Inbound website inquiries awaiting follow-up
  const inboundLeads = useMemo(
    () => (customers ?? []).filter((c) => isCustomerInboundLead(c) && (c.leadStatus === 'NEW' || !c.leadStatus)),
    [customers]
  );

  // 4. Unbanked physical cash in office / mobile field collection
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

  const hasAlerts =
    overdueLots.length > 0 || pendingWaybillLots.length > 0 || inboundLeads.length > 0 || hasHighCashInOffice;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Inbound Website Inquiries & Contact Requests */}
      {inboundLeads.length > 0 && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <MessageSquare className="h-3 w-3" />
                Inbound Inquiries ({inboundLeads.length})
              </span>
            </div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 truncate">
              {inboundLeads[0].fullName} &bull; {extractInquiryDetails(inboundLeads[0]).typeLabel}
            </h4>
          </div>

          <Link
            href="/desk/crm?filter=INQUIRIES"
            className="font-bold text-xs text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Review</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Overdue 14-Day Hammer Balances */}
      {overdueLots.length > 0 && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                <Clock className="h-3 w-3" />
                Overdue ({overdueLots.length})
              </span>
            </div>
            <h4 className="text-sm font-bold font-mono text-rose-950 dark:text-rose-100 truncate">
              {formatGHS(totalOverdueAmount)}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSelectLotForExtension && (
              <button
                type="button"
                onClick={() => onSelectLotForExtension(overdueLots[0])}
                className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Extend
              </button>
            )}
            <Link
              href="/desk/payment-plans?filter=OVERDUE"
              className="font-bold text-xs text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
            >
              <span>Review</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Pending A5 Waybills for Fully Paid Goods */}
      {pendingWaybillLots.length > 0 && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                <Truck className="h-3 w-3" />
                Ready for Release ({pendingWaybillLots.length})
              </span>
            </div>
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-100 truncate">
              {pendingWaybillLots[0].lotNumber} &bull; {pendingWaybillLots[0].title}
            </h4>
          </div>

          {onSelectLotForWaybill && (
            <button
              type="button"
              onClick={() => onSelectLotForWaybill(pendingWaybillLots[0])}
              className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 cursor-pointer"
            >
              Issue Waybill
            </button>
          )}
        </div>
      )}

      {/* Unbanked Physical Cash Holding */}
      {hasHighCashInOffice && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Banknote className="h-3 w-3" />
                Unbanked Cash
              </span>
            </div>
            <h4 className="text-sm font-bold font-mono text-amber-950 dark:text-amber-100 truncate">
              {formatGHS(unbankedCashTotal)}
            </h4>
          </div>

          <Link
            href="/desk/accounts?tab=BANK_DEPOSITS"
            className="font-bold text-xs text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Deposit</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

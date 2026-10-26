'use client';

import { useMemo } from 'react';
import type { AuctionLot, Receipt, Customer, PaymentPlan } from '@/lib/types';
import { isCustomerInboundLead, extractInquiryDetails } from '@/lib/crm/leads';
import { formatGHS } from '@/lib/utils/currency';
import { getDaysRemaining, formatRelativeTime } from '@/lib/utils/date';
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
  paymentPlans?: PaymentPlan[];
  onSelectLotForExtension?: (lot: AuctionLot) => void;
  onSelectLotForWaybill?: (lot: AuctionLot) => void;
}

export function OperationalAlerts({
  lots,
  receipts,
  customers,
  paymentPlans,
  onSelectLotForExtension,
  onSelectLotForWaybill,
}: OperationalAlertsProps) {
  // 1. Overdue 14-day hammer balance settlements & payment plans
  const overdueLots = useMemo(() => {
    return lots.filter((l) => {
      const isStatusOverdue = l.status === 'OVERDUE';
      const isDateOverdue =
        l.status === 'AWAITING_BALANCE' &&
        Boolean(l.balanceDueDate) &&
        getDaysRemaining(l.balanceDueDate!) < 0;
      return (isStatusOverdue || isDateOverdue) && (l.balanceDueGhs || 0) > 0;
    });
  }, [lots]);

  const overduePlans = useMemo(() => {
    return (paymentPlans ?? []).filter((p) => {
      const isStatusOverdue = p.status === 'OVERDUE';
      const isDateOverdue =
        p.status !== 'PAID_IN_FULL' &&
        Boolean(p.currentDueDate) &&
        getDaysRemaining(p.currentDueDate) < 0;
      return (isStatusOverdue || isDateOverdue) && (p.balanceRemainingGhs || 0) > 0;
    });
  }, [paymentPlans]);

  // Combine and deduplicate lots covered by active payment plans
  const totalOverdueAmount = useMemo(() => {
    let sum = 0;
    const coveredLotIds = new Set<string>();

    for (const plan of overduePlans) {
      if (plan.referenceType === 'AUCTION') {
        coveredLotIds.add(plan.referenceId);
      }
      sum += plan.balanceRemainingGhs || 0;
    }

    for (const lot of overdueLots) {
      if (!coveredLotIds.has(lot.id)) {
        sum += lot.balanceDueGhs || 0;
      }
    }
    return sum;
  }, [overdueLots, overduePlans]);

  const totalOverdueCount = useMemo(() => {
    const coveredLotIds = new Set<string>();
    for (const plan of overduePlans) {
      if (plan.referenceType === 'AUCTION') {
        coveredLotIds.add(plan.referenceId);
      }
    }
    const nonCoveredLots = overdueLots.filter((l) => !coveredLotIds.has(l.id));
    return overduePlans.length + nonCoveredLots.length;
  }, [overdueLots, overduePlans]);

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

  // 3. Inbound website inquiries awaiting follow-up (Sorted newest first)
  const inboundLeads = useMemo(
    () =>
      (customers ?? [])
        .filter((c) => isCustomerInboundLead(c) && !c.isRead && (c.leadStatus === 'NEW' || !c.leadStatus))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
    totalOverdueCount > 0 || pendingWaybillLots.length > 0 || inboundLeads.length > 0 || hasHighCashInOffice;

  if (!hasAlerts) {
    return null;
  }

  const primaryLead = inboundLeads[0];
  const primaryInquiry = primaryLead ? extractInquiryDetails(primaryLead) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Inbound Website Inquiries & Contact Requests (Newest First) */}
      {inboundLeads.length > 0 && primaryLead && primaryInquiry && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <MessageSquare className="h-3 w-3" />
                Inbound Inquiries ({inboundLeads.length})
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium truncate">
                {formatRelativeTime(primaryLead.createdAt)}
              </span>
            </div>
            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 truncate">
              {primaryLead.fullName} &bull; {primaryInquiry.typeLabel}
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 truncate mt-0.5">
              &quot;{primaryInquiry.messageText}&quot;
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <Link
              href={`/desk/communication?leadId=${primaryLead.id}`}
              className="font-bold text-xs text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Reply</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {inboundLeads.length > 1 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                +{inboundLeads.length - 1} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overdue 14-Day Hammer Balances */}
      {totalOverdueCount > 0 && (
        <div className="surface-card px-4 py-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                <Clock className="h-3 w-3" />
                Overdue ({totalOverdueCount})
              </span>
              {overdueLots[0] && (
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold truncate">
                  Lot {overdueLots[0].lotNumber}
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold font-mono text-rose-950 dark:text-rose-100 truncate">
              {formatGHS(totalOverdueAmount)}
            </h4>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-200/70 truncate mt-0.5">
              {overdueLots[0]
                ? `${overdueLots[0].winningBidderName || 'Buyer'} • ${overdueLots[0].title}`
                : overduePlans[0]
                ? `${overduePlans[0].customerName} • Outstanding Instalment`
                : 'Overdue hammer balance settlement'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {overdueLots[0] && onSelectLotForExtension && (
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
            <p className="text-[11px] text-indigo-800/80 dark:text-indigo-200/70 truncate mt-0.5">
              Settled in full &bull; Issue gate clearance waybill
            </p>
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
            <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 truncate mt-0.5">
              Cash office float ready for bank sweep
            </p>
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

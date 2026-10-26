'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AuctionLot, PaymentMethod } from '@/lib/types';
import { useTerminal } from '@/context/TerminalContext';
import { formatGHS } from '@/lib/utils/currency';
import { GlassCard } from '@/components/ui/GlassCard';
import { PaymentModal } from '@/components/erp/PaymentModal';
import { ExtensionModal } from '@/components/erp/ExtensionModal';
import { WaybillModal } from '@/components/erp/WaybillModal';
import { RecordExpenseModal } from '@/components/erp/accounting/RecordExpenseModal';
import { BankDepositModal } from '@/components/erp/accounting/BankDepositModal';
import { QuickActionBar } from '@/components/erp/dashboard/QuickActionBar';
import { GateScannerModal } from '@/components/erp/GateScannerModal';
import { VehicleIntakeModal } from '@/components/erp/dashboard/VehicleIntakeModal';
import { OperationalAlerts } from '@/components/erp/dashboard/OperationalAlerts';
import { RecentInboundInquiries } from '@/components/erp/dashboard/RecentInboundInquiries';
import { SettlementWatchlist } from '@/components/erp/dashboard/SettlementWatchlist';
import {
  CollectionsTrendChart,
  type CollectionsTrendData,
  type DailyChannelPoint,
} from '@/components/erp/dashboard/charts/CollectionsTrendChart';
import {
  ReceivablesAgingChart,
  type AgingBucket,
  type AgingBucketId,
} from '@/components/erp/dashboard/charts/ReceivablesAgingChart';
import {
  PortfolioMixChart,
  type BusinessLineValue,
} from '@/components/erp/dashboard/charts/PortfolioMixChart';
import {
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Gavel,
  Car,
  Building2,
} from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_WINDOW_DAYS = 14;

function formatLastSync(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** UTC date key (YYYY-MM-DD). Ghana runs on GMT, so UTC equals local business time. */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyChannelTotals(): Record<PaymentMethod, number> {
  return { CASH: 0, MOMO: 0, BANK_TRANSFER: 0, CARD_PAYSTACK: 0 };
}

export default function DeskDashboardPage() {
  const {
    facilityLocation,
    pendingSyncCount,
    isSyncing,
    lastSyncedAt,
    triggerManualSync,
  } = useTerminal();

  // Live Dexie database collections with stable references
  const rawLots = useLiveQuery(() => db.auctionLots.toArray(), []);
  const lots = useMemo(() => rawLots || [], [rawLots]);

  const rawReceipts = useLiveQuery(() => db.receipts.toArray(), []);
  const receipts = useMemo(() => rawReceipts || [], [rawReceipts]);

  const rawPaymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []);
  const paymentPlans = useMemo(() => rawPaymentPlans || [], [rawPaymentPlans]);

  const rawInvoices = useLiveQuery(() => db.invoices.toArray(), []);
  const invoices = useMemo(() => rawInvoices || [], [rawInvoices]);

  const rawVehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []);
  const vehicles = useMemo(() => rawVehicles || [], [rawVehicles]);

  const rawLandParcels = useLiveQuery(() => db.landParcels.toArray(), []);
  const landParcels = useMemo(() => rawLandParcels || [], [rawLandParcels]);

  const rawProperties = useLiveQuery(() => db.propertyUnits.toArray(), []);
  const properties = useMemo(() => rawProperties || [], [rawProperties]);

  const rawCustomers = useLiveQuery(() => db.customers.toArray(), []);
  const customers = useMemo(() => rawCustomers || [], [rawCustomers]);

  // Modal States
  const [selectedLotForPayment, setSelectedLotForPayment] = useState<AuctionLot | null>(null);
  const [isGeneralPaymentOpen, setIsGeneralPaymentOpen] = useState(false);
  const [selectedLotForExtension, setSelectedLotForExtension] = useState<AuctionLot | null>(null);
  const [selectedLotForWaybill, setSelectedLotForWaybill] = useState<AuctionLot | null>(null);
  const [isGeneralWaybillOpen, setIsGeneralWaybillOpen] = useState(false);
  const [isVehicleIntakeOpen, setIsVehicleIntakeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isBankDepositOpen, setIsBankDepositOpen] = useState(false);
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
    timeStr: string;
  } | null>(null);

  // Key Computed Metrics
  const activeLots = useMemo(
    () => lots.filter((l) => l.status === 'ACTIVE' || l.status === 'UPCOMING'),
    [lots]
  );
  // Receivables Aging (payment plans + unpaid invoices + auction hammer balances).
  // Each obligation is counted once: a plan supersedes an invoice for the same asset,
  // and either supersedes the raw lot balance it was raised from.
  const agingBuckets: AgingBucket[] = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totals: Record<AgingBucketId, { amountGhs: number; count: number }> = {
      NOT_DUE: { amountGhs: 0, count: 0 },
      DUE_THIS_WEEK: { amountGhs: 0, count: 0 },
      OVERDUE_SHORT: { amountGhs: 0, count: 0 },
      OVERDUE_LONG: { amountGhs: 0, count: 0 },
    };

    const addBalance = (amountGhs: number, dueDate: string | undefined, flaggedOverdue: boolean) => {
      if (!(amountGhs > 0)) return;
      const due = dueDate ? new Date(dueDate) : null;
      let bucket: AgingBucketId;
      if (!due || isNaN(due.getTime())) {
        bucket = flaggedOverdue ? 'OVERDUE_SHORT' : 'NOT_DUE';
      } else {
        due.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.round((due.getTime() - todayStart.getTime()) / DAY_MS);
        if (daysUntilDue > 7) bucket = 'NOT_DUE';
        else if (daysUntilDue >= 0) bucket = 'DUE_THIS_WEEK';
        else if (daysUntilDue >= -14) bucket = 'OVERDUE_SHORT';
        else bucket = 'OVERDUE_LONG';
      }
      totals[bucket].amountGhs += amountGhs;
      totals[bucket].count += 1;
    };

    const coveredRefs = new Set<string>();

    paymentPlans
      .filter((p) => p.status !== 'PAID_IN_FULL' && p.balanceRemainingGhs > 0)
      .forEach((p) => {
        coveredRefs.add(`${p.referenceType}:${p.referenceId}`);
        addBalance(p.balanceRemainingGhs, p.currentDueDate, p.status === 'OVERDUE');
      });

    invoices
      .filter(
        (inv) =>
          (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE') &&
          inv.balanceDueGhs > 0
      )
      .forEach((inv) => {
        const refKey = inv.referenceId ? `${inv.referenceType}:${inv.referenceId}` : null;
        if (refKey && coveredRefs.has(refKey)) return;
        if (refKey) coveredRefs.add(refKey);
        addBalance(inv.balanceDueGhs, inv.dueDate, inv.status === 'OVERDUE');
      });

    lots
      .filter((l) => l.status === 'AWAITING_BALANCE' || l.status === 'OVERDUE')
      .forEach((l) => {
        if (coveredRefs.has(`AUCTION:${l.id}`)) return;
        addBalance(l.balanceDueGhs || 0, l.balanceDueDate, l.status === 'OVERDUE');
      });

    return [
      {
        id: 'NOT_DUE',
        label: 'Not yet due',
        hint: 'more than 7 days left',
        color: '#94a3b8',
        isOverdue: false,
        ...totals.NOT_DUE,
      },
      {
        id: 'DUE_THIS_WEEK',
        label: 'Due within 7 days',
        hint: 'remind customers now',
        color: '#f59e0b',
        isOverdue: false,
        ...totals.DUE_THIS_WEEK,
      },
      {
        id: 'OVERDUE_SHORT',
        label: 'Overdue 1\u201314 days',
        hint: 'extension or recovery',
        color: '#f97316',
        isOverdue: true,
        ...totals.OVERDUE_SHORT,
      },
      {
        id: 'OVERDUE_LONG',
        label: 'Overdue 15+ days',
        hint: 'escalate / forfeit review',
        color: '#e11d48',
        isOverdue: true,
        ...totals.OVERDUE_LONG,
      },
    ];
  }, [paymentPlans, invoices, lots]);

  const totalReceivablesGhs = agingBuckets.reduce((acc, b) => acc + b.amountGhs, 0);

  // Total verified cash collections to date
  const totalCollectedGhs = useMemo(
    () => receipts.reduce((acc, r) => acc + r.amountPaidGhs, 0),
    [receipts]
  );

  // Total inventory valuation across available lines (excluding sold/disposed assets)
  const totalVehiclesValue = useMemo(
    () => vehicles.filter((v) => v.status !== 'SOLD').reduce((acc, v) => acc + v.askingPriceGhs, 0),
    [vehicles]
  );
  const totalLandValue = useMemo(
    () => landParcels.filter((p) => p.status !== 'SOLD').reduce((acc, p) => acc + p.priceGhs, 0),
    [landParcels]
  );
  const totalPropertyValue = useMemo(
    () => properties.filter((p) => p.status !== 'SOLD').reduce((acc, p) => acc + p.priceGhs, 0),
    [properties]
  );
  const totalAuctionReserveValue = useMemo(
    () =>
      lots
        .filter((l) => l.status !== 'DISPOSED' && l.status !== 'FULLY_PAID' && l.status !== 'CANCELLED')
        .reduce((acc, l) => acc + (l.reservePriceGhs || l.currentBidGhs || 0), 0),
    [lots]
  );
  const totalAssetValuation =
    totalVehiclesValue + totalLandValue + totalPropertyValue + totalAuctionReserveValue;

  // Realized 7% Margin on auctions + vehicle markups
  const realizedAuction7PercentMargin = useMemo(
    () =>
      lots
        .filter((l) => l.hammerPriceGhs && l.hammerPriceGhs > 0)
        .reduce((acc, l) => acc + (l.hammerPriceGhs || 0) * 0.07, 0),
    [lots]
  );

  const realizedDealerGross = useMemo(
    () =>
      vehicles
        .filter((v) => v.status === 'SOLD')
        .reduce((acc, v) => acc + Math.max(v.askingPriceGhs - v.landedCostGhs, 0), 0),
    [vehicles]
  );

  const totalRealizedMarginGhs = realizedAuction7PercentMargin + realizedDealerGross;

  // 1. Chart Data: Collections over the last 14 days (matches the 14-day settlement cycle),
  //    stacked by payment channel, plus the previous 14 days for comparison.
  const collectionsTrend: CollectionsTrendData | null = useMemo(() => {
    if (receipts.length === 0) return null;

    // Aggregate receipts per day and per channel (honouring split payments)
    const daily = new Map<string, { byChannel: Record<PaymentMethod, number>; count: number }>();
    receipts.forEach((r) => {
      const parsed = r.printedAt ? new Date(r.printedAt) : null;
      if (!parsed || isNaN(parsed.getTime())) return;
      const key = toDateKey(parsed);
      const entry = daily.get(key) ?? { byChannel: emptyChannelTotals(), count: 0 };
      entry.count += 1;

      const splits = r.splitPayments ?? [];
      const splitSum = splits.reduce((acc, s) => acc + s.amountGhs, 0);
      if (splits.length > 0 && Math.abs(splitSum - r.amountPaidGhs) < 0.01) {
        splits.forEach((s) => {
          const method: PaymentMethod = s.method in entry.byChannel ? s.method : 'CASH';
          entry.byChannel[method] += s.amountGhs;
        });
      } else {
        const method: PaymentMethod = r.paymentMethod in entry.byChannel ? r.paymentMethod : 'CASH';
        entry.byChannel[method] += r.amountPaidGhs;
      }
      daily.set(key, entry);
    });

    // Anchor on today; if nothing was collected in the last 14 days, anchor on the
    // most recent collection day so the chart never shows an empty window by default.
    const now = new Date();
    const todayKey = toDateKey(now);
    const windowStartKey = toDateKey(new Date(now.getTime() - (TREND_WINDOW_DAYS - 1) * DAY_MS));
    const dayKeys = [...daily.keys()].sort();
    const latestKey = dayKeys[dayKeys.length - 1];
    const hasRecent = dayKeys.some((k) => k >= windowStartKey && k <= todayKey);
    const anchor = hasRecent || !latestKey ? now : new Date(`${latestKey}T00:00:00Z`);

    const dayOf = (offset: number) => new Date(anchor.getTime() - offset * DAY_MS);
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

    const days: DailyChannelPoint[] = [];
    for (let i = TREND_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = dayOf(i);
      const key = toDateKey(d);
      const entry = daily.get(key);
      const byChannel = entry ? { ...entry.byChannel } : emptyChannelTotals();
      days.push({
        dateKey: key,
        dayLabel: fmt(d, { day: '2-digit' }),
        monthLabel: fmt(d, { month: 'short' }),
        weekdayLabel: fmt(d, { weekday: 'short' }),
        isToday: key === todayKey,
        totalGhs: Object.values(byChannel).reduce((acc, v) => acc + v, 0),
        receiptCount: entry?.count ?? 0,
        byChannel,
      });
    }

    let previousPeriodTotalGhs = 0;
    for (let i = TREND_WINDOW_DAYS * 2 - 1; i >= TREND_WINDOW_DAYS; i--) {
      const entry = daily.get(toDateKey(dayOf(i)));
      if (entry) {
        previousPeriodTotalGhs += Object.values(entry.byChannel).reduce((acc, v) => acc + v, 0);
      }
    }

    const first = dayOf(TREND_WINDOW_DAYS - 1);
    const last = dayOf(0);
    const rangeLabel = `${fmt(first, { day: '2-digit', month: 'short' })} \u2013 ${fmt(last, {
      day: '2-digit',
      month: 'short',
    })}`;

    return { days, previousPeriodTotalGhs, rangeLabel };
  }, [receipts]);

  // 2. Chart Data: Inventory value per business line (all four lines shown together)
  const businessLineValues: BusinessLineValue[] = useMemo(
    () => [
      {
        id: 'auctions',
        label: 'Auction Yard Lots',
        href: '/desk/auctions',
        icon: Gavel,
        color: '#f59e0b',
        valueGhs: totalAuctionReserveValue,
        unitCount: lots.length,
        availableCount: activeLots.length,
        unitNoun: 'lots',
      },
      {
        id: 'dealership',
        label: 'Showroom Cars',
        href: '/desk/dealership',
        icon: Car,
        color: '#6366f1',
        valueGhs: totalVehiclesValue,
        unitCount: vehicles.length,
        availableCount: vehicles.filter((v) => v.status === 'AVAILABLE').length,
        unitNoun: 'cars',
      },
      {
        id: 'land',
        label: 'Land Parcels',
        href: '/desk/land',
        icon: MapPin,
        color: '#10b981',
        valueGhs: totalLandValue,
        unitCount: landParcels.length,
        availableCount: landParcels.filter((p) => p.status === 'AVAILABLE').length,
        unitNoun: 'parcels',
      },
      {
        id: 'property',
        label: 'Property Units',
        href: '/desk/property',
        icon: Building2,
        color: '#8b5cf6',
        valueGhs: totalPropertyValue,
        unitCount: properties.length,
        availableCount: properties.filter((p) => p.status === 'AVAILABLE').length,
        unitNoun: 'units',
      },
    ],
    [
      lots.length,
      activeLots.length,
      vehicles,
      landParcels,
      properties,
      totalAuctionReserveValue,
      totalVehiclesValue,
      totalLandValue,
      totalPropertyValue,
    ]
  );

  // Handle manual sync trigger
  const handleSyncClick = async () => {
    try {
      const res = await triggerManualSync();
      const timeStr = res.timestamp
        ? res.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setSyncToast({
        show: true,
        message: res.message,
        type: !res.success ? 'error' : res.synced > 0 ? 'success' : 'info',
        timeStr,
      });

      setTimeout(() => {
        setSyncToast((prev) => (prev ? { ...prev, show: false } : null));
      }, 4500);
    } catch (err) {
      console.error('Failed manual sync:', err);
      setSyncToast({
        show: true,
        message: 'Manual sync encountered an unexpected error. Please check network connectivity.',
        type: 'error',
        timeStr: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      setTimeout(() => {
        setSyncToast((prev) => (prev ? { ...prev, show: false } : null));
      }, 4500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Operations Dashboard
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{facilityLocation || 'Accra Central Office'}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncClick}
          disabled={isSyncing}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 self-start sm:self-auto ${
            isSyncing
              ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title={isSyncing ? 'Synchronizing with AmenDesk Cloud...' : 'Trigger Manual Cloud Sync'}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span>
            {isSyncing
              ? 'Syncing...'
              : pendingSyncCount > 0
                ? `${pendingSyncCount} Pending`
                : lastSyncedAt
                  ? `Synced ${formatLastSync(lastSyncedAt)}`
                  : 'Sync Ledger'}
          </span>
        </button>
      </div>

      {/* Quick Actions */}
      <QuickActionBar
        onOpenPayment={() => setIsGeneralPaymentOpen(true)}
        onOpenVehicleIntake={() => setIsVehicleIntakeOpen(true)}
        onOpenWaybillModal={() => setIsGeneralWaybillOpen(true)}
        onOpenExpenseModal={() => setIsExpenseOpen(true)}
        onOpenBankDepositModal={() => setIsBankDepositOpen(true)}
        onOpenGateScanner={() => setIsGateScannerOpen(true)}
      />

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          theme="amber"
          title="Receivables Due"
          value={formatGHS(totalReceivablesGhs)}
          iconName="receivables"
          href="/desk/payment-plans"
        />

        <GlassCard
          theme="emerald"
          title="Total Collections"
          value={formatGHS(totalCollectedGhs)}
          iconName="collections"
          href="/desk/payments?view=collections"
        />

        <GlassCard
          theme="indigo"
          title="Asset Valuation"
          value={formatGHS(totalAssetValuation)}
          iconName="profit"
          href="/desk/dealership"
        />

        <GlassCard
          theme="purple"
          title="Realized Margin"
          value={formatGHS(totalRealizedMarginGhs)}
          iconName="scale"
          href="/desk/accounts?tab=FINANCIAL_REPORTS"
        />
      </div>

      {/* Operational Alerts (renders only when attention is needed) */}
      <OperationalAlerts
        lots={lots}
        receipts={receipts}
        customers={customers}
        paymentPlans={paymentPlans}
        onSelectLotForExtension={(lot) => setSelectedLotForExtension(lot)}
        onSelectLotForWaybill={(lot) => setSelectedLotForWaybill(lot)}
      />

      {/* Row 1: 14-Day Collections Trend */}
      <CollectionsTrendChart data={collectionsTrend} />

      {/* Row 2: Receivables Aging & Portfolio by Business Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReceivablesAgingChart buckets={agingBuckets} />
        <PortfolioMixChart lines={businessLineValues} />
      </div>

      {/* Recent Inbound Inquiries & Website Leads Hub */}
      <RecentInboundInquiries customers={customers} />

      {/* Pending Hammer Settlements Watchlist */}
      <SettlementWatchlist
        lots={lots}
        onSelectLotForPayment={(lot) => setSelectedLotForPayment(lot)}
        onSelectLotForExtension={(lot) => setSelectedLotForExtension(lot)}
        onSelectLotForWaybill={(lot) => setSelectedLotForWaybill(lot)}
      />

      {/* MODALS */}
      {/* 1. Payment Modal (For preselected lot) */}
      {selectedLotForPayment && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedLotForPayment(null)}
          lot={selectedLotForPayment}
          onSuccess={() => setSelectedLotForPayment(null)}
        />
      )}

      {/* 2. General POS Payment Modal (From Quick Actions) */}
      {isGeneralPaymentOpen && (
        <PaymentModal
          isOpen={true}
          onClose={() => setIsGeneralPaymentOpen(false)}
          onSuccess={() => setIsGeneralPaymentOpen(false)}
        />
      )}

      {/* 3. Extension Modal */}
      {selectedLotForExtension && (
        <ExtensionModal
          isOpen={true}
          onClose={() => setSelectedLotForExtension(null)}
          lot={selectedLotForExtension}
          onSuccess={() => setSelectedLotForExtension(null)}
        />
      )}

      {/* 4. A5 Waybill Modal (For preselected lot or Quick Actions) */}
      {(selectedLotForWaybill || isGeneralWaybillOpen) && (
        <WaybillModal
          isOpen={true}
          onClose={() => {
            setSelectedLotForWaybill(null);
            setIsGeneralWaybillOpen(false);
          }}
          lot={selectedLotForWaybill}
          onSuccess={() => {
            setSelectedLotForWaybill(null);
            setIsGeneralWaybillOpen(false);
          }}
        />
      )}

      {/* 5. Showroom Vehicle Intake Modal */}
      <VehicleIntakeModal
        isOpen={isVehicleIntakeOpen}
        onClose={() => setIsVehicleIntakeOpen(false)}
        onSuccess={() => setIsVehicleIntakeOpen(false)}
      />

      {/* 6. Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={() => setIsExpenseOpen(false)}
      />

      {/* 7. Bank Deposit Slip Modal */}
      <BankDepositModal
        isOpen={isBankDepositOpen}
        onClose={() => setIsBankDepositOpen(false)}
        onSuccess={() => setIsBankDepositOpen(false)}
      />

      {/* 8. Security Gate Pass & Waybill QR Scanner Modal */}
      <GateScannerModal
        isOpen={isGateScannerOpen}
        onClose={() => setIsGateScannerOpen(false)}
      />

      {/* Floating Toast Notification for Cloud Sync Telemetry */}
      {syncToast && syncToast.show && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 shadow-2xl border backdrop-blur-md transition-all duration-300 bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                syncToast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : syncToast.type === 'error'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
              }`}
            >
              {syncToast.type === 'error' ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  AmenDesk Cloud Sync
                </p>
                {syncToast.timeStr && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {syncToast.timeStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {syncToast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSyncToast((prev) => (prev ? { ...prev, show: false } : null))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

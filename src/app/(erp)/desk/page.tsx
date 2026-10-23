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
import { VehicleIntakeModal } from '@/components/erp/dashboard/VehicleIntakeModal';
import { OperationalAlerts } from '@/components/erp/dashboard/OperationalAlerts';
import { LineOfOperationsPulse } from '@/components/erp/dashboard/LineOfOperationsPulse';
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
  Wifi,
  WifiOff,
  MapPin,
  UserCheck,
  RefreshCw,
  Gavel,
  Car,
  Building2,
} from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_WINDOW_DAYS = 14;

/** UTC date key (YYYY-MM-DD). Ghana runs on GMT, so UTC equals local business time. */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function emptyChannelTotals(): Record<PaymentMethod, number> {
  return { CASH: 0, MOMO: 0, BANK_TRANSFER: 0, CARD_PAYSTACK: 0 };
}

export default function DeskDashboardPage() {
  const { currentStaffName, facilityLocation, isOnline, pendingSyncCount, triggerManualSync } =
    useTerminal();

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

  // Modal States
  const [selectedLotForPayment, setSelectedLotForPayment] = useState<AuctionLot | null>(null);
  const [isGeneralPaymentOpen, setIsGeneralPaymentOpen] = useState(false);
  const [selectedLotForExtension, setSelectedLotForExtension] = useState<AuctionLot | null>(null);
  const [selectedLotForWaybill, setSelectedLotForWaybill] = useState<AuctionLot | null>(null);
  const [isVehicleIntakeOpen, setIsVehicleIntakeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isBankDepositOpen, setIsBankDepositOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
  const openBalanceCount = agingBuckets.reduce((acc, b) => acc + b.count, 0);

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

  const totalInventoryUnits =
    vehicles.length + landParcels.length + properties.length + activeLots.length;

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
    setIsSyncing(true);
    try {
      await triggerManualSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Find a fallback lot if Waybill Quick Action is clicked without pre-selection
  const handleOpenWaybillQuickAction = () => {
    const candidate =
      lots.find(
        (l) =>
          l.assetType === 'MOVABLE' &&
          (l.status === 'FULLY_PAID' || (l.balanceDueGhs === 0 && l.hammerPriceGhs && l.hammerPriceGhs > 0)) &&
          !l.waybillId
      ) ||
      lots.find((l) => l.assetType === 'MOVABLE') ||
      lots[0];

    if (candidate) {
      setSelectedLotForWaybill(candidate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Field Operations & Central Office Status Banner */}
      <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Amen Mart Auctioning Services &bull; GAA Licensed
            </span>

            {/* Offline-First Network Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Online &bull; Auto-Sync Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  <span>Offline Mode &bull; IndexedDB Local Storage</span>
                </>
              )}
            </div>

            <span className="text-xs text-slate-400">
              Standard Margin: 7% Across All Asset Categories
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            AmenDesk Operations Dashboard
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
              <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
              <span>Officer: {currentStaffName}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{facilityLocation || 'Central Office & Mobile Auction Field'}</span>
            </span>
            <span>Ghana Cedis Standard (GH₵)</span>
          </div>
        </div>

        {/* Sync Status Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs">
            <span className="text-slate-400">Sync Engine</span>
            <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
              {pendingSyncCount > 0 ? `${pendingSyncCount} pending in queue` : 'All records synced'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            title="Trigger Manual Cloud Sync"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Action Command Hub */}
      <QuickActionBar
        onOpenPayment={() => setIsGeneralPaymentOpen(true)}
        onOpenVehicleIntake={() => setIsVehicleIntakeOpen(true)}
        onOpenWaybillModal={handleOpenWaybillQuickAction}
        onOpenExpenseModal={() => setIsExpenseOpen(true)}
        onOpenBankDepositModal={() => setIsBankDepositOpen(true)}
      />

      {/* Tier-1 Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          theme="amber"
          title="14-Day Receivables Due"
          value={formatGHS(totalReceivablesGhs)}
          subtitle={`${openBalanceCount} open balances across hammer settlements, plans & invoices`}
          iconName="receivables"
          href="/desk/payment-plans"
        />

        <GlassCard
          theme="emerald"
          title="Collections to Date"
          value={formatGHS(totalCollectedGhs)}
          subtitle={`${receipts.length} verified receipts issued (Cash, MoMo, Bank, Card)`}
          iconName="collections"
          href="/desk/payments?view=collections"
        />

        <GlassCard
          theme="indigo"
          title="Total Asset Valuation"
          value={formatGHS(totalAssetValuation)}
          subtitle={`${totalInventoryUnits} items across Showroom, Land, Property & Auctions`}
          iconName="profit"
          href="/desk/dealership"
        />

        <GlassCard
          theme="purple"
          title="Realized 7% Margin & Gross"
          value={formatGHS(totalRealizedMarginGhs)}
          subtitle="Earned 7% auction commissions + showroom car gross"
          iconName="scale"
          href="/desk/accounts?tab=FINANCIAL_REPORTS"
        />
      </div>

      {/* Operational Attention & Critical Action Center */}
      <OperationalAlerts
        lots={lots}
        receipts={receipts}
        onSelectLotForExtension={(lot) => setSelectedLotForExtension(lot)}
        onSelectLotForWaybill={(lot) => setSelectedLotForWaybill(lot)}
      />

      {/* Visual Analytics: every figure is visible at once - no toggles or tabs */}
      {/* Row 1: Cash in - collections trend by payment channel */}
      <CollectionsTrendChart data={collectionsTrend} />

      {/* Row 2: Cash owed (aging) and value on hand (inventory by business line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ReceivablesAgingChart buckets={agingBuckets} />
        <PortfolioMixChart lines={businessLineValues} />
      </div>

      {/* Multi-Line Operations Matrix Pulse */}
      <LineOfOperationsPulse
        lots={lots}
        vehicles={vehicles}
        landParcels={landParcels}
        properties={properties}
      />

      {/* 14-Day Hammer Settlement & Dispatch Watchlist */}
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

      {/* 4. A5 Waybill Modal */}
      {selectedLotForWaybill && (
        <WaybillModal
          isOpen={true}
          onClose={() => setSelectedLotForWaybill(null)}
          lot={selectedLotForWaybill}
          onSuccess={() => setSelectedLotForWaybill(null)}
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
    </div>
  );
}

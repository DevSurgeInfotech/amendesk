'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AuctionLot } from '@/lib/types';
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
import { TrendBarChart, type DailyCollectionPoint } from '@/components/erp/dashboard/charts/TrendBarChart';
import { DonutMetricChart, type DonutSegment } from '@/components/erp/dashboard/charts/DonutMetricChart';
import {
  Wifi,
  WifiOff,
  MapPin,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

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
  const [donutMode, setDonutMode] = useState<'CHANNELS' | 'PORTFOLIO'>('CHANNELS');

  // Key Computed Metrics
  const activeLots = useMemo(
    () => lots.filter((l) => l.status === 'ACTIVE' || l.status === 'UPCOMING'),
    [lots]
  );
  const awaitingBalanceLots = useMemo(
    () => lots.filter((l) => l.status === 'AWAITING_BALANCE' || l.status === 'OVERDUE'),
    [lots]
  );

  // Receivables computation (auction balance + payment plans + unpaid invoices)
  const planReceivables = useMemo(
    () =>
      paymentPlans
        .filter((p) => p.status !== 'PAID_IN_FULL')
        .reduce((acc, p) => acc + p.balanceRemainingGhs, 0),
    [paymentPlans]
  );

  const invoiceReceivables = useMemo(
    () =>
      invoices
        .filter(
          (inv) =>
            inv.status === 'ISSUED' ||
            inv.status === 'PARTIALLY_PAID' ||
            inv.status === 'OVERDUE'
        )
        .reduce((acc, inv) => acc + inv.balanceDueGhs, 0),
    [invoices]
  );

  const lotReceivables = useMemo(
    () =>
      awaitingBalanceLots.reduce(
        (acc, l) => acc + (l.balanceDueGhs || 0),
        0
      ),
    [awaitingBalanceLots]
  );

  const totalReceivablesGhs = Math.max(planReceivables + invoiceReceivables, lotReceivables);

  // Total verified cash collections to date
  const totalCollectedGhs = useMemo(
    () => receipts.reduce((acc, r) => acc + r.amountPaidGhs, 0),
    [receipts]
  );

  // Total inventory valuation across all lines
  const totalVehiclesValue = useMemo(
    () => vehicles.reduce((acc, v) => acc + v.askingPriceGhs, 0),
    [vehicles]
  );
  const totalLandValue = useMemo(
    () => landParcels.reduce((acc, p) => acc + p.priceGhs, 0),
    [landParcels]
  );
  const totalPropertyValue = useMemo(
    () => properties.reduce((acc, p) => acc + p.priceGhs, 0),
    [properties]
  );
  const totalAuctionReserveValue = useMemo(
    () => lots.reduce((acc, l) => acc + (l.reservePriceGhs || l.currentBidGhs || 0), 0),
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

  // 1. Chart Data: Daily Collections Trend (Continuous 7-Day Window)
  const collectionTrendData: DailyCollectionPoint[] = useMemo(() => {
    // Determine the anchor date: latest receipt date or fallback to current date
    let anchorDate = new Date();
    if (receipts.length > 0) {
      const sortedDates = receipts
        .map((r) => r.printedAt)
        .filter(Boolean)
        .sort();
      if (sortedDates.length > 0) {
        const parsed = new Date(sortedDates[sortedDates.length - 1]);
        if (!isNaN(parsed.getTime())) {
          anchorDate = parsed;
        }
      }
    }

    const days: DailyCollectionPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const parts = dateKey.split('-');
      const displayLabel = `${parts[2]}/${parts[1]}`;

      const dayReceipts = receipts.filter((r) => r.printedAt?.startsWith(dateKey));
      const amountGhs = dayReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);

      days.push({
        dateKey,
        displayLabel,
        amountGhs,
        count: dayReceipts.length,
      });
    }

    return days;
  }, [receipts]);

  // 2. Chart Data: Payment Methods Channel Split
  const paymentChannelSegments: DonutSegment[] = useMemo(() => {
    let cash = 0;
    let momo = 0;
    let bank = 0;
    let card = 0;

    receipts.forEach((r) => {
      switch (r.paymentMethod) {
        case 'CASH':
          cash += r.amountPaidGhs;
          break;
        case 'MOMO':
          momo += r.amountPaidGhs;
          break;
        case 'BANK_TRANSFER':
          bank += r.amountPaidGhs;
          break;
        case 'CARD_PAYSTACK':
          card += r.amountPaidGhs;
          break;
        default:
          cash += r.amountPaidGhs;
      }
    });

    const total = cash + momo + bank + card;
    if (total === 0) {
      return [
        {
          id: 'cash',
          label: 'Physical Cash Drawer',
          value: 1,
          color: '#10b981',
          formattedValue: 'GH₵ 0.00',
        },
      ];
    }

    return [
      {
        id: 'momo',
        label: 'Mobile Money (Hubtel)',
        value: momo,
        color: '#eab308', // Amber/yellow for MTN/Vodafone
        formattedValue: formatGHS(momo),
      },
      {
        id: 'cash',
        label: 'Cash in Hand / Drawer',
        value: cash,
        color: '#10b981', // Emerald green
        formattedValue: formatGHS(cash),
      },
      {
        id: 'bank',
        label: 'Bank Wires / Transfer',
        value: bank,
        color: '#6366f1', // Indigo
        formattedValue: formatGHS(bank),
      },
      {
        id: 'card',
        label: 'Card POS (Paystack)',
        value: card,
        color: '#3b82f6', // Blue
        formattedValue: formatGHS(card),
      },
    ].filter((s) => s.value > 0);
  }, [receipts]);

  // 3. Chart Data: Asset Portfolio Valuation Split
  const assetValuationSegments: DonutSegment[] = useMemo(() => {
    return [
      {
        id: 'dealership',
        label: 'Showroom Cars',
        value: totalVehiclesValue,
        color: '#6366f1',
        formattedValue: formatGHS(totalVehiclesValue),
      },
      {
        id: 'auctions',
        label: 'Auction Yard Lots',
        value: totalAuctionReserveValue,
        color: '#f59e0b',
        formattedValue: formatGHS(totalAuctionReserveValue),
      },
      {
        id: 'land',
        label: 'Land Parcels',
        value: totalLandValue,
        color: '#10b981',
        formattedValue: formatGHS(totalLandValue),
      },
      {
        id: 'property',
        label: 'Property Units',
        value: totalPropertyValue,
        color: '#8b5cf6',
        formattedValue: formatGHS(totalPropertyValue),
      },
    ].filter((s) => s.value > 0);
  }, [totalVehiclesValue, totalAuctionReserveValue, totalLandValue, totalPropertyValue]);

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
              Amen Mart Field &amp; Central Desk
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
          theme={0}
          title="14-Day Receivables Due"
          value={formatGHS(totalReceivablesGhs)}
          subtitle={`Across ${awaitingBalanceLots.length} hammer settlements & debtor plans`}
          iconName="receivables"
          href="/desk/payment-plans"
        />

        <GlassCard
          theme={1}
          title="Collections to Date"
          value={formatGHS(totalCollectedGhs)}
          subtitle={`${receipts.length} verified receipts issued (Cash, MoMo, Bank, Card)`}
          iconName="collections"
          href="/desk/payments?view=collections"
        />

        <GlassCard
          theme={2}
          title="Total Asset Valuation"
          value={formatGHS(totalAssetValuation)}
          subtitle={`${totalInventoryUnits} items across Showroom, Land, Property & Auctions`}
          iconName="profit"
          href="/desk/dealership"
        />

        <GlassCard
          theme={3}
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

      {/* Visual Analytics & Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Daily Cash Collections Trend (Takes 7 Columns on Desktop) */}
        <div className="lg:col-span-7 min-w-0">
          <TrendBarChart
            data={collectionTrendData}
            title="Daily Cash Collections Velocity"
            subtitle="Real-time multi-mode receipts flow across past 7 days"
            height={190}
          />
        </div>

        {/* Payment Methods / Portfolio Split (Takes 5 Columns on Desktop) */}
        <div className="lg:col-span-5 min-w-0">
          <DonutMetricChart
            title={donutMode === 'CHANNELS' ? 'Payment Channels Inflow' : 'Asset Portfolio Valuation'}
            subtitle={
              donutMode === 'CHANNELS'
                ? 'Verified receipt settlement methods'
                : 'Valuation split across operating inventory'
            }
            segments={donutMode === 'CHANNELS' ? paymentChannelSegments : assetValuationSegments}
            centerLabel={donutMode === 'CHANNELS' ? 'Total Inflow' : 'Portfolio'}
            centerValue={
              donutMode === 'CHANNELS'
                ? formatGHS(totalCollectedGhs)
                : formatGHS(totalAssetValuation)
            }
            size={140}
            headerAction={
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDonutMode('CHANNELS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    donutMode === 'CHANNELS'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Channels
                </button>
                <button
                  type="button"
                  onClick={() => setDonutMode('PORTFOLIO')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    donutMode === 'PORTFOLIO'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Portfolio
                </button>
              </div>
            }
          />
        </div>
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

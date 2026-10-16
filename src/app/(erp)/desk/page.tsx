'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AuctionLot } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { getInstalmentWindowInfo, formatDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PaymentModal } from '@/components/erp/PaymentModal';
import { ExtensionModal } from '@/components/erp/ExtensionModal';
import Link from 'next/link';
import {
  Gavel,
  Receipt,
  Clock,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  CreditCard,
  ShieldAlert,
  Building2,
  Layers,
} from 'lucide-react';

export default function DeskDashboardPage() {
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const paymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  const [selectedLotForPayment, setSelectedLotForPayment] = useState<AuctionLot | null>(null);
  const [selectedLotForExtension, setSelectedLotForExtension] = useState<AuctionLot | null>(null);

  // Computed metrics
  const activeLots = lots.filter((l) => l.status === 'ACTIVE' || l.status === 'UPCOMING');
  const awaitingBalanceLots = lots.filter((l) => l.status === 'AWAITING_BALANCE' || l.status === 'OVERDUE');
  const overdueLots = lots.filter((l) => l.status === 'OVERDUE');

  // Comprehensive receivables: sum outstanding balances from payment plans and unpaid invoices
  const planReceivables = paymentPlans
    .filter((p) => p.status !== 'PAID_IN_FULL')
    .reduce((acc, p) => acc + p.balanceRemainingGhs, 0);

  const invoiceReceivables = invoices
    .filter((inv) => inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE')
    .reduce((acc, inv) => acc + inv.balanceDueGhs, 0);

  const lotReceivables = awaitingBalanceLots.reduce(
    (acc, l) => acc + (l.balanceDueGhs || 0),
    0
  );

  const totalReceivablesGhs = Math.max(planReceivables + invoiceReceivables, lotReceivables);

  const totalCollectedGhs = receipts.reduce(
    (acc, r) => acc + r.amountPaidGhs,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Amen Mart Executive Portal
            </span>
            <span className="text-xs text-slate-400">Standard Margin: 7% All Categories</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            AmenDesk Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Offline-first management for Government, Judicial, and Private auctions &bull; Dealership &bull; Land &bull; Property
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/desk/payments">
            <Button size="sm" variant="primary" icon={<CreditCard className="h-4 w-4" />}>
              Record Payment
            </Button>
          </Link>
          <Link href="/desk/accounts">
            <Button size="sm" variant="secondary" icon={<Receipt className="h-4 w-4" />}>
              Accounting &amp; GL
            </Button>
          </Link>
          <Link href="/desk/auctions/intake">
            <Button size="sm" variant="outline" icon={<PlusCircle className="h-4 w-4" />}>
              Lot Intake
            </Button>
          </Link>
          <Link href="/desk/auctions">
            <Button size="sm" variant="outline" icon={<Gavel className="h-4 w-4" />}>
              Auction Yard
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              14-Day Receivables Due
            </span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatGHS(totalReceivablesGhs)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Across {awaitingBalanceLots.length} hammer settlements awaiting balance
          </p>
        </div>

        {/* Collections */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Collections to Date
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatGHS(totalCollectedGhs)}
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {receipts.length} verified receipts issued
          </p>
        </div>

        {/* Active Auction Lots */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Auction Inventory
            </span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <Gavel className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {activeLots.length} Lots
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Govt, Judicial &amp; Private listings
          </p>
        </div>

        {/* Overdue Accounts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overdue Expirations
            </span>
            <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {overdueLots.length} Accounts
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Eligible for manager extension review
          </p>
        </div>
      </div>

      {/* 14-Day Instalment Watchlist & Critical Expirations */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              14-Day Balance Settlement Watchlist
            </h2>
            <p className="text-xs text-slate-500">
              All hammer sales carry a 14-day balance window. Goods &amp; documents remain in yard until settled in full.
            </p>
          </div>
          <Link
            href="/desk/payment-plans"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Ageing Ledger</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {awaitingBalanceLots.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No lots currently awaiting balance settlement.
            </div>
          ) : (
            awaitingBalanceLots.map((lot) => {
              const windowInfo = getInstalmentWindowInfo(lot.balanceDueDate);
              return (
                <div
                  key={lot.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
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
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${windowInfo.badgeClass}`}>
                        {windowInfo.statusLabel}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {lot.title}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Buyer: <strong className="text-slate-700 dark:text-slate-300">{lot.winningBidderName}</strong> ({lot.winningBidderPhone})</span>
                      <span>Due Date: <strong>{formatDate(lot.balanceDueDate)}</strong></span>
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
                        {formatGHS(lot.balanceDueGhs)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Deposit: {formatGHS(lot.depositAmountGhs)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedLotForPayment(lot)}
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                      >
                        Pay Instalment
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLotForExtension(lot)}
                      >
                        Extend
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two-Column Grid: Auction Categories & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Auction Categories &amp; Asset Scope
            </h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              7% Fee Applied
            </span>
          </div>

          <div className="space-y-3">
            {/* Judicial */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                    Judicial Auctions
                  </span>
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    {lots.filter((l) => l.category === 'JUDICIAL').length} Lots
                  </span>
                </div>
                <p className="text-rose-800 dark:text-rose-300">
                  Movable &amp; Immovable court disposals. Mandates High Court Case Ref &amp; Sheriff instruction writ attachments.
                </p>
              </div>
            </div>

            {/* Government */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
              <Building2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Government Auctions
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {lots.filter((l) => l.category === 'GOVERNMENT').length} Lots
                  </span>
                </div>
                <p className="text-amber-800 dark:text-amber-300">
                  <strong>Strictly Movable only.</strong> Ministry fleet, heavy plants, and surplus public equipment.
                </p>
              </div>
            </div>

            {/* Private */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-start gap-3">
              <Layers className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                    Private Auctions
                  </span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    {lots.filter((l) => l.category === 'PRIVATE').length} Lots
                  </span>
                </div>
                <p className="text-indigo-800 dark:text-indigo-300">
                  Movable (executive cars, plant) and Immovable (land, residential parcels) voluntary liquidations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Official Receipts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Front-Desk Receipts
              </h2>
              <Link
                href="/desk/accounts?tab=RECEIPTS"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Receipts &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {receipts.slice(-4).reverse().map((rcp) => (
                <div
                  key={rcp.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rcp.receiptNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {rcp.paymentMethod}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {rcp.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {rcp.referenceTitle}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatGHS(rcp.amountPaidGhs)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Bal: {formatGHS(rcp.balanceRemainingGhs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Offline-first append-only ledger</span>
            <span>Total: {receipts.length} entries</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedLotForPayment && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedLotForPayment(null)}
          lot={selectedLotForPayment}
          onSuccess={() => setSelectedLotForPayment(null)}
        />
      )}

      {/* Extension Modal */}
      {selectedLotForExtension && (
        <ExtensionModal
          isOpen={true}
          onClose={() => setSelectedLotForExtension(null)}
          lot={selectedLotForExtension}
          onSuccess={() => setSelectedLotForExtension(null)}
        />
      )}
    </div>
  );
}

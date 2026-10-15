'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AuctionCategory, AssetType, AuctionLot, LotStatus } from '@/lib/types';
import { formatGHS, calculateAuctionFee } from '@/lib/utils/currency';
import { formatDate, getInstalmentWindowInfo } from '@/lib/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PaymentModal } from '@/components/erp/PaymentModal';
import { ExtensionModal } from '@/components/erp/ExtensionModal';
import { WaybillModal } from '@/components/erp/WaybillModal';
import { SaleTransferModal } from '@/components/erp/SaleTransferModal';
import { syncEngine } from '@/lib/sync/syncEngine';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gavel,
  PlusCircle,
  Truck,
  FileCheck,
  CreditCard,
  CalendarPlus,
  ShieldAlert,
  Building2,
  Layers,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function AuctionsPage() {
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AuctionCategory>('ALL');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'ALL' | AssetType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LotStatus>('ALL');

  // Modals state
  const [paymentLot, setPaymentLot] = useState<AuctionLot | null>(null);
  const [extensionLot, setExtensionLot] = useState<AuctionLot | null>(null);
  const [waybillLot, setWaybillLot] = useState<AuctionLot | null>(null);
  const [saleTransferLot, setSaleTransferLot] = useState<AuctionLot | null>(null);

  // Yard fast bidding state
  const [activeBidLotId, setActiveBidLotId] = useState<string | null>(null);
  const [quickBidAmount, setQuickBidAmount] = useState<number>(0);
  const [selectedBidderId, setSelectedBidderId] = useState<string>('');
  const [depositInput, setDepositInput] = useState<number>(0);

  const filteredLots = lots.filter((lot) => {
    if (categoryFilter !== 'ALL' && lot.category !== categoryFilter) return false;
    if (assetTypeFilter !== 'ALL' && lot.assetType !== assetTypeFilter) return false;
    if (statusFilter !== 'ALL' && lot.status !== statusFilter) return false;
    return true;
  });

  const handleFastBidIncrement = async (lot: AuctionLot, increment: number) => {
    const newBid = lot.currentBidGhs + increment;
    await db.auctionLots.update(lot.id, { currentBidGhs: newBid });
    await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', { currentBidGhs: newBid });
  };

  const handleHammerDown = async (lot: AuctionLot) => {
    if (!selectedBidderId || depositInput <= 0) {
      alert('Please select the winning bidder and enter initial deposit amount.');
      return;
    }

    const bidder = customers.find((c) => c.id === selectedBidderId);
    if (!bidder) return;

    const hammerPrice = quickBidAmount || lot.currentBidGhs;
    const feeCalculation = calculateAuctionFee(hammerPrice, 7); // strictly 7% for all categories
    const totalPriceWithFee = feeCalculation.totalPayableGhs;
    const balanceDue = Math.max(0, totalPriceWithFee - depositInput);
    const balanceDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // strictly 14 days
    const newStatus: LotStatus = balanceDue === 0 ? 'FULLY_PAID' : 'AWAITING_BALANCE';

    // 1. Update lot
    await db.auctionLots.update(lot.id, {
      hammerPriceGhs: hammerPrice,
      marginRatePercent: 7,
      marginFeeGhs: feeCalculation.feeAmountGhs,
      winningBidderId: bidder.id,
      winningBidderName: bidder.fullName,
      winningBidderPhone: bidder.phone,
      depositAmountGhs: depositInput,
      balanceDueGhs: balanceDue,
      balanceDueDate,
      status: newStatus,
    });

    // 2. Create Payment Plan
    const planId = `pp-${Date.now()}`;
    await db.paymentPlans.add({
      id: planId,
      referenceType: 'AUCTION',
      referenceId: lot.id,
      referenceTitle: `${lot.lotNumber}: ${lot.title}`,
      customerId: bidder.id,
      customerName: bidder.fullName,
      customerPhone: bidder.phone,
      totalPriceGhs: totalPriceWithFee,
      depositPaidGhs: depositInput,
      balanceRemainingGhs: balanceDue,
      initialDueDate: balanceDueDate,
      currentDueDate: balanceDueDate,
      status: balanceDue === 0 ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
      extensions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Issue immediate Deposit Receipt
    const receiptId = `rcp-${Date.now()}`;
    await db.receipts.add({
      id: receiptId,
      receiptNumber: `AM-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentPlanId: planId,
      referenceType: 'AUCTION',
      referenceId: lot.id,
      referenceTitle: `${lot.lotNumber}: ${lot.title} (Hammer Deposit)`,
      customerId: bidder.id,
      customerName: bidder.fullName,
      customerPhone: bidder.phone,
      amountPaidGhs: depositInput,
      paymentMethod: 'CASH',
      transactionReference: 'YARD-HAMMER-01',
      totalPaidToDateGhs: depositInput,
      balanceRemainingGhs: balanceDue,
      balanceDueDate,
      cashierName: 'Yard Auctioneer',
      issuedLocation: 'Auction Yard — Tema',
      printedAt: new Date().toISOString(),
      syncStatus: 'SYNCED',
    });

    await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', { status: newStatus });
    setActiveBidLotId(null);
    setDepositInput(0);
    setSelectedBidderId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Auction Yard Operations
            </span>
            <span className="text-xs text-slate-400">Offline-Capable Bidding &amp; Hammer Logging</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Multi-Category Auction Engine
          </h1>
          <p className="text-xs text-slate-500">
            Private, Government (Movable Only), and Judicial Auctions with 7% margin fee &amp; 14-day instalment tracking.
          </p>
        </div>

        <Link href="/desk/auctions/intake">
          <Button variant="primary" icon={<PlusCircle className="h-4 w-4" />}>
            Intake New Lot
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Category:
          </span>
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Categories ({lots.length})
          </button>
          <button
            onClick={() => setCategoryFilter('JUDICIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'JUDICIAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Judicial ({lots.filter((l) => l.category === 'JUDICIAL').length})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('GOVERNMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'GOVERNMENT'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Government Movable ({lots.filter((l) => l.category === 'GOVERNMENT').length})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('PRIVATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'PRIVATE'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Private ({lots.filter((l) => l.category === 'PRIVATE').length})</span>
          </button>
        </div>

        {/* Asset Type & Status Sub-filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Asset Type:</span>
            {(['ALL', 'MOVABLE', 'IMMOVABLE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAssetTypeFilter(t)}
                className={`px-2.5 py-1 rounded font-medium ${
                  assetTypeFilter === t
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Status:</span>
            {(['ALL', 'ACTIVE', 'AWAITING_BALANCE', 'FULLY_PAID', 'OVERDUE', 'DISPOSED'] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded font-medium ${
                    statusFilter === s
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLots.map((lot) => {
          const windowInfo = getInstalmentWindowInfo(lot.balanceDueDate);
          const isBiddingActive = activeBidLotId === lot.id;

          return (
            <div
              key={lot.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={lot.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                    alt={lot.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
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
                    <Badge variant="outline" size="sm" className="bg-white/90 dark:bg-slate-900/90">
                      {lot.assetType}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <Badge
                      variant={
                        lot.status === 'FULLY_PAID'
                          ? 'success'
                          : lot.status === 'AWAITING_BALANCE'
                          ? 'warning'
                          : lot.status === 'OVERDUE'
                          ? 'danger'
                          : lot.status === 'DISPOSED'
                          ? 'purple'
                          : 'default'
                      }
                      size="sm"
                    >
                      {lot.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                    {lot.title}
                  </h3>

                  {/* Judicial Mandated Reference Block */}
                  {lot.category === 'JUDICIAL' && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-0.5">
                      <p className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Court Ref: {lot.courtCaseNumber || 'HC/ACR/COMM/2026/049'}</span>
                      </p>
                      <p className="text-rose-700 dark:text-rose-300 text-[11px]">
                        Sheriff Writ: {lot.sheriffInstructionRef || 'SHF/WRIT/EXEC/2026/012'}
                      </p>
                    </div>
                  )}

                  {/* Identifiers & Details */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {lot.assetType === 'MOVABLE' ? (
                      <>
                        {lot.chassisNumber && (
                          <p>Chassis No: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.chassisNumber}</strong></p>
                        )}
                        {lot.registrationNumber && (
                          <p>Reg No: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.registrationNumber}</strong></p>
                        )}
                        {lot.serialOrTagNumber && (
                          <p>Asset Tag: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.serialOrTagNumber}</strong></p>
                        )}
                        {lot.fuelType && <p>Fuel: <strong>{lot.fuelType}</strong></p>}
                      </>
                    ) : (
                      <>
                        <p>Parcel Ref: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.parcelReference}</strong></p>
                        <p>Title Ref: <strong className="font-mono text-slate-800 dark:text-slate-200">{lot.titleReference}</strong></p>
                        <p>Location: <strong>{lot.locationArea}</strong></p>
                      </>
                    )}
                    <div className="flex items-center gap-1 text-slate-500 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{lot.yardLocation}</span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Reserve:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        {formatGHS(lot.reservePriceGhs)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">
                        {lot.status === 'ACTIVE' || lot.status === 'UPCOMING' ? 'Current Bid:' : 'Hammer Price:'}
                      </span>
                      <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatGHS(lot.hammerPriceGhs || lot.currentBidGhs)}
                      </p>
                    </div>
                  </div>

                  {/* 14-day balance window details if sold */}
                  {(lot.status === 'AWAITING_BALANCE' || lot.status === 'OVERDUE') && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          Balance Due:
                        </span>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
                          {formatGHS(lot.balanceDueGhs)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400">Due Date:</span>
                        <span className={`px-1.5 py-0.2 rounded ${windowInfo.badgeClass}`}>
                          {formatDate(lot.balanceDueDate)} ({windowInfo.statusLabel})
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800 dark:text-amber-300">
                        Winner: <strong>{lot.winningBidderName}</strong> ({lot.winningBidderPhone})
                      </p>
                    </div>
                  )}

                  {lot.status === 'FULLY_PAID' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Settled in Full &bull; Ready for Disposal Release</span>
                    </div>
                  )}

                  {lot.status === 'DISPOSED' && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs flex items-center gap-2 text-purple-800 dark:text-purple-300 font-semibold">
                      <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>
                        Disposed &bull; {lot.assetType === 'MOVABLE' ? 'Waybill Issued' : 'Transfer Deed Executed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Fast Yard Bidding */}
              <div className="p-5 pt-0">
                {isBiddingActive ? (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-3 text-xs border border-indigo-300">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Yard Hammer Terminal</span>
                      <button
                        onClick={() => setActiveBidLotId(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Quick increment */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleFastBidIncrement(lot, 5000)}
                        className="flex-1 py-1 bg-white dark:bg-slate-700 rounded border font-semibold hover:bg-indigo-50"
                      >
                        +GH₵ 5,000
                      </button>
                      <button
                        onClick={() => void handleFastBidIncrement(lot, 10000)}
                        className="flex-1 py-1 bg-white dark:bg-slate-700 rounded border font-semibold hover:bg-indigo-50"
                      >
                        +GH₵ 10,000
                      </button>
                    </div>

                    {/* Select Bidder */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">
                        Registered Bidder *
                      </label>
                      <select
                        value={selectedBidderId}
                        onChange={(e) => setSelectedBidderId(e.target.value)}
                        className="w-full p-2 rounded border bg-white dark:bg-slate-900"
                      >
                        <option value="">-- Select Bidder --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Deposit Input */}
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">
                        Initial Deposit (GH₵) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="e.g. 50000"
                        value={depositInput || ''}
                        onChange={(e) => setDepositInput(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 rounded border bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      onClick={() => void handleHammerDown(lot)}
                      icon={<Gavel className="h-4 w-4" />}
                    >
                      Fall Hammer (Sell with 7% Fee)
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Active Yard Bidding Button */}
                    {lot.status === 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onClick={() => {
                          setActiveBidLotId(lot.id);
                          setQuickBidAmount(lot.currentBidGhs);
                        }}
                        icon={<Gavel className="h-4 w-4" />}
                      >
                        Open Yard Bid / Hammer
                      </Button>
                    )}

                    {/* Awaiting Balance Actions */}
                    {(lot.status === 'AWAITING_BALANCE' || lot.status === 'OVERDUE') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          onClick={() => setPaymentLot(lot)}
                          icon={<CreditCard className="h-3.5 w-3.5" />}
                        >
                          Record Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExtensionLot(lot)}
                          icon={<CalendarPlus className="h-3.5 w-3.5" />}
                        >
                          Extend
                        </Button>
                      </div>
                    )}

                    {/* Disposal Document Release - Strict Business Rule */}
                    {lot.status === 'FULLY_PAID' && (
                      <>
                        {lot.assetType === 'MOVABLE' ? (
                          <Button
                            size="sm"
                            variant="success"
                            className="w-full"
                            onClick={() => setWaybillLot(lot)}
                            icon={<Truck className="h-4 w-4" />}
                          >
                            Generate Waybill &amp; Gate Pass
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            className="w-full"
                            onClick={() => setSaleTransferLot(lot)}
                            icon={<FileCheck className="h-4 w-4" />}
                          >
                            Execute Sale &amp; Transfer Deed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {paymentLot && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentLot(null)}
          lot={paymentLot}
          onSuccess={() => setPaymentLot(null)}
        />
      )}

      {/* Extension Modal */}
      {extensionLot && (
        <ExtensionModal
          isOpen={true}
          onClose={() => setExtensionLot(null)}
          lot={extensionLot}
          onSuccess={() => setExtensionLot(null)}
        />
      )}

      {/* Waybill Modal (MOVABLE Only) */}
      {waybillLot && (
        <WaybillModal
          isOpen={true}
          onClose={() => setWaybillLot(null)}
          lot={waybillLot}
          onSuccess={() => setWaybillLot(null)}
        />
      )}

      {/* Sale/Transfer Modal (IMMOVABLE Only) */}
      {saleTransferLot && (
        <SaleTransferModal
          isOpen={true}
          onClose={() => setSaleTransferLot(null)}
          lot={saleTransferLot}
          onSuccess={() => setSaleTransferLot(null)}
        />
      )}
    </div>
  );
}

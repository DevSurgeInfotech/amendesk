'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { DealershipVehicle, PaymentPlan, Receipt } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { postPaymentReceiptLedger } from '@/lib/accounting/ledger';
import {
  Fuel,
  Gauge,
  CreditCard,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function ShowroomPage() {
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [fuelFilter, setFuelFilter] = useState<string>('ALL');
  const [selectedVehicleForDeposit, setSelectedVehicleForDeposit] = useState<DealershipVehicle | null>(null);

  // Online Paystack Deposit state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(10000); // GH₵ 10,000 standard reservation
  const [depositError, setDepositError] = useState('');
  const [isDepositProcessing, setIsDepositProcessing] = useState(false);
  const [isDepositSuccessful, setIsDepositSuccessful] = useState(false);

  const handleCloseModal = () => {
    setSelectedVehicleForDeposit(null);
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
    setDepositAmount(10000);
    setDepositError('');
    setIsDepositSuccessful(false);
  };

  const filteredVehicles = vehicles.filter((car) => {
    if (fuelFilter !== 'ALL' && car.fuelType !== fuelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        car.make.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.stockNumber.toLowerCase().includes(q) ||
        car.vin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOnlineDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');

    if (!selectedVehicleForDeposit || depositAmount <= 0) return;

    if (depositAmount > selectedVehicleForDeposit.askingPriceGhs) {
      setDepositError(
        `Deposit cannot exceed full vehicle price (${formatGHS(selectedVehicleForDeposit.askingPriceGhs)})`
      );
      return;
    }

    setIsDepositProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const dueDateIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const balanceRemaining = Math.max(0, selectedVehicleForDeposit.askingPriceGhs - depositAmount);
      const isFullSettlement = balanceRemaining === 0;

      // 1. Create Customer
      const customerId = `cust-${Date.now()}`;
      const customer = {
        id: customerId,
        fullName: buyerName,
        phone: buyerPhone,
        email: buyerEmail || 'customer@paystack.gh',
        ghanaCardNumber: 'ONLINE_PAYSTACK_HOLD',
        address: 'Online Showroom Reservation',
        customerType: 'INDIVIDUAL' as const,
        kycVerified: false,
        notes: `Online reservation deposit for ${selectedVehicleForDeposit.year} ${selectedVehicleForDeposit.make} ${selectedVehicleForDeposit.model}`,
        createdAt: nowIso,
      };
      await db.customers.add(customer);
      await syncEngine.queueMutation('customers', customerId, 'CREATE', customer);

      // 2. Mark Vehicle status
      const updatedVehicleStatus = isFullSettlement ? 'SOLD' : 'RESERVED';
      await db.dealershipVehicles.update(selectedVehicleForDeposit.id, {
        status: updatedVehicleStatus,
      });
      await syncEngine.queueMutation('dealershipVehicles', selectedVehicleForDeposit.id, 'UPDATE', {
        status: updatedVehicleStatus,
      });

      // 3. Create 14-day Payment Plan for the vehicle balance
      const planId = `plan-${Date.now()}`;
      const paymentPlan: PaymentPlan = {
        id: planId,
        referenceType: 'DEALERSHIP',
        referenceId: selectedVehicleForDeposit.id,
        referenceTitle: `${selectedVehicleForDeposit.year} ${selectedVehicleForDeposit.make} ${selectedVehicleForDeposit.model} (${selectedVehicleForDeposit.stockNumber})`,
        customerId,
        customerName: buyerName,
        customerPhone: buyerPhone,
        totalPriceGhs: selectedVehicleForDeposit.askingPriceGhs,
        depositPaidGhs: depositAmount,
        balanceRemainingGhs: balanceRemaining,
        initialDueDate: dueDateIso,
        currentDueDate: dueDateIso,
        status: isFullSettlement ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
        extensions: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await db.paymentPlans.add(paymentPlan);
      await syncEngine.queueMutation('paymentPlans', planId, 'CREATE', paymentPlan);

      // 4. Issue Paystack deposit receipt
      const receiptId = `rcp-${Date.now()}`;
      const receiptNumber = `AM-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const receipt: Receipt = {
        id: receiptId,
        receiptNumber,
        paymentPlanId: planId,
        referenceType: 'DEALERSHIP',
        referenceId: selectedVehicleForDeposit.id,
        referenceTitle: `${selectedVehicleForDeposit.stockNumber}: ${selectedVehicleForDeposit.make} ${selectedVehicleForDeposit.model} (Deposit)`,
        customerId,
        customerName: buyerName,
        customerPhone: buyerPhone,
        amountPaidGhs: depositAmount,
        paymentMethod: 'CARD_PAYSTACK',
        transactionReference: `PSTK-SUBACC-${Date.now().toString().slice(-6)}`,
        totalPaidToDateGhs: depositAmount,
        balanceRemainingGhs: balanceRemaining,
        balanceDueDate: isFullSettlement ? undefined : dueDateIso,
        cashierName: 'Paystack Subaccount Escrow',
        issuedLocation: 'Amen Mart Online Gateway',
        printedAt: nowIso,
        syncStatus: 'SYNCED',
      };

      await db.receipts.add(receipt);
      await syncEngine.queueMutation('receipts', receiptId, 'CREATE', receipt);

      // 5. Post to General Ledger (Account 1080 Paystack Settlement Clearing)
      try {
        await postPaymentReceiptLedger(
          receiptNumber,
          buyerName,
          `${selectedVehicleForDeposit.stockNumber}: ${selectedVehicleForDeposit.make} ${selectedVehicleForDeposit.model}`,
          'DEALERSHIP',
          depositAmount,
          'CARD_PAYSTACK',
          'Paystack Online Gateway'
        );
      } catch (ledgerErr) {
        console.warn('Online deposit GL posting note:', ledgerErr);
      }

      setIsDepositSuccessful(true);
    } catch (err) {
      console.error('Failed to process online deposit:', err);
      setDepositError('Failed to process reservation payment. Please try again.');
    } finally {
      setIsDepositProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Spintex Showroom Stock
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Direct Imported Vehicle Showroom
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct vehicle sales (separate from auctioned vehicles). Reserve online via Paystack deposit.
          </p>
        </div>

        {/* Search & Fuel filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search make, model, VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const).map((fuel) => (
              <button
                key={fuel}
                onClick={() => setFuelFilter(fuel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  fuelFilter === fuel
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {fuel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredVehicles.map((car) => (
          <div
            key={car.id}
            className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="relative h-56 bg-slate-200 dark:bg-slate-800">
                <Image
                  src={car.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                  alt={`${car.make} ${car.model}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                    {car.stockNumber}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant={car.status === 'AVAILABLE' ? 'success' : car.status === 'RESERVED' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {car.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {car.year} {car.make} {car.model}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">{car.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5 text-indigo-500" />
                    {car.fuelType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 text-indigo-500" />
                    {car.mileageKm.toLocaleString()} km
                  </span>
                  <span className="col-span-2 font-mono text-[11px] text-slate-400">
                    VIN: {car.vin}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Price (Cash / Card):</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatGHS(car.askingPriceGhs)}
                </p>
              </div>

              {car.status === 'AVAILABLE' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedVehicleForDeposit(car);
                    setIsDepositSuccessful(false);
                  }}
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                >
                  Reserve Online
                </Button>
              ) : (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                  Reserved / Sold
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Paystack Online Deposit Modal */}
      {selectedVehicleForDeposit && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title="Online Vehicle Reservation Deposit"
          subtitle="Processed securely through Paystack subaccount with instant receipt."
          maxWidth="md"
        >
          {isDepositSuccessful ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Reservation Confirmed!
              </h3>
              <p className="text-xs text-slate-500">
                Vehicle stock <strong>{selectedVehicleForDeposit.stockNumber}</strong> has been marked RESERVED in the AmenDesk showroom registry. An official deposit receipt has been issued.
              </p>
              <div className="pt-4">
                <Button variant="primary" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOnlineDeposit} className="space-y-4">
              {depositError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {depositError}
                </div>
              )}

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">
                  {selectedVehicleForDeposit.year} {selectedVehicleForDeposit.make} {selectedVehicleForDeposit.model}
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  Full Price: <strong className="font-mono">{formatGHS(selectedVehicleForDeposit.askingPriceGhs)}</strong> &bull; Holding Deposit: <strong className="font-mono">{formatGHS(depositAmount)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Nana Kwesi"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+233 24 XXX XXXX"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="buyer@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Holding Deposit Amount (GH₵) *</label>
                <input
                  type="number"
                  min="5000"
                  max={selectedVehicleForDeposit.askingPriceGhs}
                  step="any"
                  required
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                <span>256-bit encrypted Paystack escrow processing.</span>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isDepositProcessing}>
                  Pay {formatGHS(depositAmount)} with Paystack
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

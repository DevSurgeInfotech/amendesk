'use client';

import { useState, type FormEvent } from 'react';
import type { AuctionLot, PaymentMethod, MoMoNetwork, Receipt, PaymentPlan, Invoice } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useTerminal } from '@/context/TerminalContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ThermalReceipt } from '@/components/erp/ThermalReceipt';
import { formatGHS } from '@/lib/utils/currency';
import { CreditCard, Smartphone, Banknote, Building } from 'lucide-react';
import { postPaymentReceiptLedger } from '@/lib/accounting/ledger';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot?: AuctionLot;
  paymentPlan?: PaymentPlan;
  invoice?: Invoice;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  lot,
  paymentPlan,
  invoice,
  onSuccess,
}: PaymentModalProps) {
  const { currentStaffName, facilityLocation, isOnline } = useTerminal();

  const customerName =
    lot?.winningBidderName ||
    paymentPlan?.customerName ||
    invoice?.customerName ||
    'Walk-in Client';
  const customerPhone =
    lot?.winningBidderPhone ||
    paymentPlan?.customerPhone ||
    invoice?.customerPhone ||
    '+233 24 000 0000';
  const customerId =
    lot?.winningBidderId ||
    paymentPlan?.customerId ||
    invoice?.customerId ||
    'cust-generic';
  const balanceRemaining =
    lot?.balanceDueGhs ??
    paymentPlan?.balanceRemainingGhs ??
    invoice?.balanceDueGhs ??
    0;
  const priorPaidGhs =
    lot?.depositAmountGhs ??
    paymentPlan?.depositPaidGhs ??
    invoice?.amountPaidGhs ??
    0;
  const referenceTitle = lot
    ? `${lot.lotNumber}: ${lot.title}`
    : paymentPlan?.referenceTitle ||
      invoice?.referenceTitle ||
      (invoice ? `Invoice ${invoice.invoiceNumber}` : 'Sale Item');
  const referenceType = (
    lot
      ? 'AUCTION'
      : paymentPlan?.referenceType || invoice?.referenceType || 'AUCTION'
  ) as 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL';
  const referenceId =
    lot?.id || paymentPlan?.referenceId || invoice?.referenceId || invoice?.id || '';

  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const amount = customAmount ?? balanceRemaining;
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [momoNetwork, setMomoNetwork] = useState<MoMoNetwork>('MTN');
  const [txnRef, setTxnRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<Receipt | null>(null);

  const handleClose = () => {
    setCustomAmount(null);
    setCreatedReceipt(null);
    setErrorMsg('');
    setTxnRef('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than GH₵ 0.00');
      return;
    }
    if (balanceRemaining > 0 && amount > balanceRemaining) {
      setErrorMsg(`Payment amount cannot exceed current balance due (${formatGHS(balanceRemaining)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNumber = `AM-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBalanceRemaining = Math.max(0, Math.round((balanceRemaining - amount) * 100) / 100);
      const isSettled = newBalanceRemaining === 0;
      const nowIso = new Date().toISOString();

      // Find linked payment plan if only lot was passed
      const linkedPlan =
        paymentPlan ||
        (lot
          ? await db.paymentPlans.where('referenceId').equals(lot.id).first()
          : undefined);

      // Find linked auction lot if only paymentPlan was passed
      const linkedLot =
        lot ||
        (paymentPlan && paymentPlan.referenceType === 'AUCTION'
          ? await db.auctionLots.get(paymentPlan.referenceId)
          : undefined);

      const receipt: Receipt = {
        id: `rcp-${Date.now()}`,
        receiptNumber,
        paymentPlanId: linkedPlan?.id,
        referenceType,
        referenceId,
        referenceTitle,
        customerId,
        customerName,
        customerPhone,
        amountPaidGhs: amount,
        paymentMethod: method,
        momoNetwork: method === 'MOMO' ? momoNetwork : undefined,
        transactionReference: txnRef || (method === 'CASH' ? 'CASH-TILL-01' : undefined),
        totalPaidToDateGhs: priorPaidGhs + amount,
        balanceRemainingGhs: newBalanceRemaining,
        balanceDueDate: isSettled
          ? undefined
          : linkedLot?.balanceDueDate || linkedPlan?.currentDueDate || invoice?.dueDate,
        cashierName: currentStaffName,
        issuedLocation: facilityLocation,
        printedAt: nowIso,
        syncStatus: isOnline ? 'SYNCED' : 'PENDING',
      };

      await db.receipts.add(receipt);

      // Update Auction Lot if relevant (either passed directly or linked via PaymentPlan)
      if (linkedLot) {
        const updatedStatus = isSettled ? 'FULLY_PAID' : 'AWAITING_BALANCE';
        const updatedDeposit = (linkedLot.depositAmountGhs || 0) + amount;
        await db.auctionLots.update(linkedLot.id, {
          depositAmountGhs: updatedDeposit,
          balanceDueGhs: newBalanceRemaining,
          status: updatedStatus,
          updatedAt: nowIso,
        });

        await syncEngine.queueMutation('auctionLots', linkedLot.id, 'UPDATE', {
          depositAmountGhs: updatedDeposit,
          balanceDueGhs: newBalanceRemaining,
          status: updatedStatus,
          updatedAt: nowIso,
        });
      }

      // Update Payment Plan if relevant (either passed directly or linked via AuctionLot)
      if (linkedPlan) {
        const updatedStatus = isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE';
        const updatedDeposit = linkedPlan.depositPaidGhs + amount;
        await db.paymentPlans.update(linkedPlan.id, {
          depositPaidGhs: updatedDeposit,
          balanceRemainingGhs: newBalanceRemaining,
          status: updatedStatus,
          updatedAt: nowIso,
        });

        await syncEngine.queueMutation('paymentPlans', linkedPlan.id, 'UPDATE', {
          depositPaidGhs: updatedDeposit,
          balanceRemainingGhs: newBalanceRemaining,
          status: updatedStatus,
          updatedAt: nowIso,
        });

        // Also sync non-auction asset status if linkedPlan settles Dealership / Land / Property
        if (linkedPlan.referenceType === 'DEALERSHIP' && linkedPlan.referenceId) {
          const newAssetStatus = isSettled ? 'SOLD' : 'RESERVED';
          await db.dealershipVehicles.update(linkedPlan.referenceId, { status: newAssetStatus });
          await syncEngine.queueMutation('dealershipVehicles', linkedPlan.referenceId, 'UPDATE', {
            status: newAssetStatus,
          });
        } else if (linkedPlan.referenceType === 'LAND' && linkedPlan.referenceId) {
          const newAssetStatus = isSettled ? 'SOLD' : 'RESERVED';
          await db.landParcels.update(linkedPlan.referenceId, { status: newAssetStatus });
          await syncEngine.queueMutation('landParcels', linkedPlan.referenceId, 'UPDATE', {
            status: newAssetStatus,
          });
        } else if (linkedPlan.referenceType === 'PROPERTY' && linkedPlan.referenceId) {
          const newAssetStatus = isSettled ? 'SOLD' : 'RESERVED';
          await db.propertyUnits.update(linkedPlan.referenceId, { status: newAssetStatus });
          await syncEngine.queueMutation('propertyUnits', linkedPlan.referenceId, 'UPDATE', {
            status: newAssetStatus,
          });
        }
      }

      // Update Invoice if relevant
      if (invoice) {
        const updatedPaid = invoice.amountPaidGhs + amount;
        const updatedInvoiceStatus = isSettled ? 'PAID' : 'PARTIALLY_PAID';
        await db.invoices.update(invoice.id, {
          amountPaidGhs: updatedPaid,
          balanceDueGhs: newBalanceRemaining,
          status: updatedInvoiceStatus,
        });
        await syncEngine.queueMutation('invoices', invoice.id, 'UPDATE', {
          amountPaidGhs: updatedPaid,
          balanceDueGhs: newBalanceRemaining,
          status: updatedInvoiceStatus,
        });
      }

      await syncEngine.queueMutation('receipts', receipt.id, 'CREATE', receipt);

      // Post balanced double-entry to General Ledger
      try {
        await postPaymentReceiptLedger(
          receipt.receiptNumber,
          receipt.customerName,
          receipt.referenceTitle,
          receipt.referenceType,
          receipt.amountPaidGhs,
          receipt.paymentMethod,
          receipt.cashierName,
          receipt.momoNetwork
        );
      } catch (postErr) {
        console.warn('GL automated posting note:', postErr);
      }

      setCreatedReceipt(receipt);
      onSuccess();
    } catch (err) {
      console.error('Failed to process payment:', err);
      setErrorMsg('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdReceipt ? 'Payment Receipt Logged' : 'Record Deposit / Instalment Payment'}
      subtitle={
        createdReceipt
          ? 'Transaction booked into ledger with device-generated receipt sequence.'
          : 'Multi-mode receipting: Cash, Mobile Money (Hubtel/MTN/Vodafone), Bank Transfer, or Card.'
      }
      maxWidth={createdReceipt ? 'md' : 'lg'}
    >
      {createdReceipt ? (
        <ThermalReceipt receipt={createdReceipt} onClose={handleClose} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Particulars:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {referenceTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {customerName}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Current Balance Due:</span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {formatGHS(balanceRemaining)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMethod('MOMO')}
                className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                  method === 'MOMO'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="h-4 w-4 text-amber-500" />
                <span>Mobile Money (MoMo)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                  method === 'CASH'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote className="h-4 w-4 text-emerald-500" />
                <span>Cash at Desk</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                  method === 'BANK_TRANSFER'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Building className="h-4 w-4 text-blue-500" />
                <span>Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CARD_PAYSTACK')}
                className={`p-3 rounded-xl border flex items-center gap-2 font-medium transition-colors ${
                  method === 'CARD_PAYSTACK'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span>Card / Paystack</span>
              </button>
            </div>
          </div>

          {/* MoMo Network Option */}
          {method === 'MOMO' && (
            <div className="grid grid-cols-3 gap-2">
              {(['MTN', 'VODAFONE', 'AIRTELTIGO'] as MoMoNetwork[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setMomoNetwork(net)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    momoNetwork === net
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount to Pay (GH₵) *
              </label>
              <button
                type="button"
                onClick={() => setCustomAmount(balanceRemaining)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Full Balance ({formatGHS(balanceRemaining)})
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={balanceRemaining || 10000000}
              step="any"
              required
              value={amount || ''}
              onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Transaction Reference / Hash */}
          {method !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Ref / MoMo Code / Bank Slip *
              </label>
              <input
                type="text"
                required
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. HUB-789124 / GCB-TRF-00192"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Post Payment &amp; Print Receipt
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

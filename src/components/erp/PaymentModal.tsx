'use client';

import { useState, type FormEvent } from 'react';
import type { AuctionLot, PaymentMethod, MoMoNetwork, Receipt, PaymentPlan } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ThermalReceipt } from '@/components/erp/ThermalReceipt';
import { formatGHS } from '@/lib/utils/currency';
import { CreditCard, Smartphone, Banknote, Building } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot?: AuctionLot;
  paymentPlan?: PaymentPlan;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  lot,
  paymentPlan,
  onSuccess,
}: PaymentModalProps) {
  const customerName = lot?.winningBidderName || paymentPlan?.customerName || 'Walk-in Client';
  const customerPhone = lot?.winningBidderPhone || paymentPlan?.customerPhone || '+233 24 000 0000';
  const customerId = lot?.winningBidderId || paymentPlan?.customerId || 'cust-generic';
  const balanceRemaining = lot?.balanceDueGhs ?? paymentPlan?.balanceRemainingGhs ?? 0;
  const referenceTitle = lot ? `${lot.lotNumber}: ${lot.title}` : (paymentPlan?.referenceTitle || 'Sale Item');
  const referenceType = (lot ? 'AUCTION' : paymentPlan?.referenceType || 'AUCTION') as 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY';
  const referenceId = lot?.id || paymentPlan?.referenceId || '';

  const [amount, setAmount] = useState<number>(balanceRemaining);
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [momoNetwork, setMomoNetwork] = useState<MoMoNetwork>('MTN');
  const [txnRef, setTxnRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<Receipt | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      const receiptNumber = `AM-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBalanceRemaining = Math.max(0, balanceRemaining - amount);
      const isSettled = newBalanceRemaining === 0;

      const receipt: Receipt = {
        id: `rcp-${Date.now()}`,
        receiptNumber,
        paymentPlanId: paymentPlan?.id,
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
        totalPaidToDateGhs: (lot?.depositAmountGhs || paymentPlan?.depositPaidGhs || 0) + amount,
        balanceRemainingGhs: newBalanceRemaining,
        balanceDueDate: lot?.balanceDueDate || paymentPlan?.currentDueDate,
        cashierName: 'Mary Afriyie',
        issuedLocation: 'Front Desk — Amen Mart Tema',
        printedAt: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.receipts.add(receipt);

      // Update Auction Lot if relevant
      if (lot) {
        const updatedStatus = isSettled ? 'FULLY_PAID' : 'AWAITING_BALANCE';
        const updatedDeposit = (lot.depositAmountGhs || 0) + amount;
        await db.auctionLots.update(lot.id, {
          depositAmountGhs: updatedDeposit,
          balanceDueGhs: newBalanceRemaining,
          status: updatedStatus,
        });

        await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', {
          depositAmountGhs: updatedDeposit,
          balanceDueGhs: newBalanceRemaining,
          status: updatedStatus,
        });
      }

      // Update Payment Plan if relevant
      if (paymentPlan) {
        const updatedStatus = isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE';
        const updatedDeposit = paymentPlan.depositPaidGhs + amount;
        await db.paymentPlans.update(paymentPlan.id, {
          depositPaidGhs: updatedDeposit,
          balanceRemainingGhs: newBalanceRemaining,
          status: updatedStatus,
        });

        await syncEngine.queueMutation('paymentPlans', paymentPlan.id, 'UPDATE', {
          depositPaidGhs: updatedDeposit,
          balanceRemainingGhs: newBalanceRemaining,
          status: updatedStatus,
        });
      }

      await syncEngine.queueMutation('receipts', receipt.id, 'CREATE', receipt);

      setCreatedReceipt(receipt);
      onSuccess();
    } catch (err) {
      console.error('Failed to process payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdReceipt ? 'Payment Receipt Logged' : 'Record Deposit / Instalment Payment'}
      subtitle={
        createdReceipt
          ? 'Transaction booked into ledger with device-generated receipt sequence.'
          : 'Multi-mode receipting: Cash, Mobile Money (Hubtel/MTN/Vodafone), Bank Transfer, or Card.'
      }
      maxWidth={createdReceipt ? 'md' : 'lg'}
    >
      {createdReceipt ? (
        <ThermalReceipt receipt={createdReceipt} onClose={onClose} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                onClick={() => setAmount(balanceRemaining)}
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
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
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
            <Button type="button" variant="outline" onClick={onClose}>
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

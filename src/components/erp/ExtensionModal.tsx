'use client';

import { useState, type FormEvent } from 'react';
import type { AuctionLot, PaymentPlan } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useTerminal } from '@/context/TerminalContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CalendarPlus, AlertCircle } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot?: AuctionLot;
  paymentPlan?: PaymentPlan;
  onSuccess: () => void;
}

export function ExtensionModal({
  isOpen,
  onClose,
  lot,
  paymentPlan,
  onSuccess,
}: ExtensionModalProps) {
  const { currentStaffName } = useTerminal();
  const currentDueDate = lot?.balanceDueDate || paymentPlan?.currentDueDate || new Date().toISOString();
  // Default new date +7 days from current or today
  const defaultNextDate = new Date(new Date(currentDueDate).getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [newDueDate, setNewDueDate] = useState(defaultNextDate);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDueDate || !reason) return;

    setIsSubmitting(true);
    try {
      const fullIsoDate = new Date(newDueDate).toISOString();
      const nowIso = new Date().toISOString();

      const linkedLot =
        lot ||
        (paymentPlan && paymentPlan.referenceType === 'AUCTION'
          ? await db.auctionLots.get(paymentPlan.referenceId)
          : undefined);

      const linkedPlan =
        paymentPlan ||
        (lot
          ? await db.paymentPlans.where('referenceId').equals(lot.id).first()
          : undefined);

      if (linkedLot) {
        const extensionCount = (linkedLot.extensionCount || 0) + 1;
        await db.auctionLots.update(linkedLot.id, {
          balanceDueDate: fullIsoDate,
          status: 'AWAITING_BALANCE', // restore from OVERDUE to active awaiting balance
          extensionCount,
          extensionReason: reason,
          updatedAt: nowIso,
        });

        await syncEngine.queueMutation('auctionLots', linkedLot.id, 'UPDATE', {
          balanceDueDate: fullIsoDate,
          status: 'AWAITING_BALANCE',
          extensionCount,
          extensionReason: reason,
          updatedAt: nowIso,
        });
      }

      if (linkedPlan) {
        const updatedExtensions = [
          ...linkedPlan.extensions,
          {
            extendedBy: currentStaffName,
            extendedAt: nowIso,
            newDueDate: fullIsoDate,
            reason,
          },
        ];

        await db.paymentPlans.update(linkedPlan.id, {
          currentDueDate: fullIsoDate,
          status: 'EXTENDED',
          extensions: updatedExtensions,
          updatedAt: nowIso,
        });

        await syncEngine.queueMutation('paymentPlans', linkedPlan.id, 'UPDATE', {
          currentDueDate: fullIsoDate,
          status: 'EXTENDED',
          extensions: updatedExtensions,
          updatedAt: nowIso,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to grant extension:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant 14-Day Balance Settlement Extension"
      subtitle="Extend payment window per Amen Mart management policy (No re-auction required)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Buyer Extension Policy</span>
          </div>
          <p className="text-amber-700 dark:text-amber-300">
            Client goods &amp; documents remain securely in the Amen Mart yard until full clearance.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            New Extended Due Date *
          </label>
          <input
            type="date"
            required
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Official Reason for Extension *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Buyer bank draft clearing delay / Commercial financing approved by Ecobank..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Authorizing Manager
          </label>
          <input
            type="text"
            readOnly
            value={currentStaffName}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<CalendarPlus className="h-4 w-4" />}
          >
            Approve Extension
          </Button>
        </div>
      </form>
    </Modal>
  );
}

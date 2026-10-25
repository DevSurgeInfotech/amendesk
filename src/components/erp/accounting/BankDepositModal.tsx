'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { postBankDeposit } from '@/lib/accounting/banking';
import { formatGHS } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { useTerminal } from '@/context/TerminalContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Building,
  CheckCircle,
  AlertCircle,
  Banknote,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface BankDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BankDepositModal({ isOpen, onClose, onSuccess }: BankDepositModalProps) {
  const { role, currentStaffName } = useTerminal();
  const isAuthorized = role === 'ACCOUNTANT' || role === 'OWNER' || role === 'ADMIN';

  // Live queries
  const unclearedReceipts = useLiveQuery(
    async () => {
      const receipts = await db.receipts.toArray();
      return receipts.filter(
        (r) =>
          r.depositStatus !== 'DEPOSITED' &&
          (r.paymentMethod === 'CASH' || r.paymentMethod === 'MOMO' || r.paymentMethod === 'CARD_PAYSTACK')
      );
    },
    []
  ) || [];

  const bankAccounts = useLiveQuery(
    async () => {
      const accounts = await db.accounts.toArray();
      return accounts.filter(
        (a) =>
          a.type === 'ASSET' &&
          (a.code === '1050' || a.code === '1060' || a.code === '1070' || a.category === 'CURRENT_ASSET') &&
          !a.code.startsWith('101') && // exclude cash tills
          !a.code.startsWith('103') && // exclude momo clearing
          a.code !== '1200' && // exclude AR
          !a.code.startsWith('13') // exclude inventory
      );
    },
    []
  ) || [];

  const defaultBank = bankAccounts.find((a) => a.code === '1050') || bankAccounts[0];

  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [bankSlipRef, setBankSlipRef] = useState('');
  const [depositDate, setDepositDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Receipts Totals
  const selectedReceipts = unclearedReceipts.filter((r) => selectedReceiptIds.includes(r.id));
  const selectedCash = selectedReceipts
    .filter((r) => r.paymentMethod === 'CASH')
    .reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const selectedMoMo = selectedReceipts
    .filter((r) => r.paymentMethod === 'MOMO')
    .reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const selectedTotal = selectedReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);

  const toggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedReceiptIds.length === unclearedReceipts.length) {
      setSelectedReceiptIds([]);
    } else {
      setSelectedReceiptIds(unclearedReceipts.map((r) => r.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAuthorized) {
      setErrorMsg('Unauthorized: Bank deposits can strictly only be posted by the Chief Accountant or Admin.');
      return;
    }

    if (selectedReceiptIds.length === 0) {
      setErrorMsg('Please select at least one uncleared collection to deposit.');
      return;
    }

    const effectiveTargetId = targetAccountId || defaultBank?.id;
    if (!effectiveTargetId) {
      setErrorMsg('Please select a valid destination commercial bank account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postBankDeposit({
        targetBankAccountId: effectiveTargetId,
        clearedReceiptIds: selectedReceiptIds,
        bankSlipReference: bankSlipRef.trim() || undefined,
        depositDate,
        notes: notes.trim() || undefined,
        depositorName: currentStaffName,
        depositedByRole: role as 'ACCOUNTANT' | 'OWNER' | 'ADMIN',
      });

      setSelectedReceiptIds([]);
      setBankSlipRef('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record bank deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prepare Bank Deposit (Clearance Queue)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Enforcement Notice */}
        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
            isAuthorized
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}
        >
          {isAuthorized ? (
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          )}
          <div>
            <div className="font-bold uppercase tracking-wider text-[11px] mb-0.5">
              Role Authority: {role} &bull; {currentStaffName}
            </div>
            {isAuthorized ? (
              <p>
                Authorized to batch and clear till cash and MoMo collections into commercial bank accounts (GCB, Stanbic, Ecobank).
              </p>
            ) : (
              <p>
                Bank Deposits are strictly restricted to <strong>Chief Accountant</strong> or <strong>Admin</strong>. Switch to an authorized role to execute banking clearance.
              </p>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Deposit Destination Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Bank Account *
            </label>
            <select
              value={targetAccountId || defaultBank?.id || ''}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500"
              required
            >
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} ({formatGHS(a.balanceGhs)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deposit Date *
            </label>
            <input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank Deposit Slip / Teller Ref
            </label>
            <input
              type="text"
              placeholder="e.g. GCB-DEP-2026-9041"
              value={bankSlipRef}
              onChange={(e) => setBankSlipRef(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
            />
          </div>
        </div>

        {/* Uncleared Receipts Register */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Undeposited Collections Awaiting Banking ({unclearedReceipts.length})
              </span>
              <span className="text-[11px] text-slate-400">
                QuickBooks Undeposited Funds Pattern
              </span>
            </div>
            {unclearedReceipts.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {selectedReceiptIds.length === unclearedReceipts.length
                  ? 'Deselect All'
                  : 'Select All Collections'}
              </button>
            )}
          </div>

          {unclearedReceipts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                All Front-Desk Collections Are Cleared &amp; Banked
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                There are currently no uncleared cash or MoMo collections in the holding queue.
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {unclearedReceipts.map((r) => {
                const isSelected = selectedReceiptIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelectReceipt(r.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {r.receiptNumber}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            &bull; {r.customerName}
                          </span>
                          <Badge
                            variant={
                              r.paymentMethod === 'CASH'
                                ? 'success'
                                : r.paymentMethod === 'MOMO'
                                ? 'warning'
                                : 'info'
                            }
                            size="sm"
                          >
                            {r.paymentMethod === 'CASH' && (
                              <Banknote className="h-3 w-3 mr-1 inline" />
                            )}
                            {r.paymentMethod === 'MOMO' && (
                              <Smartphone className="h-3 w-3 mr-1 inline" />
                            )}
                            {r.paymentMethod === 'CARD_PAYSTACK' && (
                              <CreditCard className="h-3 w-3 mr-1 inline" />
                            )}
                            {r.paymentMethod}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {r.referenceTitle} &bull; {formatDate(r.printedAt)} &bull; Cashier: {r.cashierName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {formatGHS(r.amountPaidGhs)}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                        Undeposited
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Totals Breakdown */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Cash Selected
              </div>
              <div className="font-bold text-emerald-400 text-sm">{formatGHS(selectedCash)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                MoMo Selected
              </div>
              <div className="font-bold text-amber-400 text-sm">{formatGHS(selectedMoMo)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Receipts Count
              </div>
              <div className="font-bold text-slate-200 text-sm">
                {selectedReceiptIds.length} of {unclearedReceipts.length}
              </div>
            </div>
          </div>

          <div className="text-right border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0 md:pl-6 w-full md:w-auto">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Total Deposit Amount
            </div>
            <div className="text-xl font-black text-white">{formatGHS(selectedTotal)}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reconciliation &amp; Banking Notes
          </label>
          <input
            type="text"
            placeholder="e.g. End of day (5:00 PM) cash collections banked at GCB High Street branch"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || selectedReceiptIds.length === 0 || !isAuthorized}
            icon={<Building className="h-4 w-4" />}
          >
            {isSubmitting ? 'Posting Bank Deposit...' : `Confirm Deposit of ${formatGHS(selectedTotal)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

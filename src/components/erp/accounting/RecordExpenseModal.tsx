'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/lib/types';
import { postJournalEntry } from '@/lib/accounting/ledger';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CreditCard, Smartphone, Banknote, Building } from 'lucide-react';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getDefaultExpenseDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateExpenseNumber(): string {
  return `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateExpenseId(): string {
  return `exp-${Date.now()}`;
}

function generateExpenseJournalLineId(suffix: string): string {
  return `line-${Date.now()}-${suffix}`;
}

export function RecordExpenseModal({ isOpen, onClose, onSuccess }: RecordExpenseModalProps) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];

  const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');
  const assetAccounts = accounts.filter(
    (a) => a.type === 'ASSET' && (a.category === 'CURRENT_ASSET' || a.code.startsWith('10'))
  );

  const [date, setDate] = useState(getDefaultExpenseDate);
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('YARD_OPERATIONS');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidFromAccountId, setPaidFromAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount <= 0) {
      setErrorMsg('Amount must be greater than GH₵ 0');
      return;
    }

    const selectedExpenseAccount = accounts.find((a) => a.id === expenseAccountId);
    const selectedPaidFromAccount = accounts.find((a) => a.id === paidFromAccountId);

    if (!selectedExpenseAccount) {
      setErrorMsg('Please select an Expense Account');
      return;
    }
    if (!selectedPaidFromAccount) {
      setErrorMsg('Please select the Account paid from');
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseNumber = generateExpenseNumber();

      const newExpense: Expense = {
        id: generateExpenseId(),
        expenseNumber,
        date: new Date(date).toISOString(),
        category,
        expenseAccountId: selectedExpenseAccount.id,
        expenseAccountName: selectedExpenseAccount.name,
        payee,
        amountGhs: amount,
        paymentMethod,
        paidFromAccountId: selectedPaidFromAccount.id,
        paidFromAccountName: selectedPaidFromAccount.name,
        referenceNumber: referenceNumber || undefined,
        description,
        recordedBy: 'Mary Afriyie',
        status: 'PAID',
        createdAt: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.expenses.add(newExpense);
      await syncEngine.queueMutation('expenses', newExpense.id, 'CREATE', newExpense);

      // Post double-entry to General Ledger:
      // Debit: Expense Account (increases expense)
      // Credit: Cash / Bank Asset Account (decreases asset)
      await postJournalEntry({
        entryNumber: `JE-${expenseNumber.replace('EXP-', '')}`,
        date: new Date(date).toISOString(),
        reference: expenseNumber,
        description: `Expense ${expenseNumber}: ${payee} — ${description}`,
        lines: [
          {
            id: generateExpenseJournalLineId('1'),
            accountId: selectedExpenseAccount.id,
            accountCode: selectedExpenseAccount.code,
            accountName: selectedExpenseAccount.name,
            debitGhs: amount,
            creditGhs: 0,
            memo: `${category}: ${description}`,
          },
          {
            id: generateExpenseJournalLineId('2'),
            accountId: selectedPaidFromAccount.id,
            accountCode: selectedPaidFromAccount.code,
            accountName: selectedPaidFromAccount.name,
            debitGhs: 0,
            creditGhs: amount,
            memo: `Disbursement to ${payee}`,
          },
        ],
        totalAmountGhs: amount,
        createdBy: 'Mary Afriyie',
        status: 'POSTED',
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to record expense:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operating Expense / Disbursement"
      subtitle="Logs business expenditure into Accounts Payable and automatically posts debit/credit to GL."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payee / Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Omega Guard Force / GOIL Tema / ECG Ghana"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="YARD_OPERATIONS">Yard &amp; Showroom Operations</option>
              <option value="SECURITY">Security &amp; Surveillance</option>
              <option value="JUDICIAL_LEGAL">Judicial Bailiff &amp; Court Fees</option>
              <option value="TOWING_LOGISTICS">Heavy Towing &amp; Logistics</option>
              <option value="UTILITIES">Utilities (ECG, Generator Diesel)</option>
              <option value="TELECOMS">Telecoms &amp; Bulk SMS</option>
              <option value="MARKETING">Marketing &amp; Catalog Publishing</option>
              <option value="PAYROLL_CASUAL">Staff Payroll &amp; Casual Labor</option>
              <option value="FEES_COMMISSIONS">Payment Gateway &amp; Bank Fees</option>
              <option value="REPAIRS_MAINTENANCE">Repairs &amp; Yard Maintenance</option>
              <option value="OTHER">Other Operating Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GL Expense Account *
            </label>
            <select
              required
              value={expenseAccountId}
              onChange={(e) => setExpenseAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Select Expense GL Account --</option>
              {expenseAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount to Disburse (GH₵) *
            </label>
            <input
              type="number"
              min="0.5"
              step="any"
              required
              placeholder="0.00"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paid From (Disbursement Account) *
            </label>
            <select
              required
              value={paidFromAccountId}
              onChange={(e) => setPaidFromAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Select Source Asset Account --</option>
              {assetAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name} (Bal: GH₵ {acc.balanceGhs.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Disbursement Method
          </label>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                paymentMethod === 'CASH'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Banknote className="h-3.5 w-3.5 text-emerald-500" />
              <span>Cash Till</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOMO')}
              className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                paymentMethod === 'MOMO'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-amber-500" />
              <span>MoMo</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
              className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building className="h-3.5 w-3.5 text-blue-500" />
              <span>Bank Wire</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD_PAYSTACK')}
              className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                paymentMethod === 'CARD_PAYSTACK'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-purple-500" />
              <span>Card</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor Receipt / Invoice Ref
            </label>
            <input
              type="text"
              placeholder="e.g. INV-90124 / GOIL-0091"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Particulars *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 300L Diesel for 100kVA generator"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Record &amp; Post Disbursement
          </Button>
        </div>
      </form>
    </Modal>
  );
}

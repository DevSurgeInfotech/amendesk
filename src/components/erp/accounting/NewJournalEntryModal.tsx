'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { JournalEntryLine } from '@/lib/types';
import { postJournalEntry } from '@/lib/accounting/ledger';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatGHS } from '@/lib/utils/currency';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface NewJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generateJournalEntryNumber(): string {
  return `JE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

function getDefaultPostingDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateLineId(idx: number): string {
  return `line-${Date.now()}-${idx}`;
}

export function NewJournalEntryModal({ isOpen, onClose, onSuccess }: NewJournalEntryModalProps) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];

  const [date, setDate] = useState(getDefaultPostingDate);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<Array<{
    accountId: string;
    debitGhs: number;
    creditGhs: number;
    memo: string;
  }>>([
    { accountId: '', debitGhs: 0, creditGhs: 0, memo: '' },
    { accountId: '', debitGhs: 0, creditGhs: 0, memo: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalDebits = lines.reduce((acc, l) => acc + (Number(l.debitGhs) || 0), 0);
  const totalCredits = lines.reduce((acc, l) => acc + (Number(l.creditGhs) || 0), 0);
  const imbalance = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);
  const isBalanced = imbalance === 0 && totalDebits > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debitGhs: 0, creditGhs: 0, memo: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: unknown) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isBalanced) {
      setErrorMsg(`Entry is not balanced. Debits must equal Credits (Current difference: ${formatGHS(imbalance)})`);
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].accountId) {
        setErrorMsg(`Please select an account for line #${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const entryLines: JournalEntryLine[] = lines.map((l, idx) => {
        const acc = accounts.find((a) => a.id === l.accountId);
        return {
          id: generateLineId(idx),
          accountId: l.accountId,
          accountCode: acc?.code || '',
          accountName: acc?.name || '',
          debitGhs: Number(l.debitGhs) || 0,
          creditGhs: Number(l.creditGhs) || 0,
          memo: l.memo || description,
        };
      });

      await postJournalEntry({
        entryNumber: generateJournalEntryNumber(),
        date: new Date(date).toISOString(),
        reference: reference || 'MANUAL-JE',
        description,
        lines: entryLines,
        totalAmountGhs: totalDebits,
        createdBy: 'Mary Afriyie (Accountant)',
        status: 'POSTED',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to post manual journal entry:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manual General Ledger Journal Entry"
      subtitle="Double-entry compound voucher. All debits must strictly equal credits before posting."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Posting Date *
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
              Document Reference
            </label>
            <input
              type="text"
              placeholder="e.g. AUD-ADJ-004 / GCB-SLIP-89"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Entry Description / Memo *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Month-end yard depreciation allocation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Lines Builder */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span className="col-span-5">Chart of Account</span>
            <span className="col-span-3">Line Memo</span>
            <span className="col-span-2 text-right">Debit (GH₵)</span>
            <span className="col-span-2 text-right">Credit (GH₵)</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-5">
                  <select
                    required
                    value={line.accountId}
                    onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="">-- Select GL Account --</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Memo"
                    value={line.memo}
                    onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={line.debitGhs || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleLineChange(idx, 'debitGhs', val);
                      if (val > 0) handleLineChange(idx, 'creditGhs', 0);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right text-xs font-mono font-semibold"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={line.creditGhs || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleLineChange(idx, 'creditGhs', val);
                      if (val > 0) handleLineChange(idx, 'debitGhs', 0);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right text-xs font-mono font-semibold"
                  />
                  {lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove line"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddLine}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Journal Line
            </Button>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400 mr-2">Total Debits:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatGHS(totalDebits)}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Total Credits:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatGHS(totalCredits)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Status Banner */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            isBalanced
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <span>
              {isBalanced
                ? 'Journal Entry is perfectly balanced (Debits = Credits)'
                : `Out of balance by ${formatGHS(imbalance)}. Please reconcile lines.`}
            </span>
          </div>
          <span className="font-mono text-sm">{formatGHS(totalDebits)}</span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isBalanced || isSubmitting}
            isLoading={isSubmitting}
          >
            Post Journal Entry to General Ledger
          </Button>
        </div>
      </form>
    </Modal>
  );
}

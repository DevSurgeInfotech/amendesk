'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import type { Account, AccountType, AccountCategory } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useTerminal } from '@/context/TerminalContext';
import { postJournalEntry } from '@/lib/accounting/ledger';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewAccountModal({ isOpen, onClose, onSuccess }: NewAccountModalProps) {
  const { currentStaffName } = useTerminal();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('EXPENSE');
  const [category, setCategory] = useState<AccountCategory>('OPERATING_EXPENSE');
  const [description, setDescription] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    if (newType === 'ASSET') setCategory('CURRENT_ASSET');
    else if (newType === 'LIABILITY') setCategory('CURRENT_LIABILITY');
    else if (newType === 'EQUITY') setCategory('EQUITY');
    else if (newType === 'REVENUE') setCategory('OPERATING_REVENUE');
    else if (newType === 'EXPENSE') setCategory('OPERATING_EXPENSE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code || !name) {
      setErrorMsg('Code and Name are required');
      return;
    }

    // Check duplicate code
    const existing = await db.accounts.where('code').equals(code.trim()).first();
    if (existing) {
      setErrorMsg(`Account with code ${code} already exists (${existing.name})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        code: code.trim(),
        name: name.trim(),
        type,
        category,
        balanceGhs: 0,
        description,
        isSystem: false,
        currency: 'GHS',
        createdAt: new Date().toISOString(),
      };

      await db.accounts.add(newAcc);
      await syncEngine.queueMutation('accounts', newAcc.id, 'CREATE', newAcc);

      // If openingBalance > 0, post a balanced double-entry against Owner's Equity (3100)
      // so the Trial Balance remains in strict mathematical equilibrium.
      if (openingBalance > 0) {
        const equityAcc =
          (await db.accounts.where('code').equals('3100').first()) ||
          (await db.accounts.where('type').equals('EQUITY').first());

        if (equityAcc) {
          const isDebitNormal = type === 'ASSET' || type === 'EXPENSE';
          await postJournalEntry({
            entryNumber: `JE-OB-${Date.now().toString().slice(-5)}`,
            date: new Date().toISOString(),
            reference: `OB-${newAcc.code}`,
            description: `Opening Balance Allocation for ${newAcc.code} — ${newAcc.name}`,
            lines: [
              {
                id: `line-${Date.now()}-1`,
                accountId: newAcc.id,
                accountCode: newAcc.code,
                accountName: newAcc.name,
                debitGhs: isDebitNormal ? openingBalance : 0,
                creditGhs: isDebitNormal ? 0 : openingBalance,
                memo: 'Opening balance setup',
              },
              {
                id: `line-${Date.now()}-2`,
                accountId: equityAcc.id,
                accountCode: equityAcc.code,
                accountName: equityAcc.name,
                debitGhs: isDebitNormal ? 0 : openingBalance,
                creditGhs: isDebitNormal ? openingBalance : 0,
                memo: `Opening balance offset for ${newAcc.code}`,
              },
            ],
            totalAmountGhs: openingBalance,
            createdBy: currentStaffName,
            status: 'POSTED',
          });
        } else {
          await db.accounts.update(newAcc.id, { balanceGhs: openingBalance });
        }
      }

      setCode('');
      setName('');
      setDescription('');
      setOpeningBalance(0);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create GL account:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Chart of Accounts (GL) Account"
      subtitle="Expand the general ledger chart of accounts with custom sub-accounts."
      maxWidth="md"
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
              Account Type *
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as AccountType)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="ASSET">Asset (1000s)</option>
              <option value="LIABILITY">Liability (2000s)</option>
              <option value="EQUITY">Equity (3000s)</option>
              <option value="REVENUE">Revenue (4000s)</option>
              <option value="EXPENSE">Expense (5000s - 6000s)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AccountCategory)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {type === 'ASSET' && (
                <>
                  <option value="CURRENT_ASSET">Current Asset (Liquid / Cash / Receivables)</option>
                  <option value="NON_CURRENT_ASSET">Non-Current Asset (Property / Plant / Fleet)</option>
                </>
              )}
              {type === 'LIABILITY' && (
                <>
                  <option value="CURRENT_LIABILITY">Current Liability (Payables / Taxes / Escrow)</option>
                  <option value="LONG_TERM_LIABILITY">Long-Term Liability (Term Loans / Mortgages)</option>
                </>
              )}
              {type === 'EQUITY' && <option value="EQUITY">Equity &amp; Reserves</option>}
              {type === 'REVENUE' && (
                <>
                  <option value="OPERATING_REVENUE">Operating Revenue (Auction / Vehicle / Land)</option>
                  <option value="OTHER_REVENUE">Other Income (Fees / Penalties / Storage)</option>
                </>
              )}
              {type === 'EXPENSE' && (
                <>
                  <option value="OPERATING_EXPENSE">Operating Expense (Yard / Security / Towing)</option>
                  <option value="ADMIN_EXPENSE">Administrative Expense (Payroll / Office)</option>
                  <option value="FINANCIAL_EXPENSE">Financial Expense (Gateway / Bank Charges)</option>
                  <option value="COST_OF_SALES">Cost of Sales (COGS)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GL Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1090"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Account Name / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CalBank Collection Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Opening Balance (GH₵)
          </label>
          <input
            type="number"
            step="any"
            value={openingBalance || ''}
            onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description / Accounting Notes
          </label>
          <textarea
            rows={2}
            placeholder="Operational purpose of this general ledger account..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save GL Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

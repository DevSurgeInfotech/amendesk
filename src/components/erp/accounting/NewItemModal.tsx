'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { createAccountingItem } from '@/lib/accounting/items';
import type { ItemType } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Package, AlertCircle } from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewItemModal({ isOpen, onClose, onSuccess }: NewItemModalProps) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const revenueAccounts = accounts.filter((a) => a.type === 'REVENUE');
  const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');
  const assetAccounts = accounts.filter((a) => a.type === 'ASSET' && a.code.startsWith('13'));

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [type, setType] = useState<ItemType>('FEE');
  const [category, setCategory] = useState<'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'OPERATIONS'>('AUCTION');
  const [incomeAccountId, setIncomeAccountId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [assetAccountId, setAssetAccountId] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [isTaxable, setIsTaxable] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const defaultIncomeAcc = revenueAccounts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !sku.trim()) {
      setErrorMsg('Item Name and SKU are required.');
      return;
    }

    const effectiveIncomeId = incomeAccountId || defaultIncomeAcc?.id;
    if (!effectiveIncomeId) {
      setErrorMsg('Please select a valid Income GL Account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAccountingItem({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        type,
        category,
        incomeAccountId: effectiveIncomeId,
        expenseAccountId: expenseAccountId || undefined,
        assetAccountId: assetAccountId || undefined,
        defaultUnitPriceGhs: defaultPrice > 0 ? defaultPrice : undefined,
        isTaxable,
        description: description.trim(),
      });

      setName('');
      setSku('');
      setDescription('');
      setDefaultPrice(0);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Product / Service Item" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              placeholder="e.g. 7% Judicial Auction Margin Fee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              SKU / Item Code *
            </label>
            <input
              type="text"
              placeholder="e.g. FEE-AUC-JUD-07"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium font-mono uppercase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
            >
              <option value="FEE">Fee / Charge</option>
              <option value="SERVICE">Service</option>
              <option value="INVENTORY">Inventory Asset (Tracked)</option>
              <option value="NON_INVENTORY">Non-Inventory Product</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
            >
              <option value="AUCTION">Auction</option>
              <option value="DEALERSHIP">Car Dealership</option>
              <option value="LAND">Land Conveyancing</option>
              <option value="PROPERTY">Property Units</option>
              <option value="OPERATIONS">Yard &amp; Logistics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Unit Price (GH₵)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={defaultPrice || ''}
              onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
            />
          </div>
        </div>

        {/* Two-Sided GL Accounts */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            QuickBooks Two-Sided GL Account Mapping
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Income Account (Credited when sold) *
            </label>
            <select
              value={incomeAccountId || defaultIncomeAcc?.id || ''}
              onChange={(e) => setIncomeAccountId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
              required
            >
              {revenueAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {(type === 'INVENTORY' || type === 'SERVICE') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expense / COGS Account (Debited on cost)
              </label>
              <select
                value={expenseAccountId}
                onChange={(e) => setExpenseAccountId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
              >
                <option value="">-- None / Direct Pass-Through --</option>
                {expenseAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'INVENTORY' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Account (Debited when inventoried)
              </label>
              <select
                value={assetAccountId}
                onChange={(e) => setAssetAccountId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
              >
                <option value="">-- Select Inventory Asset Account --</option>
                {assetAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isTaxable"
            checked={isTaxable}
            onChange={(e) => setIsTaxable(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <label htmlFor="isTaxable" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            Subject to Ghana Statutory Tax Levies (15% VAT, 2.5% NHIL, 2.5% GETFund, 1% COVID)
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Item purpose, pricing basis, or legal note..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-medium"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            icon={<Package className="h-4 w-4" />}
          >
            {isSubmitting ? 'Creating Item...' : 'Save Product / Service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

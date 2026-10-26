'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { InventoryItem } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatGHS } from '@/lib/utils/currency';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface EditInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess?: () => void;
}

interface EditInventoryItemFormProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditInventoryItemForm({ item, onClose, onSuccess }: EditInventoryItemFormProps) {
  const [name, setName] = useState(item.name || '');
  const [sku, setSku] = useState(item.sku || '');
  const [category, setCategory] = useState<'VEHICLE' | 'EQUIPMENT' | 'PART' | 'MATERIAL'>(item.category || 'EQUIPMENT');
  const [location, setLocation] = useState<'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP'>(item.location || 'AUCTION_YARD');
  const [quantity, setQuantity] = useState<number>(item.quantity || 1);
  const [landedCostGhs, setLandedCostGhs] = useState<number>(item.landedCostGhs || 0);
  const [condition, setCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR'>(item.condition || 'GOOD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !sku.trim()) {
      setErrorMsg('Item name and SKU/Code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedItem: InventoryItem = {
        ...item,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category,
        location,
        quantity: quantity > 0 ? quantity : 1,
        landedCostGhs: landedCostGhs >= 0 ? landedCostGhs : 0,
        condition,
        lastCountDate: new Date().toISOString(),
      };

      await db.inventoryItems.put(updatedItem);
      await syncEngine.queueMutation('inventoryItems', item.id, 'UPDATE', updatedItem);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update inventory item:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update inventory item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await db.inventoryItems.delete(item.id);
      await syncEngine.queueMutation('inventoryItems', item.id, 'DELETE', { id: item.id });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete inventory item:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete inventory item.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Item Name / Description *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2023 Toyota Land Cruiser Prado (AM-CAR-5102)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            SKU / Stock Reference *
          </label>
          <input
            type="text"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            placeholder="e.g. AM-CAR-5102"
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Asset Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'VEHICLE' | 'EQUIPMENT' | 'PART' | 'MATERIAL')}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="VEHICLE">Vehicle</option>
            <option value="EQUIPMENT">Equipment &amp; Heavy Plant</option>
            <option value="PART">Spare Part</option>
            <option value="MATERIAL">Workshop Material</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Facility Location *
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as 'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP')}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="AUCTION_YARD">Auction Yard (Gbawe Bay A/B)</option>
            <option value="DEALERSHIP_SHOWROOM">Dealership Showroom</option>
            <option value="WORKSHOP">Maintenance Workshop</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Asset Condition *
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR')}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="REQUIRES_REPAIR">Requires Repair</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tracked Quantity *
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Unit Landed Cost (GH₵)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={landedCostGhs || ''}
            onChange={(e) => setLandedCostGhs(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 150000"
            className="w-full px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
        <span className="text-slate-500">Total Asset Valuation:</span>
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {formatGHS(landedCostGhs * quantity)}
        </span>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                Delete item?
              </span>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete Stock Item
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isSubmitting}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Item Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditInventoryItemModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: EditInventoryItemModalProps) {
  if (!isOpen || !item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Stock Item • ${item.sku}`}
      subtitle="Modify inventory asset valuation, facility location, and physical condition."
      maxWidth="lg"
    >
      <EditInventoryItemForm
        key={item.id}
        item={item}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

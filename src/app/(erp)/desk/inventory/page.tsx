'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { InventoryItem, StockMovement } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { ArrowRightLeft, MapPin, History } from 'lucide-react';

export default function InventoryPage() {
  const items = useLiveQuery(() => db.inventoryItems.toArray(), []) || [];
  const movements = useLiveQuery(() => db.stockMovements.toArray(), []) || [];

  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<InventoryItem | null>(null);
  const [toLocation, setToLocation] = useState<'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP'>('DEALERSHIP_SHOWROOM');
  const [transferReason, setTransferReason] = useState('');
  const [transferStaff] = useState('David Mensah (Inventory Officer)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValuation = items.reduce((acc, it) => acc + (it.landedCostGhs * it.quantity), 0);

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTransfer) return;

    setIsSubmitting(true);
    try {
      const movementId = `mov-${Date.now()}`;
      const newMovement: StockMovement = {
        id: movementId,
        itemId: selectedItemForTransfer.id,
        itemName: selectedItemForTransfer.name,
        fromLocation: selectedItemForTransfer.location,
        toLocation,
        quantity: 1,
        transferredBy: transferStaff,
        timestamp: new Date().toISOString(),
        reason: transferReason || 'Operational facility relocation',
      };

      await db.stockMovements.add(newMovement);
      await db.inventoryItems.update(selectedItemForTransfer.id, {
        location: toLocation,
      });

      await syncEngine.queueMutation('stockMovements', movementId, 'CREATE', newMovement);
      await syncEngine.queueMutation('inventoryItems', selectedItemForTransfer.id, 'UPDATE', {
        location: toLocation,
      });

      setSelectedItemForTransfer(null);
      setTransferReason('');
    } catch (err) {
      console.error('Failed to transfer stock:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Central Stock Ledger
            </span>
            <span className="text-xs text-slate-400">Multi-Location Tracking &bull; Landed Cost Valuation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory &amp; Facility Stock Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Unifies auction yard inventory, dealership showroom units, and workshop spares with inter-location gate transfers.
          </p>
        </div>

        <div className="text-right bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Stock Valuation:</span>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {formatGHS(totalValuation)}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Stock Items Across Facilities
          </h2>
          <span className="text-xs text-slate-500">{items.length} Tracked Assets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">SKU / Code</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Facility Location</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Landed Valuation</th>
                <th className="p-4 text-center">Condition</th>
                <th className="p-4 text-center">Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {it.sku}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                    {it.name}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" size="sm">
                      {it.category}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      {it.location.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold font-mono">
                    {it.quantity}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatGHS(it.landedCostGhs)}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="success" size="sm">
                      {it.condition}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedItemForTransfer(it)}
                      icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                    >
                      Relocate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transfer Movement History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Inter-Facility Stock Movement Log
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {movements.map((mov) => (
            <div key={mov.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {mov.itemName} (Qty: {mov.quantity})
                </p>
                <p className="text-slate-500">
                  Transferred from <strong>{mov.fromLocation}</strong> &rarr; <strong>{mov.toLocation}</strong> by {mov.transferredBy}
                </p>
                <p className="text-[11px] text-slate-400 italic">&quot;{mov.reason}&quot;</p>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {formatDateTime(mov.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Stock Modal */}
      {selectedItemForTransfer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedItemForTransfer(null)}
          title={`Relocate ${selectedItemForTransfer.name}`}
          subtitle="Record inter-facility transfer with gate clearance authorization."
          maxWidth="md"
        >
          <form onSubmit={handleTransferStock} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
              <p>Current Location: <strong className="font-bold">{selectedItemForTransfer.location.replace('_', ' ')}</strong></p>
              <p>Valuation: <strong className="font-mono">{formatGHS(selectedItemForTransfer.landedCostGhs)}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Destination Facility *
              </label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value as 'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="AUCTION_YARD">Auction Yard (Tema)</option>
                <option value="DEALERSHIP_SHOWROOM">Dealership Showroom (Spintex)</option>
                <option value="WORKSHOP">Workshop &amp; Reconditioning Bay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Reason for Movement *
              </label>
              <textarea
                required
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Moved to Spintex showroom for executive client viewing..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSelectedItemForTransfer(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Authorize &amp; Transfer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

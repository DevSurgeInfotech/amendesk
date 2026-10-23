'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { InventoryItem, StockMovement } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/date';
import { useTerminal } from '@/context/TerminalContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { ArrowRightLeft, MapPin, History, PlusCircle, Search, PackageCheck } from 'lucide-react';

function generateMovementId(): string {
  return `mov-${Date.now()}`;
}

function generateInventoryId(): string {
  return `inv-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialLoc = searchParams.get('location')?.toUpperCase();
  const initialTab = searchParams.get('tab')?.toLowerCase();

  const { currentStaffName } = useTerminal();

  const items = useLiveQuery(() => db.inventoryItems.toArray(), []) || [];
  const movements = useLiveQuery(() => db.stockMovements.toArray(), []) || [];

  // Active view tab
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>(
    initialTab === 'movements' ? 'MOVEMENTS' : 'ITEMS'
  );

  // Filters
  const [locationFilter, setLocationFilter] = useState<'ALL' | 'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP'>(
    initialLoc === 'AUCTION_YARD' || initialLoc === 'DEALERSHIP_SHOWROOM' || initialLoc === 'WORKSHOP'
      ? initialLoc
      : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Transfer modal
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<InventoryItem | null>(null);
  const [toLocation, setToLocation] = useState<'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP'>(
    'DEALERSHIP_SHOWROOM'
  );
  const [transferReason, setTransferReason] = useState('');

  // Add Item modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState<'VEHICLE' | 'EQUIPMENT' | 'PART' | 'MATERIAL'>('EQUIPMENT');
  const [newItemLocation, setNewItemLocation] = useState<'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP'>(
    'AUCTION_YARD'
  );
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newLandedCostGhs, setNewLandedCostGhs] = useState<number>(0);
  const [newCondition, setNewCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR'>('GOOD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValuation = items.reduce((acc, it) => acc + it.landedCostGhs * it.quantity, 0);

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTransfer) return;

    setIsSubmitting(true);
    try {
      const movementId = generateMovementId();
      const nowIso = getIsoTimestamp();

      const newMovement: StockMovement = {
        id: movementId,
        itemId: selectedItemForTransfer.id,
        itemName: selectedItemForTransfer.name,
        fromLocation: selectedItemForTransfer.location,
        toLocation,
        quantity: 1,
        transferredBy: currentStaffName || 'Inventory Officer',
        timestamp: nowIso,
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

  const handleCreateStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemId = generateInventoryId();
      const nowIso = getIsoTimestamp();

      const newItem: InventoryItem = {
        id: itemId,
        name: newItemName,
        sku: newSku || `SKU-${Date.now().toString().slice(-6)}`,
        category: newCategory,
        location: newItemLocation,
        quantity: newQuantity || 1,
        landedCostGhs: newLandedCostGhs || 0,
        condition: newCondition,
        lastCountDate: nowIso,
      };

      await db.inventoryItems.add(newItem);
      await syncEngine.queueMutation('inventoryItems', itemId, 'CREATE', newItem);

      setIsAddOpen(false);
      setNewItemName('');
      setNewSku('');
      setNewQuantity(1);
      setNewLandedCostGhs(0);
    } catch (err) {
      console.error('Failed to create inventory item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((it) => {
    if (locationFilter !== 'ALL' && it.location !== locationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = it.name.toLowerCase().includes(q);
      const matchSku = it.sku.toLowerCase().includes(q);
      const matchCategory = it.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCategory) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
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

        <div className="flex items-center gap-4">
          <div className="text-right bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Stock Valuation:</span>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {formatGHS(totalValuation)}
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
            Add Stock Item
          </Button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Tab */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mr-3">
            <button
              onClick={() => setActiveTab('ITEMS')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'ITEMS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stock Register ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('MOVEMENTS')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'MOVEMENTS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Transfer History ({movements.length})
            </button>
          </div>

          {activeTab === 'ITEMS' && (
            <>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Facility:</span>
              {(['ALL', 'AUCTION_YARD', 'DEALERSHIP_SHOWROOM', 'WORKSHOP'] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(loc)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    locationFilter === loc
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {loc.replace('_', ' ')}
                </button>
              ))}
            </>
          )}
        </div>

        {activeTab === 'ITEMS' && (
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, name, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {activeTab === 'ITEMS' ? (
        /* Items Table */
        <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Active Stock Items Across Facilities
            </h2>
            <span className="text-xs text-slate-500">{filteredItems.length} Tracked Assets</span>
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
                  <th className="p-4 text-right">Unit Landed Cost</th>
                  <th className="p-4 text-right">Total Valuation</th>
                  <th className="p-4 text-center">Condition</th>
                  <th className="p-4 text-center">Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No stock items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
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
                      <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatGHS(it.landedCostGhs)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatGHS(it.landedCostGhs * it.quantity)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={it.condition === 'EXCELLENT' || it.condition === 'GOOD' ? 'success' : 'default'} size="sm">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Transfer Movement History */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Inter-Facility Stock Movement Log
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {movements.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 font-semibold">
                No transfer logs recorded yet.
              </p>
            ) : (
              movements.map((mov) => (
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
              ))
            )}
          </div>
        </div>
      )}

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
                <option value="AUCTION_YARD">Auction Yard (Gbawe)</option>
                <option value="DEALERSHIP_SHOWROOM">Dealership Showroom</option>
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
                placeholder="e.g. Moved to showroom floor for executive client viewing..."
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

      {/* Add Stock Item Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Inventory Item"
        subtitle="Register new physical asset into AmenDesk stock ledger."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStockItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Item / Asset Name *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. CAT 320D Excavator Bucket or Office Desk Suite"
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">SKU / Tracking Tag</label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="e.g. SKU-EQ-8910"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as 'VEHICLE' | 'EQUIPMENT' | 'PART' | 'MATERIAL')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="EQUIPMENT">Equipment &amp; Machinery</option>
                <option value="VEHICLE">Motor Vehicle</option>
                <option value="PART">Spare Part / Accessory</option>
                <option value="MATERIAL">Building / Construction Material</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Storage Location *</label>
              <select
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value as 'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="AUCTION_YARD">Auction Yard (Gbawe)</option>
                <option value="DEALERSHIP_SHOWROOM">Dealership Showroom</option>
                <option value="WORKSHOP">Workshop &amp; Reconditioning Bay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Unit Landed Cost (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={newLandedCostGhs || ''}
                onChange={(e) => setNewLandedCostGhs(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Asset Condition *</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="REQUIRES_REPAIR">Requires Reconditioning / Repair</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} icon={<PackageCheck className="h-4 w-4" />}>
              Save Stock Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-semibold text-sm">
          Loading Inventory Ledger...
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}

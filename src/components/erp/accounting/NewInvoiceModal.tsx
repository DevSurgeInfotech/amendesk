'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Invoice, InvoiceItem } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatGHS } from '@/lib/utils/currency';
import { Plus, Trash2 } from 'lucide-react';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getDefaultIssueDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDefaultDueDate(): string {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function generateInvoiceNumber(): string {
  return `AM-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateInvoiceId(): string {
  return `inv-${Date.now()}`;
}

function generateItemId(idx: number): string {
  return `item-${Date.now()}-${idx}`;
}

export function NewInvoiceModal({ isOpen, onClose, onSuccess }: NewInvoiceModalProps) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []) || [];
  const landParcels = useLiveQuery(() => db.landParcels.toArray(), []) || [];
  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []) || [];

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGhanaCard, setCustomerGhanaCard] = useState('');

  const [referenceType, setReferenceType] = useState<'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL'>('AUCTION');
  const [referenceId, setReferenceId] = useState('');
  const [referenceTitle, setReferenceTitle] = useState('');

  const [issueDate, setIssueDate] = useState(getDefaultIssueDate);
  const [dueDate, setDueDate] = useState(getDefaultDueDate);

  const [items, setItems] = useState<Array<{ id: string; description: string; quantity: number; unitPriceGhs: number }>>([
    { id: '1', description: '', quantity: 1, unitPriceGhs: 0 },
  ]);

  const [applyVat, setApplyVat] = useState(false);
  const [notes, setNotes] = useState('Payment due within 14 calendar days per Amen Mart settlement policy.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.fullName);
      setCustomerPhone(cust.phone);
      setCustomerGhanaCard(cust.ghanaCardNumber);
    }
  };

  const handleReferenceChange = (type: typeof referenceType, id: string) => {
    setReferenceType(type);
    setReferenceId(id);

    if (type === 'AUCTION') {
      const lot = lots.find((l) => l.id === id);
      if (lot) {
        setReferenceTitle(`${lot.lotNumber}: ${lot.title}`);
        setItems([
          {
            id: '1',
            description: `${lot.title} (Hammer Price)`,
            quantity: 1,
            unitPriceGhs: lot.hammerPriceGhs || lot.currentBidGhs,
          },
          {
            id: '2',
            description: 'Statutory 7% Auction Buyers’ Margin Fee',
            quantity: 1,
            unitPriceGhs: lot.marginFeeGhs || (lot.currentBidGhs * 0.07),
          },
        ]);
        if (lot.winningBidderId) handleCustomerSelect(lot.winningBidderId);
      }
    } else if (type === 'DEALERSHIP') {
      const v = vehicles.find((car) => car.id === id);
      if (v) {
        setReferenceTitle(`${v.year} ${v.make} ${v.model} (${v.stockNumber})`);
        setItems([
          {
            id: '1',
            description: `${v.year} ${v.make} ${v.model} — VIN: ${v.vin}`,
            quantity: 1,
            unitPriceGhs: v.askingPriceGhs,
          },
        ]);
      }
    } else if (type === 'LAND') {
      const l = landParcels.find((p) => p.id === id);
      if (l) {
        setReferenceTitle(`${l.siteRef}: ${l.title}`);
        setItems([
          {
            id: '1',
            description: `${l.title} (${l.sizeAcres} Acres, ${l.location})`,
            quantity: 1,
            unitPriceGhs: l.priceGhs,
          },
        ]);
      }
    } else if (type === 'PROPERTY') {
      const p = properties.find((u) => u.id === id);
      if (p) {
        setReferenceTitle(`${p.unitRef}: ${p.title}`);
        setItems([
          {
            id: '1',
            description: `${p.title} (${p.location})`,
            quantity: 1,
            unitPriceGhs: p.priceGhs,
          },
        ]);
      }
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: `${Date.now()}`, description: '', quantity: 1, unitPriceGhs: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations
  const subtotalGhs = items.reduce((acc, it) => acc + (it.quantity * it.unitPriceGhs), 0);
  const vatGhs = applyVat ? Math.round(subtotalGhs * 0.15 * 100) / 100 : 0;
  const nhilGhs = applyVat ? Math.round(subtotalGhs * 0.025 * 100) / 100 : 0;
  const getfundGhs = applyVat ? Math.round(subtotalGhs * 0.025 * 100) / 100 : 0;
  const covidGhs = applyVat ? Math.round(subtotalGhs * 0.01 * 100) / 100 : 0;
  const totalAmountGhs = subtotalGhs + vatGhs + nhilGhs + getfundGhs + covidGhs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName) {
      setErrorMsg('Please select or specify customer name');
      return;
    }

    if (totalAmountGhs <= 0) {
      setErrorMsg('Invoice total must be greater than GH₵ 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceNumber = generateInvoiceNumber();

      const invoiceItems: InvoiceItem[] = items.map((it, idx) => ({
        id: generateItemId(idx),
        description: it.description,
        quantity: it.quantity,
        unitPriceGhs: it.unitPriceGhs,
        totalGhs: it.quantity * it.unitPriceGhs,
      }));

      const newInvoice: Invoice = {
        id: generateInvoiceId(),
        invoiceNumber,
        customerId: customerId || generateInvoiceId(),
        customerName,
        customerPhone,
        customerGhanaCard: customerGhanaCard || undefined,
        referenceType,
        referenceId: referenceId || undefined,
        referenceTitle: referenceTitle || undefined,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        items: invoiceItems,
        subtotalGhs,
        vatGhs,
        nhilGhs,
        getfundGhs,
        covidGhs,
        totalAmountGhs,
        amountPaidGhs: 0,
        balanceDueGhs: totalAmountGhs,
        status: 'ISSUED',
        notes,
        createdAt: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.invoices.add(newInvoice);
      await syncEngine.queueMutation('invoices', newInvoice.id, 'CREATE', newInvoice);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Commercial / Tax Invoice"
      subtitle="Generates billing invoice for Auction settlement, Vehicle showroom sale, or Land/Property unit."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Reference Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset / Service Line
              </label>
              <select
                value={referenceType}
                onChange={(e) => handleReferenceChange(e.target.value as typeof referenceType, '')}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="AUCTION">Auction Lot Hammer Sale</option>
                <option value="DEALERSHIP">Car Dealership Vehicle Sale</option>
                <option value="LAND">Land Parcel Sale</option>
                <option value="PROPERTY">Property Development Unit</option>
                <option value="GENERAL">General Services / Storage / Towing</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Item / Lot / Stock Ref
              </label>
              {referenceType === 'AUCTION' && (
                <select
                  value={referenceId}
                  onChange={(e) => handleReferenceChange('AUCTION', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Auction Lot --</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lotNumber}: {l.title} ({formatGHS(l.currentBidGhs)})
                    </option>
                  ))}
                </select>
              )}

              {referenceType === 'DEALERSHIP' && (
                <select
                  value={referenceId}
                  onChange={(e) => handleReferenceChange('DEALERSHIP', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Showroom Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.stockNumber}: {v.year} {v.make} {v.model} ({formatGHS(v.askingPriceGhs)})
                    </option>
                  ))}
                </select>
              )}

              {referenceType === 'LAND' && (
                <select
                  value={referenceId}
                  onChange={(e) => handleReferenceChange('LAND', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Land Parcel --</option>
                  {landParcels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.siteRef}: {l.title} ({formatGHS(l.priceGhs)})
                    </option>
                  ))}
                </select>
              )}

              {referenceType === 'PROPERTY' && (
                <select
                  value={referenceId}
                  onChange={(e) => handleReferenceChange('PROPERTY', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Select Property Unit --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.unitRef}: {p.title} ({formatGHS(p.priceGhs)})
                    </option>
                  ))}
                </select>
              )}

              {referenceType === 'GENERAL' && (
                <input
                  type="text"
                  placeholder="e.g. Yard Demurrage / Catalog Processing"
                  value={referenceTitle}
                  onChange={(e) => setReferenceTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              CRM Customer / Buyer *
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Select Registered Client --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone / Ghana Card
            </label>
            <input
              type="text"
              placeholder="+233 24 ... / GHA-..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Due Date (14-Day Hammer Terms) *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold text-indigo-600 dark:text-indigo-400"
            />
          </div>
        </div>

        {/* Line Items Builder */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price (GH₵)</span>
            <span className="col-span-2 text-right">Total (GH₵)</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Item particulars"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={item.unitPriceGhs || ''}
                    onChange={(e) => handleItemChange(idx, 'unitPriceGhs', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono font-bold"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatGHS(item.quantity * item.unitPriceGhs)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
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
              onClick={handleAddItem}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Item
            </Button>

            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Apply GRA Statutory Taxes (15% VAT + 2.5% NHIL + 2.5% GETFund + 1% COVID)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Invoice Notes & Terms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Invoice Notes &amp; Settlement Terms
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            placeholder="Settlement terms or customer memo..."
          />
        </div>

        {/* Totals Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal:</span>
            <span className="font-bold">{formatGHS(subtotalGhs)}</span>
          </div>
          {applyVat && (
            <>
              <div className="flex justify-between text-slate-500">
                <span>GRA VAT (15%):</span>
                <span>{formatGHS(vatGhs)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>NHIL (2.5%):</span>
                <span>{formatGHS(nhilGhs)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GETFund (2.5%):</span>
                <span>{formatGHS(getfundGhs)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>COVID-19 Health Recovery Levy (1%):</span>
                <span>{formatGHS(covidGhs)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-slate-100">
            <span>Total Payable:</span>
            <span className="text-indigo-600 dark:text-indigo-400">{formatGHS(totalAmountGhs)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Generate &amp; Issue Commercial Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}

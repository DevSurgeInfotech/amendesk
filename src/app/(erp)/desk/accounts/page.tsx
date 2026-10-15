'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Receipt, PaymentMethod } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { ThermalReceipt } from '@/components/erp/ThermalReceipt';
import { Modal } from '@/components/ui/Modal';
import {
  Receipt as ReceiptIcon,
  Printer,
  Smartphone,
  Banknote,
  Building,
  CreditCard,
  Search,
} from 'lucide-react';

export default function AccountsPage() {
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | PaymentMethod>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = receipts.filter((r) => {
    if (selectedMethod !== 'ALL' && r.paymentMethod !== selectedMethod) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.referenceTitle.toLowerCase().includes(q) ||
        (r.transactionReference && r.transactionReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCollected = receipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const momoTotal = receipts.filter((r) => r.paymentMethod === 'MOMO').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const cashTotal = receipts.filter((r) => r.paymentMethod === 'CASH').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const bankTotal = receipts.filter((r) => r.paymentMethod === 'BANK_TRANSFER').reduce((acc, r) => acc + r.amountPaidGhs, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Cash Office &amp; Accounts
            </span>
            <span className="text-xs text-slate-400">Multi-Mode Reconciliation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Receipts &amp; Settlements Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Audit-ready transactions logged via Cash, MoMo (Hubtel), Bank Wire, and Card. Printable on 80mm thermal rolls.
          </p>
        </div>
      </div>

      {/* Payment Modes Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Collections
            </span>
            <ReceiptIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">
            {formatGHS(totalCollected)}
          </p>
          <p className="text-xs text-slate-500">{receipts.length} total receipts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mobile Money (MoMo)
            </span>
            <Smartphone className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">
            {formatGHS(momoTotal)}
          </p>
          <p className="text-xs text-amber-600 font-medium">MTN &bull; Vodafone &bull; Hubtel</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bank Wire / Draft
            </span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">
            {formatGHS(bankTotal)}
          </p>
          <p className="text-xs text-blue-600 font-medium">Commercial Banks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Front-Desk Cash
            </span>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">
            {formatGHS(cashTotal)}
          </p>
          <p className="text-xs text-emerald-600 font-medium">Till Balances</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Method filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MOMO', 'CASH', 'BANK_TRANSFER', 'CARD_PAYSTACK'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedMethod === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt, customer, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Receipt No.</th>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Customer Particulars</th>
                <th className="p-4">Sale Item / Lot</th>
                <th className="p-4">Payment Mode</th>
                <th className="p-4 text-right">Amount Paid</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredReceipts.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {rcp.receiptNumber}
                  </td>
                  <td className="p-4 text-slate-500">
                    {formatDateTime(rcp.printedAt)}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {rcp.customerName}
                    </p>
                    <p className="text-[11px] text-slate-400">{rcp.customerPhone}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                      {rcp.referenceTitle}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {rcp.referenceType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {rcp.paymentMethod === 'MOMO' && <Smartphone className="h-3.5 w-3.5 text-amber-500" />}
                      {rcp.paymentMethod === 'CASH' && <Banknote className="h-3.5 w-3.5 text-emerald-500" />}
                      {rcp.paymentMethod === 'BANK_TRANSFER' && <Building className="h-3.5 w-3.5 text-blue-500" />}
                      {rcp.paymentMethod === 'CARD_PAYSTACK' && <CreditCard className="h-3.5 w-3.5 text-purple-500" />}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {rcp.paymentMethod}
                        {rcp.momoNetwork ? ` (${rcp.momoNetwork})` : ''}
                      </span>
                    </div>
                    {rcp.transactionReference && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Ref: {rcp.transactionReference}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {formatGHS(rcp.amountPaidGhs)}
                  </td>
                  <td className="p-4 text-right font-mono text-xs">
                    <span className={rcp.balanceRemainingGhs > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                      {formatGHS(rcp.balanceRemainingGhs)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingReceipt(rcp)}
                      icon={<Printer className="h-3.5 w-3.5" />}
                    >
                      Reprint
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Reprint Modal */}
      {viewingReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setViewingReceipt(null)}
          title={`Official Receipt ${viewingReceipt.receiptNumber}`}
          subtitle="Ready for 80mm front-desk thermal printing or digital archiving."
          maxWidth="sm"
        >
          <ThermalReceipt receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
        </Modal>
      )}
    </div>
  );
}

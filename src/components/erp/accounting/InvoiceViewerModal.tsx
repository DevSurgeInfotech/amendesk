'use client';

import type { Invoice } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatGHS } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { Printer, CreditCard } from 'lucide-react';

interface InvoiceViewerModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export function InvoiceViewerModal({
  invoice,
  isOpen,
  onClose,
  onRecordPayment,
}: InvoiceViewerModalProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Commercial Invoice ${invoice.invoiceNumber}`}
      subtitle="Official commercial billing & tax document for Amen Mart Ghana."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="a4-document-container p-6 bg-white text-slate-900 border border-slate-200 rounded-xl space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  AM
                </div>
                <div>
                  <h2 className="font-black text-lg text-slate-900 tracking-tight">AMEN MART GHANA</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Auctions &bull; Dealership &bull; Land &bull; Property</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Tema Main Yard, Off Harbour Road &bull; Spintex Showroom, Accra
              </p>
              <p className="text-[11px] text-slate-500">
                TIN: C0009128490 &bull; Tel: +233 (0) 30 223 9011
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-widest text-indigo-600">
                Tax / Commercial Invoice
              </span>
              <p className="font-mono font-black text-lg text-slate-900 mt-1">{invoice.invoiceNumber}</p>
              <div className="mt-1">
                <Badge
                  variant={
                    invoice.status === 'PAID'
                      ? 'success'
                      : invoice.status === 'OVERDUE'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {invoice.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To</span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{invoice.customerName}</p>
              <p className="text-slate-600">{invoice.customerPhone}</p>
              {invoice.customerGhanaCard && (
                <p className="text-slate-500 font-mono text-[11px]">Ghana Card: {invoice.customerGhanaCard}</p>
              )}
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-400">Issue Date:</span>{' '}
                <span className="font-semibold text-slate-700">{formatDate(invoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-400">Payment Due:</span>{' '}
                <span className="font-bold text-rose-600">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.referenceTitle && (
                <div>
                  <span className="text-slate-400">Ref:</span>{' '}
                  <span className="font-semibold text-slate-700">{invoice.referenceTitle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Unit Price</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                  <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatGHS(item.unitPriceGhs)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{formatGHS(item.totalGhs)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatGHS(invoice.subtotalGhs)}</span>
              </div>
              {invoice.vatGhs > 0 && (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GRA VAT (15%):</span>
                    <span>{formatGHS(invoice.vatGhs)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>NHIL (2.5%):</span>
                    <span>{formatGHS(invoice.nhilGhs)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GETFund (2.5%):</span>
                    <span>{formatGHS(invoice.getfundGhs)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>COVID-19 Levy (1%):</span>
                    <span>{formatGHS(invoice.covidGhs)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span>{formatGHS(invoice.totalAmountGhs)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Paid to Date:</span>
                <span>{formatGHS(invoice.amountPaidGhs)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-black text-sm text-rose-600">
                <span>Balance Due:</span>
                <span>{formatGHS(invoice.balanceDueGhs)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Bank Details */}
          <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Settlement Accounts:</p>
            <p>
              &bull; <strong>GCB Bank</strong>: Amen Mart Ltd — Acc: 101108920194 (Accra High St Branch)
            </p>
            <p>
              &bull; <strong>MTN MoMo / Telecel</strong>: Hubtel Merchant ID: 8841029 (Amen Mart Front Desk)
            </p>
            <p className="italic text-[10px] mt-2">
              All auction hammer settlements must be concluded within 14 calendar days from hammer date.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="no-print flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print Invoice (A4)
            </Button>
            {invoice.balanceDueGhs > 0 && onRecordPayment && (
              <Button
                variant="primary"
                size="sm"
                icon={<CreditCard className="h-4 w-4" />}
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
              >
                Record Payment ({formatGHS(invoice.balanceDueGhs)})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

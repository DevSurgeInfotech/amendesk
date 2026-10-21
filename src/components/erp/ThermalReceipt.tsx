'use client';

import type { Receipt } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime, formatDate } from '@/lib/utils/date';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ThermalReceiptProps {
  receipt: Receipt;
  onClose?: () => void;
}

export function ThermalReceipt({ receipt, onClose }: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Bar (hidden when printing) */}
      <div className="no-print flex items-center justify-between w-full max-w-sm mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Receipt Preview (80mm Thermal)
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
            Print Receipt
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* 80mm Thermal Receipt Layout */}
      <div className="thermal-receipt-container bg-white text-black p-4 border border-dashed border-slate-300 rounded shadow-xs w-full max-w-[320px] font-mono text-xs">
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-black">
          <h1 className="text-sm font-black tracking-wider uppercase">
            AMEN MART AUCTIONING SERVICES
          </h1>
          <p className="text-[9px] font-bold">AUCTIONEERS REGISTRATION BOARD &amp; MIN. OF INTERIOR APPROVED</p>
          <p className="text-[9px] font-semibold text-slate-800">LEAD: DR. FRANCIS KWAKU YEBOAH &bull; GAA MEMBER</p>
          <p className="text-[10px]">Location: Gbawe, Flower Junction &bull; P. O. Box DC 1013, Dansoman</p>
          <p className="text-[10px]">Tel: 0548517277 / 0558314744 &bull; amenmart2291@gmail.com</p>
          <p className="text-[10px] font-bold mt-1 bg-black text-white py-0.5">OFFICIAL CASH OFFICE RECEIPT</p>
        </div>

        {/* Metadata */}
        <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-600">RECEIPT NO:</span>
            <span className="font-bold">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">DATE &amp; TIME:</span>
            <span>{formatDateTime(receipt.printedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">CASHIER:</span>
            <span>{receipt.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">LOCATION:</span>
            <span className="truncate max-w-[170px]">{receipt.issuedLocation}</span>
          </div>
        </div>

        {/* Customer & Item Details */}
        <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
          <div>
            <span className="text-slate-600">CUSTOMER:</span>
            <p className="font-bold">{receipt.customerName}</p>
          </div>
          <div>
            <span className="text-slate-600">PHONE:</span>
            <span> {receipt.customerPhone}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-dotted border-slate-400">
            <span className="text-slate-600">PARTICULARS:</span>
            <p className="font-semibold">{receipt.referenceTitle}</p>
            <p className="text-[10px] text-slate-700">Line: {receipt.referenceType}</p>
          </div>
        </div>

        {/* Payment Calculation */}
        <div className="py-3 border-b border-dashed border-black space-y-1.5 text-[11px]">
          <div className="flex justify-between text-xs font-black">
            <span>AMOUNT PAID:</span>
            <span>{formatGHS(receipt.amountPaidGhs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">METHOD:</span>
            <span className="font-semibold">
              {receipt.splitPayments && receipt.splitPayments.length > 0
                ? `SPLIT (${receipt.splitPayments.length} LEGS)`
                : `${receipt.paymentMethod}${receipt.momoNetwork ? ` (${receipt.momoNetwork})` : ''}`}
            </span>
          </div>
          {receipt.splitPayments && receipt.splitPayments.length > 0 ? (
            <div className="pt-1 border-t border-dotted border-slate-400 space-y-1 text-[10px]">
              {receipt.splitPayments.map((sp, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-slate-600 truncate max-w-[165px]">
                    {i + 1}. {sp.method}
                    {sp.momoNetwork ? ` (${sp.momoNetwork})` : ''}
                    {sp.bankName ? ` (${sp.bankName})` : ''}
                  </span>
                  <span className="font-bold">{formatGHS(sp.amountGhs)}</span>
                </div>
              ))}
            </div>
          ) : (
            receipt.transactionReference && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">REF/TXN ID:</span>
                <span className="truncate max-w-[160px] font-mono">
                  {receipt.transactionReference}
                </span>
              </div>
            )
          )}
          <div className="flex justify-between pt-1 border-t border-dotted border-slate-400">
            <span className="text-slate-600">TOTAL TO DATE:</span>
            <span>{formatGHS(receipt.totalPaidToDateGhs)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs">
            <span>BALANCE DUE:</span>
            <span className={receipt.balanceRemainingGhs > 0 ? 'text-black' : 'text-slate-800'}>
              {formatGHS(receipt.balanceRemainingGhs)}
            </span>
          </div>
          {receipt.balanceRemainingGhs > 0 && receipt.balanceDueDate && (
            <div className="flex justify-between text-[10px] bg-slate-100 p-1 rounded font-semibold">
              <span>DUE DATE:</span>
              <span>{formatDate(receipt.balanceDueDate)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 text-center space-y-2 text-[10px]">
          {receipt.balanceRemainingGhs === 0 ? (
            <p className="font-bold text-xs uppercase tracking-wider py-1 border border-black rounded">
              *** FULLY PAID — RELEASE AUTHORIZED ***
            </p>
          ) : (
            <p className="font-medium text-slate-800">
              * Goods/Documents released strictly after full balance settlement *
            </p>
          )}

          <p className="pt-2 text-[9px] text-slate-500">
            Generated via AmenDesk Offline Terminal. Amen Mart Auctioning Services &bull; GAA Audit.
          </p>
          <div className="text-[8px] font-mono tracking-widest text-slate-400">
            ||| | ||||| || |||||| | |||| ||| |||||||
          </div>
        </div>
      </div>
    </div>
  );
}

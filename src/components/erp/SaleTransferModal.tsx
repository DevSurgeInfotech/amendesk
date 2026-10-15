'use client';

import { useState, type FormEvent } from 'react';
import type { AuctionLot, SaleTransferDoc } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Printer, FileCheck, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { formatGHS } from '@/lib/utils/currency';

interface SaleTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: AuctionLot;
  onSuccess: () => void;
}

export function SaleTransferModal({ isOpen, onClose, lot, onSuccess }: SaleTransferModalProps) {
  const [buyerAddress, setBuyerAddress] = useState('Plot 14, Airport Residential Area, Accra');
  const [buyerGhanaCard, setBuyerGhanaCard] = useState('GHA-712894102-4');
  const [lawyerWitnessName, setLawyerWitnessName] = useState('Barrister Kofi Asante (Legal Counsel, Amen Mart)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDoc, setCreatedDoc] = useState<SaleTransferDoc | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const docNumber = `AM-TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const doc: SaleTransferDoc = {
        id: `trf-${Date.now()}`,
        docNumber,
        lotId: lot.id,
        parcelReference: lot.parcelReference || 'N/A',
        titleReference: lot.titleReference || 'N/A',
        locationArea: lot.locationArea || 'Accra, Ghana',
        sizeDimensions: lot.sizeDimensions || 'Standard Demarcation',
        buyerName: lot.winningBidderName || 'N/A',
        buyerGhanaCard,
        buyerPhone: lot.winningBidderPhone || 'N/A',
        buyerAddress,
        considerationAmountGhs: lot.hammerPriceGhs || lot.currentBidGhs,
        courtCaseNumber: lot.courtCaseNumber,
        sheriffInstructionRef: lot.sheriffInstructionRef,
        lawyerWitnessName,
        authorizedOfficer: 'Managing Auctioneer (Amen Mart)',
        executedDate: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.saleTransferDocs.add(doc);
      await db.auctionLots.update(lot.id, {
        status: 'DISPOSED',
        saleTransferDocId: doc.id,
      });

      await syncEngine.queueMutation('saleTransferDocs', doc.id, 'CREATE', doc);
      await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', {
        status: 'DISPOSED',
        saleTransferDocId: doc.id,
      });

      setCreatedDoc(doc);
      onSuccess();
    } catch (err) {
      console.error('Failed to issue transfer document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdDoc ? 'Sale & Transfer Deed Executed' : 'Execute Sale & Transfer Deed (Immovable Property)'}
      subtitle={
        createdDoc
          ? 'Transfer document registered and ready for Lands Commission indenture processing.'
          : 'Official disposal deed for Land and Buildings upon full settlement (No Waybill required).'
      }
      maxWidth="2xl"
    >
      {createdDoc ? (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Transfer Deed #{createdDoc.docNumber} Executed
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Lot status updated to DISPOSED. Authorized for title registration.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
                Print Transfer Deed
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>

          {/* Printable A4 Deed of Sale */}
          <div className="a4-document-container border border-slate-300 dark:border-slate-700 p-8 rounded-xl bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-serif shadow-sm">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4">
              <h1 className="text-2xl font-black tracking-widest uppercase text-indigo-900 dark:text-indigo-400">
                AMEN MART AUCTIONEERS
              </h1>
              <p className="text-xs font-sans uppercase font-bold text-slate-600 dark:text-slate-400 mt-1">
                Official Memorandum &amp; Deed of Auction Sale (Immovable Property)
              </p>
              <p className="text-xs font-sans text-slate-500">Tema Heavy Industrial Area &bull; P.O. Box GP 22451, Accra</p>
              <div className="mt-3 flex justify-between font-sans text-xs border-t pt-2">
                <span>Certificate No: <strong className="font-mono">{createdDoc.docNumber}</strong></span>
                <span>Date of Execution: <strong>{formatDateTime(createdDoc.executedDate)}</strong></span>
              </div>
            </div>

            {/* Recitals & Particulars */}
            <div className="mt-6 space-y-4 text-xs font-sans leading-relaxed">
              <p>
                This instrument certifies that at a public auction conducted by Amen Mart on behalf of the{' '}
                <strong>{lot.category} AUCTION DIVISION</strong>, the following described immovable property was
                knocked down to the highest bidder named herein, and that full consideration has been satisfied in the
                cash office of Amen Mart.
              </p>

              {lot.category === 'JUDICIAL' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Judicial Authority &amp; Sheriff Writ Particulars:
                  </p>
                  <p>High Court Case Reference: <strong>{lot.courtCaseNumber || 'HC/ACR/GEN/2025/118'}</strong></p>
                  <p>Sheriff Instruction / Writ of Fi-Fa Ref: <strong>{lot.sheriffInstructionRef || 'SHF/WRIT/LAND/2026/007'}</strong></p>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 border-b pb-1 uppercase tracking-wide text-xs">
                  Property Description &amp; Title Particulars
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Parcel / Cadastral Ref:</span>
                    <p className="font-bold font-mono">{createdDoc.parcelReference}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Title / Registry Ref:</span>
                    <p className="font-bold font-mono">{createdDoc.titleReference}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Location / Enclave:</span>
                    <p className="font-bold">{createdDoc.locationArea}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Acreage / Dimensions:</span>
                    <p className="font-bold">{createdDoc.sizeDimensions}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Consideration Paid:</span>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                      {formatGHS(createdDoc.considerationAmountGhs)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchaser Details */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100 border-b pb-1 uppercase tracking-wide text-xs">
                  Purchaser / Assignee
                </p>
                <p className="font-bold">{createdDoc.buyerName}</p>
                <p className="text-slate-600 dark:text-slate-400">Ghana Card: {createdDoc.buyerGhanaCard}</p>
                <p className="text-slate-600 dark:text-slate-400">Address: {createdDoc.buyerAddress}</p>
              </div>
            </div>

            {/* Signature blocks */}
            <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs font-sans">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdDoc.authorizedOfficer}</p>
                <p className="text-[10px] text-slate-500">Auctioneer In Charge</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdDoc.lawyerWitnessName}</p>
                <p className="text-[10px] text-slate-500">Witnessing Legal Counsel</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdDoc.buyerName}</p>
                <p className="text-[10px] text-slate-500">Purchaser</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs space-y-1">
            <p className="font-bold text-indigo-900 dark:text-indigo-200">
              Lot: {lot.lotNumber} &bull; {lot.title}
            </p>
            <p className="text-indigo-700 dark:text-indigo-300">
              Parcel: <span className="font-mono font-bold">{lot.parcelReference || 'N/A'}</span> &bull; Location:{' '}
              <span className="font-bold">{lot.locationArea || 'N/A'}</span>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchaser Ghana Card Number *
              </label>
              <input
                type="text"
                required
                value={buyerGhanaCard}
                onChange={(e) => setBuyerGhanaCard(e.target.value)}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchaser Domicile Address *
              </label>
              <input
                type="text"
                required
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="e.g. Plot 14, Airport Residential Area, Accra"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Witnessing Legal Counsel
              </label>
              <input
                type="text"
                value={lawyerWitnessName}
                onChange={(e) => setLawyerWitnessName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<FileCheck className="h-4 w-4" />}
            >
              Execute Sale &amp; Transfer Deed
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

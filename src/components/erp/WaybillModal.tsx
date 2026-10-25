'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import type { AuctionLot, Waybill } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Printer, Truck, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: AuctionLot;
  onSuccess: () => void;
}

export function WaybillModal({ isOpen, onClose, lot, onSuccess }: WaybillModalProps) {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverGhanaCard, setDriverGhanaCard] = useState('');
  const [vehiclePlateNo, setVehiclePlateNo] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [gateOfficerName, setGateOfficerName] = useState('Samuel Tagoe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdWaybill, setCreatedWaybill] = useState<Waybill | null>(null);

  const identifier =
    lot.chassisNumber || lot.serialOrTagNumber || `REG-${lot.registrationNumber || 'N/A'}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const waybillNumber = `AM-WB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const waybill: Waybill = {
        id: `wb-${Date.now()}`,
        waybillNumber,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        assetDescription: lot.title,
        identifier,
        registrationNumber: lot.registrationNumber,
        quantity: lot.quantity || 1,
        buyerName: lot.winningBidderName || 'N/A',
        buyerPhone: lot.winningBidderPhone || 'N/A',
        driverName,
        driverPhone,
        driverGhanaCard,
        vehiclePlateNo,
        destinationAddress,
        authorizedBy: 'Auction Manager (Amen Mart)',
        gateOfficerName,
        releasedAt: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.waybills.add(waybill);
      await db.auctionLots.update(lot.id, {
        status: 'DISPOSED',
        waybillId: waybill.id,
      });

      await syncEngine.queueMutation('waybills', waybill.id, 'CREATE', waybill);
      await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', {
        status: 'DISPOSED',
        waybillId: waybill.id,
      });

      setCreatedWaybill(waybill);
      onSuccess();
    } catch (err) {
      console.error('Failed to issue waybill:', err);
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
      title={createdWaybill ? 'Official Dispatch Waybill Issued' : 'Issue Official Asset Waybill & Gate Pass'}
      subtitle={
        createdWaybill
          ? 'Waybill verified and logged into gate clearance registry.'
          : 'Disposal document for MOVABLE assets (Vehicles, Machinery & Equipment) upon full payment.'
      }
      maxWidth="2xl"
    >
      {createdWaybill ? (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Waybill #{createdWaybill.waybillNumber} Generated
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Lot status updated to DISPOSED. Authorized for gate release.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
                Print Waybill
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>

          {/* Printable A5 Landscape Waybill */}
          <div className="a5-document-container border border-slate-300 dark:border-slate-700 p-4 rounded-xl bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans shadow-sm text-[11px] leading-tight">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 dark:border-slate-100 pb-2.5 mb-3 gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/amenmart-logo-horizontal-4k.png"
                  alt="Amen Mart"
                  width={200}
                  height={112}
                  priority
                  className="h-11 w-auto object-contain shrink-0"
                />
                <div className="border-l border-slate-300 dark:border-slate-700 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                      AMEN MART LIMITED
                    </span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      A5 Dispatch Pass
                    </span>
                  </div>
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Licensed Auctioneers &bull; Government, Judicial &amp; Private Liquidators
                  </p>
                  <p className="text-[8.5px] text-slate-500">
                    Location: Gbawe, Flower Junction &bull; P. O. Box DC 1013, Dansoman &bull; Tel: 0548517277 / 0558314744
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-0.5 bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded">
                  WAYBILL &amp; GATE PASS
                </span>
                <p className="text-sm font-black font-mono mt-1 text-slate-900 dark:text-white">
                  {createdWaybill.waybillNumber}
                </p>
                <p className="text-[9px] text-slate-500">
                  {formatDateTime(createdWaybill.releasedAt)}
                </p>
              </div>
            </div>

            {/* 2-Column Grid: Asset vs Transport */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Asset Particulars */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1 mb-1">
                  <span className="font-bold text-[10px] uppercase text-indigo-900 dark:text-indigo-300">
                    Dispatched Asset Details
                  </span>
                  <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200">
                    {lot.category} AUCTION
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <span className="text-slate-500">Lot Number:</span>
                    <p className="font-bold font-mono text-slate-900 dark:text-slate-100">{createdWaybill.lotNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Qty Released:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{createdWaybill.quantity} Unit(s)</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Description:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{createdWaybill.assetDescription}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Chassis / Serial / Tag:</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{createdWaybill.identifier}</p>
                  </div>
                </div>
              </div>

              {/* Consignee & Transport Particulars */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-1 mb-1">
                  <span className="font-bold text-[10px] uppercase text-slate-900 dark:text-slate-200">
                    Consignee &amp; Haulage
                  </span>
                  <span className="text-[9px] text-slate-500">Gate Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="col-span-2">
                    <span className="text-slate-500">Buyer / Consignee:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{createdWaybill.buyerName} ({createdWaybill.buyerPhone})</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Transporter / Driver:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{createdWaybill.driverName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Driver Phone:</span>
                    <p className="font-mono text-slate-900 dark:text-slate-100">{createdWaybill.driverPhone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Driver Ghana Card:</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{createdWaybill.driverGhanaCard || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Vehicle Plate No:</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{createdWaybill.vehiclePlateNo}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Destination:</span>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-1">{createdWaybill.destinationAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Signatures & Security Stamp Box */}
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2 grid grid-cols-4 gap-2 text-center text-[9px]">
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{createdWaybill.authorizedBy}</p>
                <p className="text-slate-500">Auction Manager</p>
              </div>
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{createdWaybill.gateOfficerName}</p>
                <p className="text-slate-500">Gate Security Officer</p>
              </div>
              <div>
                <div className="h-7 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{createdWaybill.driverName}</p>
                <p className="text-slate-500">Receiving Transporter</p>
              </div>
              <div className="border border-dashed border-slate-400 rounded p-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">OFFICIAL STAMP</span>
                <span className="text-[7px] text-slate-400">YARD GATE SECURITY</span>
              </div>
            </div>

            {/* Legal Footnote */}
            <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[8px] text-slate-400">
              <span>Standard A5 Format &bull; Goods once cleared past security gate become buyer liability.</span>
              <span>Amen Mart Local Ledger Registry &bull; Offline-First Clearance</span>
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
              Identifier: <span className="font-mono font-bold">{identifier}</span> &bull; Buyer:{' '}
              <span className="font-bold">{lot.winningBidderName}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Driver / Transporter Name *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Kofi Owusu"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Driver Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="+233 24 XXX XXXX"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Driver Ghana Card ID
              </label>
              <input
                type="text"
                value={driverGhanaCard}
                onChange={(e) => setDriverGhanaCard(e.target.value)}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transport Vehicle Plate No. *
              </label>
              <input
                type="text"
                required
                value={vehiclePlateNo}
                onChange={(e) => setVehiclePlateNo(e.target.value)}
                placeholder="e.g. GT 8842-19 (Trailer)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Delivery Address *
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="e.g. Apex Quarry Site, Shai Hills / Customer Yard"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gate Pass Security Officer
              </label>
              <input
                type="text"
                value={gateOfficerName}
                onChange={(e) => setGateOfficerName(e.target.value)}
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
              icon={<Truck className="h-4 w-4" />}
            >
              Issue Waybill &amp; Gate Pass
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

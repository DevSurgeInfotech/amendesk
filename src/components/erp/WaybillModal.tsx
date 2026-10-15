'use client';

import { useState, type FormEvent } from 'react';
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

          {/* Printable A4 Waybill */}
          <div className="a4-document-container border border-slate-300 dark:border-slate-700 p-8 rounded-xl bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-slate-100 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                  AMEN MART LIMITED
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Government &amp; Judicial Auctioneers &bull; Asset Liquidators
                </p>
                <p className="text-xs text-slate-500">Tema Motorway Heavy Industrial Area, Accra, Ghana</p>
                <p className="text-xs text-slate-500">Tel: +233 24 412 8990 / +233 30 223 9011</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded">
                  OFFICIAL WAYBILL &amp; GATE PASS
                </span>
                <p className="text-base font-black font-mono mt-2 text-slate-900 dark:text-white">
                  {createdWaybill.waybillNumber}
                </p>
                <p className="text-xs text-slate-500">
                  Date: {formatDateTime(createdWaybill.releasedAt)}
                </p>
              </div>
            </div>

            {/* Asset Breakdown */}
            <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                Disposed Movable Asset Details
              </div>
              <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Auction Lot No:</span>
                  <p className="font-bold text-sm">{createdWaybill.lotNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Asset Category:</span>
                  <p className="font-semibold">{lot.category} AUCTION</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Asset Description:</span>
                  <p className="font-bold text-sm">{createdWaybill.assetDescription}</p>
                </div>
                <div>
                  <span className="text-slate-500">Chassis / Serial No:</span>
                  <p className="font-mono font-bold">{createdWaybill.identifier}</p>
                </div>
                <div>
                  <span className="text-slate-500">Quantity Dispatched:</span>
                  <p className="font-bold">{createdWaybill.quantity} Unit(s)</p>
                </div>
              </div>
            </div>

            {/* Consignee & Transport */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-xs space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b pb-1">
                  Consignee / Buyer
                </p>
                <p className="font-bold text-sm">{createdWaybill.buyerName}</p>
                <p className="text-slate-500">Contact: {createdWaybill.buyerPhone}</p>
                <p className="text-slate-500">Destination: {createdWaybill.destinationAddress}</p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-xs space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b pb-1">
                  Hauler / Driver Particulars
                </p>
                <p className="font-bold">{createdWaybill.driverName}</p>
                <p className="text-slate-500">Driver Phone: {createdWaybill.driverPhone}</p>
                <p className="text-slate-500">Ghana Card: {createdWaybill.driverGhanaCard || 'N/A'}</p>
                <p className="text-slate-500">Transport Vehicle Reg: {createdWaybill.vehiclePlateNo}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdWaybill.authorizedBy}</p>
                <p className="text-[10px] text-slate-500">Auction Manager</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdWaybill.gateOfficerName}</p>
                <p className="text-[10px] text-slate-500">Gate Security Clearance</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p className="font-bold">{createdWaybill.driverName}</p>
                <p className="text-[10px] text-slate-500">Driver Receiving Goods</p>
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

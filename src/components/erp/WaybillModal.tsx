'use client';

import { useState, useMemo, type FormEvent } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import type { AuctionLot, Waybill } from '@/lib/types';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTerminal } from '@/context/TerminalContext';
import { Printer, Truck, CheckCircle2, Car, Gavel, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot?: AuctionLot | null;
  onSuccess?: () => void;
}

type SourceType = 'AUCTION' | 'DEALERSHIP' | 'MANUAL';

export function WaybillModal({ isOpen, onClose, lot, onSuccess }: WaybillModalProps) {
  const { currentStaffName } = useTerminal();

  // Query movable auction lots and dealership stock from local IndexedDB
  const rawMovableLots = useLiveQuery(
    () => db.auctionLots.where('assetType').equals('MOVABLE').toArray(),
    []
  );
  const movableLots = useMemo(() => rawMovableLots || [], [rawMovableLots]);

  const rawDealershipVehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []);
  const dealershipVehicles = useMemo(
    () => rawDealershipVehicles || [],
    [rawDealershipVehicles]
  );

  // Default candidate lot when opened without pre-selection
  const defaultCandidateLot = useMemo(() => {
    if (lot) return lot;
    return (
      movableLots.find(
        (l) =>
          (l.status === 'FULLY_PAID' || (l.balanceDueGhs === 0 && (l.hammerPriceGhs ?? 0) > 0)) &&
          !l.waybillId
      ) || movableLots[0]
    );
  }, [lot, movableLots]);

  // Form Source Selection State
  const [sourceTypeOverride, setSourceTypeOverride] = useState<SourceType | null>(null);
  const [selectedLotIdOverride, setSelectedLotIdOverride] = useState<string | null>(null);
  const [selectedVehicleIdOverride, setSelectedVehicleIdOverride] = useState<string | null>(null);

  // Compute effective source type
  const sourceType: SourceType =
    sourceTypeOverride ??
    (lot
      ? 'AUCTION'
      : movableLots.length > 0
        ? 'AUCTION'
        : dealershipVehicles.length > 0
          ? 'DEALERSHIP'
          : 'MANUAL');

  // Compute active lot or vehicle
  const activeLot: AuctionLot | undefined = useMemo(() => {
    if (lot) return lot;
    if (sourceType !== 'AUCTION') return undefined;
    if (selectedLotIdOverride) {
      return movableLots.find((l) => l.id === selectedLotIdOverride) || defaultCandidateLot;
    }
    return defaultCandidateLot;
  }, [lot, sourceType, selectedLotIdOverride, movableLots, defaultCandidateLot]);

  const activeVehicle = useMemo(() => {
    if (sourceType !== 'DEALERSHIP') return undefined;
    if (selectedVehicleIdOverride) {
      return (
        dealershipVehicles.find((v) => v.id === selectedVehicleIdOverride) ||
        dealershipVehicles[0]
      );
    }
    return dealershipVehicles[0];
  }, [sourceType, selectedVehicleIdOverride, dealershipVehicles]);

  // Overridable Field State (null = derive from activeLot / activeVehicle)
  const [customAssetDescription, setCustomAssetDescription] = useState<string | null>(null);
  const [customIdentifier, setCustomIdentifier] = useState<string | null>(null);
  const [customRegistrationNumber, setCustomRegistrationNumber] = useState<string | null>(null);
  const [customQuantity, setCustomQuantity] = useState<number | null>(null);
  const [customBuyerName, setCustomBuyerName] = useState<string | null>(null);
  const [customBuyerPhone, setCustomBuyerPhone] = useState<string | null>(null);

  // Haulage & Gate Security State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverGhanaCard, setDriverGhanaCard] = useState('');
  const [vehiclePlateNo, setVehiclePlateNo] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [gateOfficerName, setGateOfficerName] = useState('Samuel Tagoe (Yard Security)');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdWaybill, setCreatedWaybill] = useState<Waybill | null>(null);

  // Derived Values
  const assetDescription =
    customAssetDescription ??
    (activeLot?.title ||
      (activeVehicle
        ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.color})`
        : ''));

  const identifier =
    customIdentifier ??
    (activeLot
      ? activeLot.chassisNumber ||
        activeLot.serialOrTagNumber ||
        (activeLot.registrationNumber ? `REG-${activeLot.registrationNumber}` : '')
      : activeVehicle
        ? activeVehicle.vin
        : '');

  const registrationNumber =
    customRegistrationNumber ?? (activeLot?.registrationNumber || '');

  const quantity = customQuantity ?? (activeLot?.quantity || 1);

  const buyerName =
    customBuyerName ?? (activeLot?.winningBidderName || '');

  const buyerPhone =
    customBuyerPhone ?? (activeLot?.winningBidderPhone || '');

  // Reset helper
  const handleClose = () => {
    setCreatedWaybill(null);
    setErrorMsg('');
    setSourceTypeOverride(null);
    setSelectedLotIdOverride(null);
    setSelectedVehicleIdOverride(null);
    setCustomAssetDescription(null);
    setCustomIdentifier(null);
    setCustomRegistrationNumber(null);
    setCustomQuantity(null);
    setCustomBuyerName(null);
    setCustomBuyerPhone(null);
    setDriverName('');
    setDriverPhone('');
    setDriverGhanaCard('');
    setVehiclePlateNo('');
    setDestinationAddress('');
    onClose();
  };

  const handleLotSelect = (lotId: string) => {
    setSelectedLotIdOverride(lotId);
    setCustomAssetDescription(null);
    setCustomIdentifier(null);
    setCustomRegistrationNumber(null);
    setCustomQuantity(null);
    setCustomBuyerName(null);
    setCustomBuyerPhone(null);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleIdOverride(vehicleId);
    setCustomAssetDescription(null);
    setCustomIdentifier(null);
    setCustomRegistrationNumber(null);
    setCustomQuantity(null);
    setCustomBuyerName(null);
    setCustomBuyerPhone(null);
  };

  const handleSwitchTab = (newType: SourceType) => {
    setSourceTypeOverride(newType);
    setErrorMsg('');
    setCustomAssetDescription(null);
    setCustomIdentifier(null);
    setCustomRegistrationNumber(null);
    setCustomQuantity(null);
    setCustomBuyerName(null);
    setCustomBuyerPhone(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assetDescription.trim()) {
      setErrorMsg('Asset Description is required.');
      return;
    }
    if (!driverName.trim()) {
      setErrorMsg('Driver / Transporter Name is required.');
      return;
    }
    if (!driverPhone.trim()) {
      setErrorMsg('Driver Contact Phone is required.');
      return;
    }
    if (!vehiclePlateNo.trim()) {
      setErrorMsg('Transport Vehicle Plate No. is required.');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMsg('Destination Address is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const waybillNumber = `AM-WB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanIdentifier =
        identifier.trim() ||
        (registrationNumber.trim() ? `REG-${registrationNumber.trim()}` : 'TAG-YARD-RELEASE');

      const waybill: Waybill = {
        id: `wb-${Date.now()}`,
        waybillNumber,
        lotId: activeLot?.id || activeVehicle?.id || 'DIRECT-DISPATCH',
        lotNumber: activeLot?.lotNumber || activeVehicle?.stockNumber || 'GATE-PASS',
        assetDescription: assetDescription.trim(),
        identifier: cleanIdentifier,
        registrationNumber: registrationNumber.trim() || undefined,
        quantity: Math.max(1, Number(quantity) || 1),
        buyerName: buyerName.trim() || 'Walk-in Consignee',
        buyerPhone: buyerPhone.trim() || 'N/A',
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        driverGhanaCard: driverGhanaCard.trim() || undefined,
        vehiclePlateNo: vehiclePlateNo.trim(),
        destinationAddress: destinationAddress.trim(),
        authorizedBy: currentStaffName
          ? `${currentStaffName} (Amen Mart)`
          : 'Auction Manager (Amen Mart)',
        gateOfficerName: gateOfficerName.trim() || 'Samuel Tagoe (Yard Security)',
        releasedAt: new Date().toISOString(),
        syncStatus: 'SYNCED',
      };

      await db.waybills.add(waybill);

      if (activeLot) {
        await db.auctionLots.update(activeLot.id, {
          status: 'DISPOSED',
          waybillId: waybill.id,
        });
        await syncEngine.queueMutation('auctionLots', activeLot.id, 'UPDATE', {
          status: 'DISPOSED',
          waybillId: waybill.id,
        });
      }

      if (activeVehicle) {
        await db.dealershipVehicles.update(activeVehicle.id, {
          status: 'SOLD',
        });
        await syncEngine.queueMutation('dealershipVehicles', activeVehicle.id, 'UPDATE', {
          status: 'SOLD',
        });
      }

      await syncEngine.queueMutation('waybills', waybill.id, 'CREATE', waybill);

      setCreatedWaybill(waybill);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to issue waybill:', err);
      setErrorMsg('Failed to issue waybill. Please verify inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sourceCategoryBadge = activeLot?.category
    ? `${activeLot.category} AUCTION`
    : sourceType === 'DEALERSHIP'
      ? 'SHOWROOM DEALERSHIP'
      : 'YARD CLEARANCE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdWaybill ? 'Official Dispatch Waybill Issued' : 'Issue Official Asset Waybill & Gate Pass'}
      subtitle={
        createdWaybill
          ? 'Waybill verified and logged into gate clearance registry.'
          : 'A5 Gate Pass clearance for MOVABLE assets (Vehicles, Machinery & Equipment) departing the yard.'
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
                  Logged into local gate clearance registry. Authorized for security release.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
                Print Waybill
              </Button>
              <Button size="sm" variant="outline" onClick={handleClose}>
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
                    {sourceCategoryBadge}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <span className="text-slate-500">Lot / Ref Number:</span>
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
                <p className="text-slate-500">Authorizing Officer</p>
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
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Asset Selection Mode */}
          {lot ? (
            /* Pre-selected Lot Banner */
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">
                  Pre-selected Auction Lot: {lot.lotNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                  {lot.category} AUCTION
                </span>
              </div>
              <p className="text-indigo-800 dark:text-indigo-300 font-semibold">{lot.title}</p>
              <p className="text-indigo-700 dark:text-indigo-400 text-[11px]">
                Chassis / Tag: <span className="font-mono font-bold">{identifier || 'N/A'}</span> &bull; Winner:{' '}
                <span className="font-bold">{lot.winningBidderName || 'N/A'}</span>
              </p>
            </div>
          ) : (
            /* Quick Operation Source Selector */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Asset to Clear from Yard:
                </label>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('AUCTION')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      sourceType === 'AUCTION'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    <span>Auction Lots</span>
                    <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600">
                      {movableLots.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTab('DEALERSHIP')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      sourceType === 'DEALERSHIP'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    <span>Showroom</span>
                    <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600">
                      {dealershipVehicles.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTab('MANUAL')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      sourceType === 'MANUAL'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Direct Gate Pass</span>
                  </button>
                </div>
              </div>

              {/* Source-specific picker */}
              {sourceType === 'AUCTION' && (
                <div>
                  {movableLots.length > 0 ? (
                    <div>
                      <select
                        value={activeLot?.id || ''}
                        onChange={(e) => handleLotSelect(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        {movableLots.map((l) => {
                          const isCleared = !!l.waybillId;
                          const isFullyPaid =
                            l.status === 'FULLY_PAID' ||
                            (l.balanceDueGhs === 0 && (l.hammerPriceGhs ?? 0) > 0);
                          return (
                            <option key={l.id} value={l.id}>
                              {l.lotNumber} &bull; {l.title} &bull; Buyer: {l.winningBidderName || 'Unassigned'}
                              {isCleared ? ' [Waybill Already Issued]' : isFullyPaid ? ' [Ready for Release]' : ` [${l.status}]`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                      No movable auction lots found in local registry. You can switch to{' '}
                      <strong>Direct Gate Pass</strong> above to enter vehicle or asset particulars manually.
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'DEALERSHIP' && (
                <div>
                  {dealershipVehicles.length > 0 ? (
                    <select
                      value={activeVehicle?.id || ''}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {dealershipVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.stockNumber} &bull; {v.year} {v.make} {v.model} ({v.color}) &bull; VIN: {v.vin} [{v.status}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                      No showroom vehicles found in local registry. You can switch to{' '}
                      <strong>Direct Gate Pass</strong> above to enter vehicle particulars manually.
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'MANUAL' && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    Direct Gate Clearance mode. Enter asset specification and transporter credentials below to generate an authorized A5 Waybill.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Asset & Consignee Inputs */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Asset &amp; Consignee Particulars
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Title / Cargo Description *
                </label>
                <input
                  type="text"
                  required
                  value={assetDescription}
                  onChange={(e) => setCustomAssetDescription(e.target.value)}
                  placeholder="e.g. 2021 Toyota Hilux 2.8 GD-6 4x4 / Industrial Generator"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chassis No. / Serial / Tag ID *
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setCustomIdentifier(e.target.value)}
                  placeholder="e.g. AHTFR22G908012345"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Registration Plate (Optional)
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setCustomRegistrationNumber(e.target.value)}
                  placeholder="e.g. GR 4912-22"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Buyer / Consignee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setCustomBuyerName(e.target.value)}
                  placeholder="e.g. Kwabena Mensah"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Buyer Contact Phone
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setCustomBuyerPhone(e.target.value)}
                  placeholder="+233 24 XXX XXXX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Haulage & Gate Security Particulars */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Haulage &amp; Transporter Particulars
            </h4>
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driver Ghana Card ID (Optional)
                </label>
                <input
                  type="text"
                  value={driverGhanaCard}
                  onChange={(e) => setDriverGhanaCard(e.target.value)}
                  placeholder="GHA-XXXXXXXXX-X"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g. GT 8842-19 / Driven Out"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g. Apex Quarry Site, Shai Hills / Customer Depot, Tema"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gate Security Officer On Duty
                </label>
                <input
                  type="text"
                  value={gateOfficerName}
                  onChange={(e) => setGateOfficerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
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

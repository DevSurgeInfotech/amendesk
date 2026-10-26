'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type {
  AuctionLot,
  AuctionCategory,
  AssetType,
  MovableSubType,
  ImmovableSubType,
  LotStatus,
} from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { DocumentUploader } from '@/components/erp/DocumentUploader';
import {
  AlertCircle,
  Trash2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface EditAuctionLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: AuctionLot | null;
  onSuccess?: () => void;
}

interface EditAuctionLotFormProps {
  lot: AuctionLot;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditAuctionLotForm({ lot, onClose, onSuccess }: EditAuctionLotFormProps) {
  // Classification
  const [category, setCategory] = useState<AuctionCategory>(lot.category || 'PRIVATE');
  const [assetType, setAssetType] = useState<AssetType>(lot.assetType || 'MOVABLE');
  const [movableSubType, setMovableSubType] = useState<MovableSubType>(lot.movableSubType || 'VEHICLE');
  const [immovableSubType, setImmovableSubType] = useState<ImmovableSubType>(lot.immovableSubType || 'LAND');

  // Common Fields
  const [lotNumber, setLotNumber] = useState(lot.lotNumber || '');
  const [title, setTitle] = useState(lot.title || '');
  const [reservePriceGhs, setReservePriceGhs] = useState<number>(lot.reservePriceGhs || 0);
  const [startingBidGhs, setStartingBidGhs] = useState<number>(lot.startingBidGhs || 0);
  const [currentBidGhs, setCurrentBidGhs] = useState<number>(lot.currentBidGhs || 0);
  const [yardLocation, setYardLocation] = useState(lot.yardLocation || 'Amen Mart Main Yard — Bay A');
  const [conditionNotes, setConditionNotes] = useState(lot.conditionNotes || '');
  const [status, setStatus] = useState<LotStatus>(lot.status || 'ACTIVE');
  const [photos, setPhotos] = useState<string[]>(lot.photos || []);

  // Movable Vehicle specifics
  const [make, setMake] = useState(lot.make || '');
  const [model, setModel] = useState(lot.model || '');
  const [year, setYear] = useState<number>(lot.year || 2022);
  const [chassisNumber, setChassisNumber] = useState(lot.chassisNumber || '');
  const [registrationNumber, setRegistrationNumber] = useState(lot.registrationNumber || '');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'>(lot.fuelType || 'PETROL');
  const [mileageKm, setMileageKm] = useState<number>(lot.mileageKm || 0);

  // Movable Other specifics
  const [serialOrTagNumber, setSerialOrTagNumber] = useState(lot.serialOrTagNumber || '');
  const [quantity, setQuantity] = useState<number>(lot.quantity || 1);
  const [equipmentType, setEquipmentType] = useState(lot.equipmentType || '');

  // Immovable Land/Building specifics
  const [parcelReference, setParcelReference] = useState(lot.parcelReference || '');
  const [titleReference, setTitleReference] = useState(lot.titleReference || '');
  const [locationArea, setLocationArea] = useState(lot.locationArea || '');
  const [sizeDimensions, setSizeDimensions] = useState(lot.sizeDimensions || '');
  const [sitePlanDocUrl, setSitePlanDocUrl] = useState<string | undefined>(lot.sitePlanDocUrl);

  // Judicial Mandatory Compliance Fields
  const [courtCaseNumber, setCourtCaseNumber] = useState(lot.courtCaseNumber || '');
  const [sheriffInstructionRef, setSheriffInstructionRef] = useState(lot.sheriffInstructionRef || '');
  const [courtOrderDocUrl, setCourtOrderDocUrl] = useState<string | undefined>(lot.courtOrderDocUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!lotNumber.trim() || !title.trim() || !yardLocation.trim()) {
      setErrorMsg('Lot Number, Title, and Yard Location are mandatory fields.');
      return;
    }

    if (reservePriceGhs <= 0) {
      setErrorMsg('Reserve Price must be greater than GH₵ 0.');
      return;
    }

    if (category === 'JUDICIAL') {
      if (!courtCaseNumber.trim() || !sheriffInstructionRef.trim()) {
        setErrorMsg('Judicial auctions require Court Case Number and Sheriff Instruction Reference.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();

      const updatedLot: AuctionLot = {
        ...lot,
        lotNumber: lotNumber.trim().toUpperCase(),
        title: title.trim(),
        category,
        assetType,
        movableSubType: assetType === 'MOVABLE' ? movableSubType : undefined,
        immovableSubType: assetType === 'IMMOVABLE' ? immovableSubType : undefined,

        reservePriceGhs,
        startingBidGhs: startingBidGhs || reservePriceGhs,
        currentBidGhs: currentBidGhs || startingBidGhs || reservePriceGhs,
        yardLocation: yardLocation.trim(),
        conditionNotes: conditionNotes.trim(),
        status,
        photos:
          photos.length > 0
            ? photos
            : [
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
              ],

        // Movable vehicle specifics
        make: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? make.trim() : undefined,
        model: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? model.trim() : undefined,
        year: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? year : undefined,
        chassisNumber: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? chassisNumber.trim().toUpperCase() : undefined,
        registrationNumber: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? registrationNumber.trim().toUpperCase() : undefined,
        fuelType: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? fuelType : undefined,
        mileageKm: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? mileageKm : undefined,

        // Movable other specifics
        serialOrTagNumber: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? serialOrTagNumber.trim().toUpperCase() : undefined,
        quantity: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? quantity : undefined,
        equipmentType: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? equipmentType.trim() : undefined,

        // Immovable specifics
        parcelReference: assetType === 'IMMOVABLE' ? parcelReference.trim().toUpperCase() : undefined,
        titleReference: assetType === 'IMMOVABLE' ? titleReference.trim().toUpperCase() : undefined,
        locationArea: assetType === 'IMMOVABLE' ? locationArea.trim() : undefined,
        sizeDimensions: assetType === 'IMMOVABLE' ? sizeDimensions.trim() : undefined,
        sitePlanDocUrl: assetType === 'IMMOVABLE' ? sitePlanDocUrl : undefined,

        // Judicial specifics
        courtCaseNumber: category === 'JUDICIAL' ? courtCaseNumber.trim() : undefined,
        sheriffInstructionRef: category === 'JUDICIAL' ? sheriffInstructionRef.trim() : undefined,
        courtOrderDocUrl: category === 'JUDICIAL' ? courtOrderDocUrl : undefined,

        updatedAt: nowIso,
      };

      await db.auctionLots.put(updatedLot);
      await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', updatedLot);

      // Synchronize associated Inventory Item if exists
      const invItem = await db.inventoryItems
        .where('sku')
        .equals(lot.lotNumber)
        .first();

      if (invItem) {
        const updatedInv = {
          ...invItem,
          name: title.trim(),
          sku: updatedLot.lotNumber,
          landedCostGhs: reservePriceGhs,
        };
        await db.inventoryItems.put(updatedInv);
        await syncEngine.queueMutation('inventoryItems', invItem.id, 'UPDATE', updatedInv);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update auction lot:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update auction lot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (lot.status === 'FULLY_PAID' || (lot.depositAmountGhs && lot.depositAmountGhs > 0)) {
      setErrorMsg('Cannot delete an auction lot that has active deposit receipts or is settled. Cancel or discharge through cash office ledger instead.');
      return;
    }

    setIsDeleting(true);
    try {
      await db.auctionLots.delete(lot.id);
      await syncEngine.queueMutation('auctionLots', lot.id, 'DELETE', { id: lot.id });

      const invItem = await db.inventoryItems
        .where('sku')
        .equals(lot.lotNumber)
        .first();

      if (invItem) {
        await db.inventoryItems.delete(invItem.id);
        await syncEngine.queueMutation('inventoryItems', invItem.id, 'DELETE', { id: invItem.id });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete auction lot:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete auction lot.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Category & Asset Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Auction Category *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['PRIVATE', 'GOVERNMENT', 'JUDICIAL'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                  category === cat
                    ? cat === 'JUDICIAL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : cat === 'GOVERNMENT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Asset Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAssetType('MOVABLE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                assetType === 'MOVABLE'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              Movable (Vehicles &amp; Plants)
            </button>
            <button
              type="button"
              onClick={() => setAssetType('IMMOVABLE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                assetType === 'IMMOVABLE'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              Immovable (Land &amp; Buildings)
            </button>
          </div>
        </div>
      </div>

      {/* Judicial Mandated Section if JUDICIAL */}
      {category === 'JUDICIAL' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
              Judicial Fi.Fa. Court Mandate &amp; Sheriff Execution Attachment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                Court Case Reference Number *
              </label>
              <input
                type="text"
                required
                value={courtCaseNumber}
                onChange={(e) => setCourtCaseNumber(e.target.value)}
                placeholder="e.g. HC/ACR/COMM/2026/049"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-950 dark:text-rose-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                Sheriff Instruction Reference *
              </label>
              <input
                type="text"
                required
                value={sheriffInstructionRef}
                onChange={(e) => setSheriffInstructionRef(e.target.value)}
                placeholder="e.g. SHF/WRIT/EXEC/2026/012"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-950 dark:text-rose-100"
              />
            </div>

            <div className="sm:col-span-2">
              <DocumentUploader
                documentUrl={courtOrderDocUrl}
                onChange={(url) => setCourtOrderDocUrl(url)}
                entityType="AUCTION"
                label="Official Court Order / Sheriff Writ Document (PDF / Scan)"
                helperText="Attach certified court fi.fa. writ order or sealed judicial instruction."
                buttonText="Attach Sheriff Writ of Execution / Court Order"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lot Numbers & Title */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Lot Number *
          </label>
          <input
            type="text"
            required
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
            placeholder="e.g. LOT-101"
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Lot Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2021 Toyota Hilux D-4D 4x4 Double Cabin"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Current Yard Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LotStatus)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="ACTIVE">ACTIVE (Open for Bids)</option>
            <option value="UPCOMING">UPCOMING (Notice Published)</option>
            <option value="AWAITING_BALANCE">AWAITING_BALANCE (Hammer Struck)</option>
            <option value="FULLY_PAID">FULLY_PAID (Settled in Full)</option>
            <option value="DISPOSED">DISPOSED (Waybill/Deed Released)</option>
            <option value="OVERDUE">OVERDUE (14-Day Lapsed)</option>
            <option value="CANCELLED">CANCELLED (Withdrawn)</option>
          </select>
        </div>
      </div>

      {/* Movable Sub-type Details */}
      {assetType === 'MOVABLE' && (
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Movable Category:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMovableSubType('VEHICLE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  movableSubType === 'VEHICLE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                Vehicle (Car/Truck/Bus)
              </button>
              <button
                type="button"
                onClick={() => setMovableSubType('OTHER_MOVABLE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  movableSubType === 'OTHER_MOVABLE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                Machinery, Equipment &amp; Furniture
              </button>
            </div>
          </div>

          {movableSubType === 'VEHICLE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Make</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Toyota"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Hilux"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || 2022)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC')}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ELECTRIC">Electric</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold mb-1">Chassis Number / VIN</label>
                <input
                  type="text"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                  placeholder="AHTFR22G908129381"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Registration No</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="GN-4921-21"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Mileage (km)</label>
                <input
                  type="number"
                  value={mileageKm || ''}
                  onChange={(e) => setMileageKm(parseInt(e.target.value, 10) || 0)}
                  placeholder="65000"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Asset Tag / Serial Number</label>
                <input
                  type="text"
                  value={serialOrTagNumber}
                  onChange={(e) => setSerialOrTagNumber(e.target.value.toUpperCase())}
                  placeholder="CAT-EXC-0912"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Equipment Category / Type</label>
                <input
                  type="text"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  placeholder="Caterpillar Excavator"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Immovable Details if IMMOVABLE */}
      {assetType === 'IMMOVABLE' && (
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Immovable Category:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImmovableSubType('LAND')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  immovableSubType === 'LAND'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                Titled Land
              </button>
              <button
                type="button"
                onClick={() => setImmovableSubType('BUILDING')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  immovableSubType === 'BUILDING'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}
              >
                Building / Structure
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Parcel Reference</label>
              <input
                type="text"
                value={parcelReference}
                onChange={(e) => setParcelReference(e.target.value.toUpperCase())}
                placeholder="AM-AUC-LND-04"
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Title / Cadastral Ref</label>
              <input
                type="text"
                value={titleReference}
                onChange={(e) => setTitleReference(e.target.value.toUpperCase())}
                placeholder="GA/LC/2026/011"
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Location Area</label>
              <input
                type="text"
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                placeholder="Gbawe Top Base"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1">Dimensions / Size</label>
              <input
                type="text"
                value={sizeDimensions}
                onChange={(e) => setSizeDimensions(e.target.value)}
                placeholder="0.5 Acres (70 x 100 ft)"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="sm:col-span-4">
              <DocumentUploader
                documentUrl={sitePlanDocUrl}
                onChange={(url) => setSitePlanDocUrl(url)}
                entityType="AUCTION"
                label="Surveyor Cadastral Site Plan Attachment"
                helperText="Official cadastral survey plan or Lands Commission certified site plan."
                buttonText="Upload Cadastral Plan"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pricing & Yard Location */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Reserve Price (GH₵) *
          </label>
          <input
            type="number"
            min={0}
            step="any"
            required
            value={reservePriceGhs || ''}
            onChange={(e) => setReservePriceGhs(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 75000"
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Starting Bid (GH₵)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={startingBidGhs || ''}
            onChange={(e) => setStartingBidGhs(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 50000"
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Current Bid (GH₵)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={currentBidGhs || ''}
            onChange={(e) => setCurrentBidGhs(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Inspection Yard Bay *
          </label>
          <input
            type="text"
            required
            value={yardLocation}
            onChange={(e) => setYardLocation(e.target.value)}
            placeholder="e.g. Bay A — Main Yard"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Photos & Gallery */}
      <div>
        <ProductPhotoUploader
          photos={photos}
          onChange={setPhotos}
          entityType="AUCTION"
          label="Auction Lot Inspection Photos &amp; Angle Scans"
          helperText="Upload or snap photos. First image is used on public auction notices."
          maxPhotos={10}
        />
      </div>

      {/* Condition Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Condition Notes &amp; Inspection Assessment
        </label>
        <textarea
          rows={3}
          value={conditionNotes}
          onChange={(e) => setConditionNotes(e.target.value)}
          placeholder="Document engine state, body denting, tire wear, mechanical defects, or title encumbrances..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                Delete auction lot?
              </span>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Lot'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete Lot
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isSubmitting}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Lot Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditAuctionLotModal({
  isOpen,
  onClose,
  lot,
  onSuccess,
}: EditAuctionLotModalProps) {
  if (!isOpen || !lot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Auction Lot • ${lot.lotNumber}`}
      subtitle="Modify lot classification, pricing, legal writ attachments, specifications, and yard location."
      maxWidth="4xl"
    >
      <EditAuctionLotForm
        key={lot.id}
        lot={lot}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

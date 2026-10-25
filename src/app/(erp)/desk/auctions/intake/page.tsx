'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type {
  AuctionCategory,
  AssetType,
  MovableSubType,
  ImmovableSubType,
  AuctionLot,
  InventoryItem,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { DocumentUploader } from '@/components/erp/DocumentUploader';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  Layers,
  Car,
  Building,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

function generateLotId(): string {
  return `lot-${Date.now()}`;
}

function generateInventoryId(): string {
  return `inv-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function computeNextLotNumber(existingLots: AuctionLot[]): string {
  if (!existingLots || existingLots.length === 0) return 'LOT-101';
  let maxNum = 100;
  for (const l of existingLots) {
    const match = l.lotNumber.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `LOT-${maxNum + 1}`;
}

export default function LotIntakePage() {
  const router = useRouter();

  const existingLots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const computedNextLotNumber = computeNextLotNumber(existingLots);

  // Step 1: Category
  const [category, setCategory] = useState<AuctionCategory>('PRIVATE');

  // Step 2: Asset Type
  const [assetType, setAssetType] = useState<AssetType>('MOVABLE');
  const [movableSubType, setMovableSubType] = useState<MovableSubType>('VEHICLE');
  const [immovableSubType, setImmovableSubType] = useState<ImmovableSubType>('LAND');

  // Common Fields
  const [lotNumber, setLotNumber] = useState('');
  const [autoRegisterInventory, setAutoRegisterInventory] = useState(true);
  const [title, setTitle] = useState('');
  const [reservePriceGhs, setReservePriceGhs] = useState<number>(0);
  const [startingBidGhs, setStartingBidGhs] = useState<number>(0);
  const [conditionNotes, setConditionNotes] = useState('');
  const [yardLocation, setYardLocation] = useState('Amen Mart Main Yard — Bay A');
  const [photos, setPhotos] = useState<string[]>([]);

  // Movable Vehicle Fields
  const [chassisNumber, setChassisNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'>('PETROL');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2022);
  const [mileageKm, setMileageKm] = useState<number>(0);

  // Movable Other Fields
  const [serialOrTagNumber, setSerialOrTagNumber] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [equipmentType, setEquipmentType] = useState('');

  // Immovable Land/Building Fields
  const [parcelReference, setParcelReference] = useState('');
  const [titleReference, setTitleReference] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [sizeDimensions, setSizeDimensions] = useState('');

  // Judicial Mandatory Compliance Fields
  const [courtCaseNumber, setCourtCaseNumber] = useState('');
  const [sheriffInstructionRef, setSheriffInstructionRef] = useState('');
  const [courtOrderDocUrl, setCourtOrderDocUrl] = useState<string | undefined>(undefined);
  const [courtOrderFileName, setCourtOrderFileName] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enforce client rule: Government auctions are MOVABLE ONLY. No override.
  const handleCategoryChange = (newCat: AuctionCategory) => {
    setCategory(newCat);
    if (newCat === 'GOVERNMENT') {
      setAssetType('MOVABLE');
    }
  };

  const finalLotNumber = lotNumber || computedNextLotNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const lotId = generateLotId();
      const isoNow = getIsoTimestamp();
      const newLot: AuctionLot = {
        id: lotId,
        eventId: 'auc-oct-2026',
        lotNumber: finalLotNumber,
        title,
        category,
        assetType,
        movableSubType: assetType === 'MOVABLE' ? movableSubType : undefined,
        immovableSubType: assetType === 'IMMOVABLE' ? immovableSubType : undefined,

        chassisNumber: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? chassisNumber : undefined,
        registrationNumber: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? registrationNumber : undefined,
        fuelType: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? fuelType : undefined,
        make: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? make : undefined,
        model: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? model : undefined,
        year: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? year : undefined,
        mileageKm: assetType === 'MOVABLE' && movableSubType === 'VEHICLE' ? mileageKm : undefined,

        serialOrTagNumber: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? serialOrTagNumber : undefined,
        quantity: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? quantity : undefined,
        equipmentType: assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' ? equipmentType : undefined,

        parcelReference: assetType === 'IMMOVABLE' ? parcelReference : undefined,
        titleReference: assetType === 'IMMOVABLE' ? titleReference : undefined,
        locationArea: assetType === 'IMMOVABLE' ? locationArea : undefined,
        sizeDimensions: assetType === 'IMMOVABLE' ? sizeDimensions : undefined,

        courtCaseNumber: category === 'JUDICIAL' ? courtCaseNumber.trim() : undefined,
        sheriffInstructionRef: category === 'JUDICIAL' ? sheriffInstructionRef.trim() : undefined,
        courtOrderDocUrl: category === 'JUDICIAL' ? (courtOrderDocUrl || undefined) : undefined,

        conditionNotes,
        photos:
          photos.length > 0
            ? photos
            : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
        yardLocation,
        reservePriceGhs,
        startingBidGhs: startingBidGhs || reservePriceGhs,
        currentBidGhs: startingBidGhs || reservePriceGhs,
        marginRatePercent: 7, // Strictly 7% for all categories
        status: 'ACTIVE',
        extensionCount: 0,
        createdAt: isoNow,
        updatedAt: isoNow,
        syncStatus: 'SYNCED',
      };

      await db.auctionLots.add(newLot);
      await syncEngine.queueMutation('auctionLots', lotId, 'CREATE', newLot);

      // Optionally register movable lot in General Inventory
      if (autoRegisterInventory && assetType === 'MOVABLE') {
        const invId = generateInventoryId();
        const invItem: InventoryItem = {
          id: invId,
          name: title,
          sku: finalLotNumber,
          category: movableSubType === 'VEHICLE' ? 'VEHICLE' : 'EQUIPMENT',
          location: 'AUCTION_YARD',
          quantity: (movableSubType === 'OTHER_MOVABLE' ? quantity : 1) || 1,
          landedCostGhs: reservePriceGhs,
          condition: 'GOOD',
          lastCountDate: isoNow,
        };
        await db.inventoryItems.add(invItem);
        await syncEngine.queueMutation('inventoryItems', invId, 'CREATE', invItem);
      }

      router.push('/desk/auctions');
    } catch (err) {
      console.error('Failed to register lot:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/desk/auctions"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Auction Yard</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Standard Margin Rate: 7%
        </span>
      </div>

      <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Lot Intake Wizard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure the 2-step dimensional intake: Step 1 (Auction Category) &bull; Step 2 (Asset Type).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* STEP 1: Auction Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Step 1 &bull; Select Auction Category
              </span>
              <span className="text-xs text-slate-400">Determines legal compliance &amp; asset rules</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Private */}
              <button
                type="button"
                onClick={() => handleCategoryChange('PRIVATE')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  category === 'PRIVATE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  {category === 'PRIVATE' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Private Auction</p>
                <p className="text-xs text-slate-500 mt-1">
                  Voluntary asset disposal on behalf of private companies or individuals. Movable &amp; Immovable.
                </p>
              </button>

              {/* Government */}
              <button
                type="button"
                onClick={() => handleCategoryChange('GOVERNMENT')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  category === 'GOVERNMENT'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  {category === 'GOVERNMENT' && <CheckCircle2 className="h-4 w-4 text-amber-600" />}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Government Auction</p>
                <p className="text-xs text-slate-500 mt-1">
                  Official state surplus disposal (Ministries, Agencies). <strong>Strictly Movable Only.</strong>
                </p>
              </button>

              {/* Judicial */}
              <button
                type="button"
                onClick={() => handleCategoryChange('JUDICIAL')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  category === 'JUDICIAL'
                    ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  {category === 'JUDICIAL' && <CheckCircle2 className="h-4 w-4 text-rose-600" />}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Judicial Auction</p>
                <p className="text-xs text-slate-500 mt-1">
                  Court-ordered sheriff sales. Mandates High Court Case Ref &amp; Sheriff writ instruction doc.
                </p>
              </button>
            </div>
          </div>

          {/* JUDICIAL MANDATORY COMPLIANCE BLOCK */}
          {category === 'JUDICIAL' && (
            <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/30 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Judicial Service Legal Compliance Fields (Mandatory)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                    High Court Suit / Case Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={courtCaseNumber}
                    onChange={(e) => setCourtCaseNumber(e.target.value)}
                    placeholder="e.g. HC/ACR/COMM/2026/049"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200 mb-1">
                    Sheriff Instruction / Writ of Fi-Fa Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={sheriffInstructionRef}
                    onChange={(e) => setSheriffInstructionRef(e.target.value)}
                    placeholder="e.g. SHF/WRIT/EXEC/2026/012"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <DocumentUploader
                    documentUrl={courtOrderDocUrl}
                    fileName={courtOrderFileName}
                    onChange={(url, name) => {
                      setCourtOrderDocUrl(url);
                      setCourtOrderFileName(name);
                    }}
                    entityType="AUCTION"
                    label="Sheriff Writ of Execution / Court Order Document (PDF/Scan)"
                    helperText="Upload official sealed High Court writ of execution, fi-fa order, or Registrar/Sheriff instruction (PDF, JPG, PNG)."
                    buttonText="Attach Sheriff Writ of Execution or Court Order (PDF / Scan)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Asset Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Step 2 &bull; Select Asset Type
              </span>
              {category === 'GOVERNMENT' && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Government auctions are strictly Movable only (Policy Enforced)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Movable */}
              <button
                type="button"
                onClick={() => setAssetType('MOVABLE')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  assetType === 'MOVABLE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Car className="h-5 w-5 text-indigo-600" />
                  {assetType === 'MOVABLE' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Movable Asset
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Vehicles, plants, machinery, equipment, furniture. Issues <strong>Waybill</strong> upon settlement.
                </p>
              </button>

              {/* Immovable (Hard-disabled if Government) */}
              <button
                type="button"
                disabled={category === 'GOVERNMENT'}
                onClick={() => setAssetType('IMMOVABLE')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  category === 'GOVERNMENT'
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : assetType === 'IMMOVABLE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-5 w-5 text-indigo-600" />
                  {assetType === 'IMMOVABLE' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Immovable Asset {category === 'GOVERNMENT' && '(Disallowed)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Land, houses, commercial buildings. Issues <strong>Sale &amp; Transfer Deed</strong> (No Waybill).
                </p>
              </button>
            </div>

            {/* Sub-Type Selector */}
            <div className="flex gap-4 pt-2">
              {assetType === 'MOVABLE' ? (
                <>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="movableSubType"
                      checked={movableSubType === 'VEHICLE'}
                      onChange={() => setMovableSubType('VEHICLE')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Motor Vehicle (Car, Truck, SUV, Bus)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="movableSubType"
                      checked={movableSubType === 'OTHER_MOVABLE'}
                      onChange={() => setMovableSubType('OTHER_MOVABLE')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Other Movable (Plant, Machinery, Equipment)</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="immovableSubType"
                      checked={immovableSubType === 'LAND'}
                      onChange={() => setImmovableSubType('LAND')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Land Parcel / Site</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="immovableSubType"
                      checked={immovableSubType === 'BUILDING'}
                      onChange={() => setImmovableSubType('BUILDING')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Building / Residential / Commercial Facility</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* STEP 3: Dynamic Specification Form */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Step 3 &bull; Asset Specifications &amp; Intake Details
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lot Sequence Code *
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Next Auto: {computedNextLotNumber}
                  </span>
                </div>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder={computedNextLotNumber}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lot Title / Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2022 Toyota Land Cruiser Prado TX-L"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              {/* MOVABLE VEHICLE FIELDS */}
              {assetType === 'MOVABLE' && movableSubType === 'VEHICLE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chassis Number (VIN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={chassisNumber}
                      onChange={(e) => setChassisNumber(e.target.value)}
                      placeholder="e.g. JTEBU29J7MK089211"
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. GW 8941-21"
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fuel Type *
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ELECTRIC">Electric</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Make
                      </label>
                      <input
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="e.g. Toyota"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. Prado"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value) || 2022)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={mileageKm || ''}
                        onChange={(e) => setMileageKm(parseInt(e.target.value) || 0)}
                        placeholder="e.g. 45000"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MOVABLE OTHER FIELDS */}
              {assetType === 'MOVABLE' && movableSubType === 'OTHER_MOVABLE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Serial / Asset Tag Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={serialOrTagNumber}
                      onChange={(e) => setSerialOrTagNumber(e.target.value)}
                      placeholder="e.g. MOFA-MECH-084-CAT"
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity of Units *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plant / Equipment Category
                    </label>
                    <input
                      type="text"
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value)}
                      placeholder="e.g. Earthmoving Backhoe Loader / Workshop Generator"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </>
              )}

              {/* IMMOVABLE FIELDS */}
              {assetType === 'IMMOVABLE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parcel / Cadastral Reference *
                    </label>
                    <input
                      type="text"
                      required
                      value={parcelReference}
                      onChange={(e) => setParcelReference(e.target.value)}
                      placeholder="e.g. EL-BLKB-PLT-109"
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lands Commission Title Reference *
                    </label>
                    <input
                      type="text"
                      required
                      value={titleReference}
                      onChange={(e) => setTitleReference(e.target.value)}
                      placeholder="e.g. GL/ACR/T-89412/2018"
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Geographic Location / Enclave *
                    </label>
                    <input
                      type="text"
                      required
                      value={locationArea}
                      onChange={(e) => setLocationArea(e.target.value)}
                      placeholder="e.g. East Legon Embassy Gardens Enclave, Accra"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Dimensions / Acreage *
                    </label>
                    <input
                      type="text"
                      required
                      value={sizeDimensions}
                      onChange={(e) => setSizeDimensions(e.target.value)}
                      placeholder="e.g. 0.28 Acre (100ft x 120ft)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </>
              )}

              {/* Pricing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reserve Price (GH₵) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={reservePriceGhs || ''}
                  onChange={(e) => setReservePriceGhs(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 350000"
                  className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Starting Bid (GH₵)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={startingBidGhs || ''}
                  onChange={(e) => setStartingBidGhs(parseFloat(e.target.value) || 0)}
                  placeholder="Defaults to reserve"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yard Location / Storage Bay
                </label>
                <input
                  type="text"
                  value={yardLocation}
                  onChange={(e) => setYardLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Intake &amp; Inspection Photos
                </label>
                <ProductPhotoUploader
                  photos={photos}
                  onChange={setPhotos}
                  entityType="AUCTION"
                  maxPhotos={10}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Condition &amp; Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Engine operational, bodywork condition, title verification notes..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* General Inventory / Fixed Assets Auto-registration */}
          {assetType === 'MOVABLE' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Register in General Inventory &amp; Asset Register
                </p>
                <p className="text-[11px] text-slate-500">
                  Automatically create an inventory tracking item in the Auction Yard warehouse ledger
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegisterInventory}
                  onChange={(e) => setAutoRegisterInventory(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enable
                </span>
              </label>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Link href="/desk/auctions">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Register Lot into Auction Yard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

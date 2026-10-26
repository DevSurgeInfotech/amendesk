'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { DealershipVehicle } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { formatGHS } from '@/lib/utils/currency';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: DealershipVehicle | null;
  onSuccess?: () => void;
}

interface EditVehicleFormProps {
  vehicle: DealershipVehicle;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditVehicleForm({ vehicle, onClose, onSuccess }: EditVehicleFormProps) {
  const [make, setMake] = useState(vehicle.make || '');
  const [model, setModel] = useState(vehicle.model || '');
  const [year, setYear] = useState<number>(vehicle.year || 2023);
  const [vin, setVin] = useState(vehicle.vin || '');
  const [stockNumber, setStockNumber] = useState(vehicle.stockNumber || '');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'>(vehicle.fuelType || 'PETROL');
  const [transmission, setTransmission] = useState<'AUTOMATIC' | 'MANUAL'>(vehicle.transmission || 'AUTOMATIC');
  const [mileageKm, setMileageKm] = useState<number>(vehicle.mileageKm || 0);
  const [color, setColor] = useState(vehicle.color || 'Pearl White');
  const [landedCostGhs, setLandedCostGhs] = useState<number>(vehicle.landedCostGhs || 0);
  const [askingPriceGhs, setAskingPriceGhs] = useState<number>(vehicle.askingPriceGhs || 0);
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'SOLD'>(vehicle.status || 'AVAILABLE');
  const [location, setLocation] = useState(vehicle.location || 'Amen Mart Showroom');
  const [description, setDescription] = useState(vehicle.description || '');
  const [featured, setFeatured] = useState(vehicle.featured ?? true);
  const [photos, setPhotos] = useState<string[]>(vehicle.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const projectedMargin = askingPriceGhs - landedCostGhs;
  const marginPercent = landedCostGhs > 0 ? Math.round((projectedMargin / landedCostGhs) * 100) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!make.trim() || !model.trim() || !vin.trim()) {
      setErrorMsg('Make, Model, and VIN are required fields.');
      return;
    }

    if (askingPriceGhs <= 0) {
      setErrorMsg('Please specify a valid asking price greater than GH₵ 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedVehicle: DealershipVehicle = {
        ...vehicle,
        make: make.trim(),
        model: model.trim(),
        year,
        vin: vin.trim().toUpperCase(),
        stockNumber: stockNumber.trim().toUpperCase() || vehicle.stockNumber,
        fuelType,
        transmission,
        mileageKm,
        color: color.trim() || 'White',
        landedCostGhs,
        askingPriceGhs,
        status,
        location: location.trim() || 'Amen Mart Showroom',
        description: description.trim(),
        featured,
        photos:
          photos.length > 0
            ? photos
            : [
                'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
              ],
      };

      await db.dealershipVehicles.put(updatedVehicle);
      await syncEngine.queueMutation('dealershipVehicles', vehicle.id, 'UPDATE', updatedVehicle);

      // Synchronize associated Inventory Item if exists
      const invItem = await db.inventoryItems
        .where('sku')
        .equals(vehicle.stockNumber)
        .first();

      if (invItem) {
        const updatedInv = {
          ...invItem,
          name: `${year} ${make.trim()} ${model.trim()} (${updatedVehicle.stockNumber})`,
          sku: updatedVehicle.stockNumber,
          landedCostGhs,
        };
        await db.inventoryItems.put(updatedInv);
        await syncEngine.queueMutation('inventoryItems', invItem.id, 'UPDATE', updatedInv);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await db.dealershipVehicles.delete(vehicle.id);
      await syncEngine.queueMutation('dealershipVehicles', vehicle.id, 'DELETE', { id: vehicle.id });

      // Clean up associated Inventory item
      const invItem = await db.inventoryItems
        .where('sku')
        .equals(vehicle.stockNumber)
        .first();

      if (invItem) {
        await db.inventoryItems.delete(invItem.id);
        await syncEngine.queueMutation('inventoryItems', invItem.id, 'DELETE', { id: invItem.id });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Basic Particulars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Make *
          </label>
          <input
            type="text"
            required
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="e.g. Toyota"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Model *
          </label>
          <input
            type="text"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. Land Cruiser Prado"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Year *
          </label>
          <input
            type="number"
            required
            min={1990}
            max={2030}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || 2023)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
          />
        </div>
      </div>

      {/* Identification & Technical */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            VIN / Chassis Number *
          </label>
          <input
            type="text"
            required
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="e.g. JTEBU5JR8K5019283"
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Stock Code
          </label>
          <input
            type="text"
            value={stockNumber}
            onChange={(e) => setStockNumber(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Fuel Type *
          </label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC')}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
          >
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Transmission
          </label>
          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value as 'AUTOMATIC' | 'MANUAL')}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
          >
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mileage (km)
          </label>
          <input
            type="number"
            min={0}
            value={mileageKm || ''}
            onChange={(e) => setMileageKm(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 35000"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Color, Location, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Exterior Color
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Magnetic Gray"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Showroom Yard Facility
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Amen Mart Showroom"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Stock Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'AVAILABLE' | 'RESERVED' | 'SOLD')}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="AVAILABLE">AVAILABLE (Active Showroom)</option>
            <option value="RESERVED">RESERVED (Deposit Held)</option>
            <option value="SOLD">SOLD (Discharged)</option>
          </select>
        </div>
      </div>

      {/* Financial & Landed Margin Metrics */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Landed Cost (GH₵)
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={landedCostGhs || ''}
              onChange={(e) => setLandedCostGhs(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 250000"
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Asking Retail Price (GH₵) *
            </label>
            <input
              type="number"
              min={0}
              step="any"
              required
              value={askingPriceGhs || ''}
              onChange={(e) => setAskingPriceGhs(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 310000"
              className="w-full px-3 py-2 text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-500">Projected Dealer Margin:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            +{formatGHS(projectedMargin)} ({marginPercent}%)
          </span>
        </div>
      </div>

      {/* Photos & Gallery */}
      <div>
        <ProductPhotoUploader
          photos={photos}
          onChange={setPhotos}
          entityType="DEALERSHIP"
          label="Vehicle Exterior & Cockpit Photos"
          helperText="Upload or take photos via camera. The first image will be used as the primary showroom cover."
          maxPhotos={10}
        />
      </div>

      {/* Description & Featured */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Showroom Listing Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Key vehicle features, imported condition, leather interior, sunroof, service history..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
        />

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            Feature on Public Website Showroom Hero Showcase
          </span>
        </label>
      </div>

      {/* Modal Footer Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                Confirm delete?
              </span>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Vehicle'}
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
              Delete Stock
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
            {isSubmitting ? 'Saving Changes...' : 'Save Vehicle Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditVehicleModal({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}: EditVehicleModalProps) {
  if (!isOpen || !vehicle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Showroom Vehicle • ${vehicle.stockNumber}`}
      subtitle="Modify vehicle specifications, pricing, gallery photos, and showroom availability."
      maxWidth="2xl"
    >
      <EditVehicleForm
        key={vehicle.id}
        vehicle={vehicle}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { DealershipVehicle } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { Car, CheckCircle } from 'lucide-react';

interface VehicleIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VehicleIntakeModal({
  isOpen,
  onClose,
  onSuccess,
}: VehicleIntakeModalProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2023);
  const [vin, setVin] = useState('');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'>('PETROL');
  const [transmission, setTransmission] = useState<'AUTOMATIC' | 'MANUAL'>('AUTOMATIC');
  const [mileageKm, setMileageKm] = useState<number>(35000);
  const [color, setColor] = useState('Pearl White');
  const [landedCostGhs, setLandedCostGhs] = useState<number>(0);
  const [askingPriceGhs, setAskingPriceGhs] = useState<number>(0);
  const [location, setLocation] = useState('Amen Mart Showroom');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newCarId = `car-${Date.now()}`;
      const stockNumber = `AM-CAR-${Math.floor(2000 + Math.random() * 8000)}`;
      const nowIso = new Date().toISOString();

      const newCar: DealershipVehicle = {
        id: newCarId,
        vin: vin.trim().toUpperCase(),
        stockNumber,
        make: make.trim(),
        model: model.trim(),
        year,
        fuelType,
        transmission,
        mileageKm,
        color,
        landedCostGhs,
        askingPriceGhs,
        status: 'AVAILABLE',
        photos:
          photos.length > 0
            ? photos
            : [
                'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
              ],
        description: description.trim() || `${year} ${make} ${model} in ${color}`,
        featured: true,
        location,
        createdAt: nowIso,
      };

      await db.dealershipVehicles.add(newCar);
      await syncEngine.queueMutation('dealershipVehicles', newCar.id, 'CREATE', newCar);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
        // reset form
        setMake('');
        setModel('');
        setVin('');
        setLandedCostGhs(0);
        setAskingPriceGhs(0);
        setDescription('');
        setPhotos([]);
      }, 1000);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Showroom Vehicle Intake"
      subtitle="Register an imported or traded vehicle into direct dealership inventory"
      maxWidth="xl"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Vehicle Successfully Added!
          </h3>
          <p className="text-xs text-slate-500">
            Inventory stock number assigned and queued for sync.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Make *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota, Mercedes"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Land Cruiser, C300"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Year *
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2030}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                VIN / Chassis Number *
              </label>
              <input
                type="text"
                required
                placeholder="17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fuel Type &amp; Transmission
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC')}
                  className="w-full text-xs px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ELECTRIC">Electric</option>
                </select>

                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as 'AUTOMATIC' | 'MANUAL')}
                  className="w-full text-xs px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Landed Cost (GH₵) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="Total purchase + shipping + duty"
                value={landedCostGhs || ''}
                onChange={(e) => setLandedCostGhs(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Showroom Asking Price (GH₵) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="Retail showroom sticker price"
                value={askingPriceGhs || ''}
                onChange={(e) => setAskingPriceGhs(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mileage (Km)
              </label>
              <input
                type="number"
                value={mileageKm}
                onChange={(e) => setMileageKm(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Showroom Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <ProductPhotoUploader
            photos={photos}
            onChange={setPhotos}
            entityType="DEALERSHIP"
            label="Vehicle Photos (Exterior, Cockpit, Engine)"
            helperText="Upload or take live photos. First photo is showroom cover."
            maxPhotos={8}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Condition &amp; Specification Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Full leather interior, panoramic roof, duty fully paid at Tema Port"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={<Car className="h-4 w-4" />} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add Vehicle to Inventory'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

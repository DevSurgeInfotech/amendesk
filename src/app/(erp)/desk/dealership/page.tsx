'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { DealershipVehicle } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import Image from 'next/image';
import { PlusCircle, Fuel, Gauge } from 'lucide-react';

export default function DealershipPage() {
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []) || [];
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New vehicle form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2022);
  const [vin, setVin] = useState('');
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'>('PETROL');
  const [landedCostGhs, setLandedCostGhs] = useState<number>(0);
  const [askingPriceGhs, setAskingPriceGhs] = useState<number>(0);
  const [color, setColor] = useState('Pearl White');
  const [mileageKm, setMileageKm] = useState<number>(30000);
  const [location, setLocation] = useState('Amen Mart Spintex Showroom');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newCar: DealershipVehicle = {
        id: `car-${Date.now()}`,
        vin,
        stockNumber: `AM-CAR-${Math.floor(2000 + Math.random() * 8000)}`,
        make,
        model,
        year,
        fuelType,
        transmission: 'AUTOMATIC',
        mileageKm,
        color,
        landedCostGhs,
        askingPriceGhs,
        status: 'AVAILABLE',
        photos: [photoUrl],
        description,
        featured: true,
        location,
        createdAt: new Date().toISOString(),
      };

      await db.dealershipVehicles.add(newCar);
      await syncEngine.queueMutation('dealershipVehicles', newCar.id, 'CREATE', newCar);

      setIsAddOpen(false);
      // Reset form
      setMake('');
      setModel('');
      setVin('');
      setLandedCostGhs(0);
      setAskingPriceGhs(0);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (car: DealershipVehicle, newStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD') => {
    await db.dealershipVehicles.update(car.id, { status: newStatus });
    await syncEngine.queueMutation('dealershipVehicles', car.id, 'UPDATE', { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Direct Car Dealership
            </span>
            <span className="text-xs text-slate-400">Spintex Showroom &bull; Landed Margin Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Imported Vehicle Inventory
          </h1>
          <p className="text-xs text-slate-500">
            Separate from auction fleet. Synced live to the public website showroom with inquiry tracking.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
          Add Showroom Vehicle
        </Button>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((car) => {
          const projectedMargin = car.askingPriceGhs - car.landedCostGhs;
          const marginPercent = Math.round((projectedMargin / car.landedCostGhs) * 100);

          return (
            <div
              key={car.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-slate-200 dark:bg-slate-800">
                  <Image
                    src={car.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                    alt={`${car.make} ${car.model}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                      {car.stockNumber}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Badge
                      variant={car.status === 'AVAILABLE' ? 'success' : car.status === 'RESERVED' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {car.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {car.year} {car.make} {car.model}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>VIN: <strong className="font-mono text-slate-800 dark:text-slate-200">{car.vin}</strong></p>
                    <div className="flex items-center gap-4 pt-1">
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5 text-indigo-500" />
                        {car.fuelType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5 text-indigo-500" />
                        {car.mileageKm.toLocaleString()} km
                      </span>
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Landed Cost:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        {formatGHS(car.landedCostGhs)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Asking Price:</span>
                      <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {formatGHS(car.askingPriceGhs)}
                      </p>
                    </div>
                    <div className="col-span-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex justify-between font-semibold">
                      <span>Projected Dealer Margin:</span>
                      <span>+{formatGHS(projectedMargin)} ({marginPercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Switcher */}
              <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                <div className="flex gap-1.5">
                  {(['AVAILABLE', 'RESERVED', 'SOLD'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => void handleToggleStatus(car, st)}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        car.status === st
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Direct Dealership Vehicle"
        subtitle="Log new imported car stock into Spintex Showroom registry."
        maxWidth="lg"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Make *</label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Model *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. RAV4 XLE"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Year *</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2022)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fuel Type *</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">VIN / Chassis Number *</label>
              <input
                type="text"
                required
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. JTMBFREV9N5109281"
                className="w-full px-3 py-2 text-sm font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Color *</label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Magnetic Gray"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Mileage (km) *</label>
              <input
                type="number"
                min="0"
                required
                value={mileageKm || ''}
                onChange={(e) => setMileageKm(parseInt(e.target.value) || 0)}
                placeholder="e.g. 28000"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Showroom Facility Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Amen Mart Spintex Showroom"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Landed Cost (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={landedCostGhs || ''}
                onChange={(e) => setLandedCostGhs(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 240000"
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Asking Price (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={askingPriceGhs || ''}
                onChange={(e) => setAskingPriceGhs(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 295000"
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-indigo-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Vehicle Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key options, leather interior, panoramic roof..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add to Showroom Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

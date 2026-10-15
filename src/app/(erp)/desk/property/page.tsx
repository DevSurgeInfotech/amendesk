'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PropertyUnit } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import Link from 'next/link';
import { PlusCircle, MapPin, Bed, Bath, CreditCard } from 'lucide-react';

export default function PropertyPage() {
  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []) || [];
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [unitRef, setUnitRef] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>('RESIDENTIAL');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [priceGhs, setPriceGhs] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newProp: PropertyUnit = {
        id: `prop-${Date.now()}`,
        unitRef,
        title,
        propertyType,
        location,
        bedrooms: propertyType === 'RESIDENTIAL' ? bedrooms : undefined,
        bathrooms: propertyType === 'RESIDENTIAL' ? bathrooms : undefined,
        priceGhs,
        status: 'AVAILABLE',
        features: ['Executive Finishing', '24/7 Security', 'Backup Power', 'Titled'],
        description,
        photos: [photoUrl],
        createdAt: new Date().toISOString(),
      };

      await db.propertyUnits.add(newProp);
      await syncEngine.queueMutation('propertyUnits', newProp.id, 'CREATE', newProp);
      setIsAddOpen(false);
      setUnitRef('');
      setTitle('');
      setLocation('');
      setPriceGhs(0);
    } catch (err) {
      console.error('Failed to add property:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prop: PropertyUnit, newStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD') => {
    await db.propertyUnits.update(prop.id, { status: newStatus });
    await syncEngine.queueMutation('propertyUnits', prop.id, 'UPDATE', { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Direct Property Sales
            </span>
            <span className="text-xs text-slate-400">Residential Townhouses &bull; Commercial Warehouses</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Property Listings &amp; Units
          </h1>
          <p className="text-xs text-slate-500">
            Direct sales line for real estate units across Accra and Greater Accra.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
          Add Property Listing
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 bg-slate-200 dark:bg-slate-800">
                <Image
                  src={prop.photos[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
                  alt={prop.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                    {prop.unitRef}
                  </span>
                  <Badge variant="outline" size="sm" className="bg-white/90 dark:bg-slate-900/90 font-bold">
                    {prop.propertyType}
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant={prop.status === 'AVAILABLE' ? 'success' : prop.status === 'RESERVED' ? 'warning' : 'default'}
                    size="sm"
                  >
                    {prop.status}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {prop.title}
                </h3>

                <div className="text-xs text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{prop.location}</span>
                  </p>
                  {prop.bedrooms && (
                    <div className="flex items-center gap-4 pt-1">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5 text-indigo-500" />
                        {prop.bedrooms} Bedrooms
                      </span>
                      {prop.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-indigo-500" />
                          {prop.bathrooms} Baths
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-slate-600 dark:text-slate-400 mt-2">{prop.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prop.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      &bull; {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">Asking Price:</span>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatGHS(prop.priceGhs)}
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {(['AVAILABLE', 'RESERVED', 'SOLD'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => void handleToggleStatus(prop, st)}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        prop.status === st
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {prop.status !== 'SOLD' && (
                <Link href="/desk/payments" className="block w-full">
                  <Button size="sm" variant="outline" className="w-full" icon={<CreditCard className="h-3.5 w-3.5" />}>
                    Record Sale Payment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Property Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Property Listing"
        subtitle="Log residential or commercial real estate into sales registry."
        maxWidth="lg"
      >
        <form onSubmit={handleAddProperty} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Unit Reference *</label>
              <input
                type="text"
                required
                value={unitRef}
                onChange={(e) => setUnitRef(e.target.value)}
                placeholder="e.g. AM-PROP-CNT-04"
                className="w-full px-3 py-2 text-sm font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Property Type *</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="RESIDENTIAL">Residential (House/Townhouse/Apartment)</option>
                <option value="COMMERCIAL">Commercial (Office/Retail)</option>
                <option value="INDUSTRIAL">Industrial (Warehouse/Yard)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Property Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 4-Bedroom Luxury Detached Residence — Airport Residential"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Location / Enclave *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cantonments, Accra"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Price (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={priceGhs || ''}
                onChange={(e) => setPriceGhs(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 3500000"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600"
              />
            </div>
            {propertyType === 'RESIDENTIAL' && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </>
            )}
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
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Architectural specs, solar power, security..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Property
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

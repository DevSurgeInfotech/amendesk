'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PropertyUnit } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SaleTransferModal } from '@/components/erp/SaleTransferModal';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { ProductGalleryModal } from '@/components/ui/ProductGalleryModal';
import { syncEngine } from '@/lib/sync/syncEngine';
import Link from 'next/link';
import { PlusCircle, MapPin, Bed, Bath, CreditCard, FileCheck, Search, ArrowRight, Images } from 'lucide-react';

function generatePropertyId(): string {
  return `prop-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function PropertyContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status')?.toUpperCase();
  const initialType = searchParams.get('type')?.toUpperCase();

  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []) || [];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDeedProp, setSelectedDeedProp] = useState<PropertyUnit | null>(null);
  const [galleryProp, setGalleryProp] = useState<PropertyUnit | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD'>(
    initialStatus === 'AVAILABLE' || initialStatus === 'RESERVED' || initialStatus === 'SOLD'
      ? initialStatus
      : 'ALL'
  );
  const resolvedType =
    initialType === 'RESIDENTIAL' || initialType === 'COMMERCIAL' || initialType === 'INDUSTRIAL'
      ? initialType
      : 'ALL';
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>(resolvedType);
  const [prevTypeParam, setPrevTypeParam] = useState(initialType);
  if (initialType !== prevTypeParam) {
    setPrevTypeParam(initialType);
    setTypeFilter(resolvedType);
  }
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [unitRef, setUnitRef] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>('RESIDENTIAL');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [priceGhs, setPriceGhs] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const propId = generatePropertyId();
      const nowIso = getIsoTimestamp();

      const newProp: PropertyUnit = {
        id: propId,
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
        photos:
          photos.length > 0
            ? photos
            : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
        createdAt: nowIso,
      };

      await db.propertyUnits.add(newProp);
      await syncEngine.queueMutation('propertyUnits', newProp.id, 'CREATE', newProp);
      setIsAddOpen(false);
      setUnitRef('');
      setTitle('');
      setLocation('');
      setPriceGhs(0);
      setDescription('');
      setPhotos([]);
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

  const filteredProperties = properties.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && p.propertyType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchRef = p.unitRef.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Property Units
          </h1>
          <p className="text-xs text-slate-500">
            Residential &amp; commercial developments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs gap-1.5 shadow-xs"
            title="Open Public Properties Catalog in new tab"
          >
            <ArrowRight className="h-4 w-4" />
            Public Catalog
          </Link>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
            Add Unit
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">Type:</span>
          {(['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === tp
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, unit ref, enclave..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProperties.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">No properties match the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div
                  className="relative h-48 bg-slate-200 dark:bg-slate-800 cursor-pointer group overflow-hidden"
                  onClick={() => setGalleryProp(prop)}
                  title="Click to view high-resolution photo gallery"
                >
                  <Image
                    src={
                      prop.photos[0] ||
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={prop.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                      {prop.unitRef}
                    </span>
                    <Badge variant="outline" size="sm" className="bg-white/90 dark:bg-slate-900/90 font-bold">
                      {prop.propertyType}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                      <Images className="h-3 w-3 text-indigo-400" />
                      <span>{prop.photos?.length || 1} Photos</span>
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <Badge
                      variant={
                        prop.status === 'AVAILABLE'
                          ? 'success'
                          : prop.status === 'RESERVED'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {prop.status}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{prop.title}</h3>

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

                {prop.status !== 'SOLD' ? (
                  <Link href={`/desk/payments?category=PROPERTY&id=${prop.id}`} className="block w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      icon={<CreditCard className="h-3.5 w-3.5" />}
                    >
                      Record Sale Payment
                    </Button>
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/desk/payments?category=PROPERTY&id=${prop.id}`} className="block w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Payment Ledger
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs"
                      icon={<FileCheck className="h-3.5 w-3.5" />}
                      onClick={() => setSelectedDeedProp(prop)}
                    >
                      Issue / View Deed
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
              <label className="block text-xs font-semibold mb-1">Property Photos</label>
              <ProductPhotoUploader
                photos={photos}
                onChange={setPhotos}
                entityType="PROPERTY"
                maxPhotos={10}
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

      {/* Sale Transfer Deed Modal */}
      {selectedDeedProp && (
        <SaleTransferModal
          isOpen={Boolean(selectedDeedProp)}
          onClose={() => setSelectedDeedProp(null)}
          property={selectedDeedProp}
          onSuccess={() => setSelectedDeedProp(null)}
        />
      )}

      {/* Product Gallery Lightbox */}
      {galleryProp && (
        <ProductGalleryModal
          isOpen={Boolean(galleryProp)}
          onClose={() => setGalleryProp(null)}
          title={galleryProp.title}
          subtitle={`${galleryProp.unitRef} • ${galleryProp.location}`}
          photos={galleryProp.photos || []}
        />
      )}
    </div>
  );
}

export default function PropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-semibold text-sm">
          Loading Property Catalog...
        </div>
      }
    >
      <PropertyContent />
    </Suspense>
  );
}

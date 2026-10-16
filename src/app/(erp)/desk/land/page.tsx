'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { LandParcel } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SaleTransferModal } from '@/components/erp/SaleTransferModal';
import { syncEngine } from '@/lib/sync/syncEngine';
import Link from 'next/link';
import { MapPin, PlusCircle, CreditCard, FileCheck, Search, ArrowRight } from 'lucide-react';

function generateLandId(): string {
  return `land-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function LandContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status')?.toUpperCase();
  const initialTitleType = searchParams.get('titleType')?.toUpperCase();

  const parcels = useLiveQuery(() => db.landParcels.toArray(), []) || [];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDeedLand, setSelectedDeedLand] = useState<LandParcel | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD'>(
    initialStatus === 'AVAILABLE' || initialStatus === 'RESERVED' || initialStatus === 'SOLD'
      ? initialStatus
      : 'ALL'
  );
  const [titleTypeFilter, setTitleTypeFilter] = useState<'ALL' | 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE'>(
    initialTitleType === 'FREEHOLD' || initialTitleType === 'LEASEHOLD' || initialTitleType === 'INDENTURE'
      ? initialTitleType
      : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [siteRef, setSiteRef] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sizeAcres, setSizeAcres] = useState<number>(1);
  const [priceGhs, setPriceGhs] = useState<number>(0);
  const [titleType, setTitleType] = useState<'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE'>('INDENTURE');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const landId = generateLandId();
      const nowIso = getIsoTimestamp();

      const newParcel: LandParcel = {
        id: landId,
        siteRef,
        title,
        location,
        sizeAcres,
        priceGhs,
        status: 'AVAILABLE',
        titleType,
        features: ['Demarcated', 'Survey Plan Attached', 'Clear Documentation'],
        description,
        createdAt: nowIso,
      };

      await db.landParcels.add(newParcel);
      await syncEngine.queueMutation('landParcels', newParcel.id, 'CREATE', newParcel);
      setIsAddOpen(false);
      setSiteRef('');
      setTitle('');
      setLocation('');
      setPriceGhs(0);
      setDescription('');
    } catch (err) {
      console.error('Failed to add parcel:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (parcel: LandParcel, newStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD') => {
    await db.landParcels.update(parcel.id, { status: newStatus });
    await syncEngine.queueMutation('landParcels', parcel.id, 'UPDATE', { status: newStatus });
  };

  const filteredParcels = parcels.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (titleTypeFilter !== 'ALL' && p.titleType !== titleTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchRef = p.siteRef.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Direct Land Sales
            </span>
            <span className="text-xs text-slate-400">Titled &bull; Demarcated &bull; Indenture Tracking</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Land Parcels &amp; Sites
          </h1>
          <p className="text-xs text-slate-500">
            Direct sales line (separate from auctioned land). Managed with full Lands Commission document checklist.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/land">
            <Button variant="outline" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
              Public Catalog
            </Button>
          </Link>
          <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
            Add Land Parcel
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

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">Title Type:</span>
          {(['ALL', 'INDENTURE', 'LEASEHOLD', 'FREEHOLD'] as const).map((tt) => (
            <button
              key={tt}
              onClick={() => setTitleTypeFilter(tt)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                titleTypeFilter === tt
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tt}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parcels, reference, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredParcels.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">No land parcels match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredParcels.map((parcel) => (
            <div
              key={parcel.id}
              className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {parcel.siteRef}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="outline" size="sm">
                      {parcel.titleType}
                    </Badge>
                    <Badge
                      variant={
                        parcel.status === 'AVAILABLE'
                          ? 'success'
                          : parcel.status === 'RESERVED'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {parcel.status}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{parcel.title}</h3>

                <div className="text-xs text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{parcel.location}</span>
                  </p>
                  <p>
                    Size: <strong className="text-slate-800 dark:text-slate-200">{parcel.sizeAcres} Acres</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">{parcel.description}</p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {parcel.features.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      &bull; {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Direct Sale Price:</span>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatGHS(parcel.priceGhs)}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    {(['AVAILABLE', 'RESERVED', 'SOLD'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => void handleToggleStatus(parcel, st)}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${
                          parcel.status === st
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {parcel.status !== 'SOLD' ? (
                  <Link href={`/desk/payments?category=LAND&id=${parcel.id}`} className="block w-full">
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
                    <Link href={`/desk/payments?category=LAND&id=${parcel.id}`} className="block w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Payment Ledger
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs"
                      icon={<FileCheck className="h-3.5 w-3.5" />}
                      onClick={() => setSelectedDeedLand(parcel)}
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

      {/* Add Parcel Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Land Parcel"
        subtitle="Log parcel particulars and title documents into direct sales registry."
        maxWidth="lg"
      >
        <form onSubmit={handleAddParcel} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Site / Parcel Reference *</label>
              <input
                type="text"
                required
                value={siteRef}
                onChange={(e) => setSiteRef(e.target.value)}
                placeholder="e.g. AM-LND-AF-02"
                className="w-full px-3 py-2 text-sm font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Title Type *</label>
              <select
                value={titleType}
                onChange={(e) => setTitleType(e.target.value as 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="INDENTURE">Customary Indenture</option>
                <option value="LEASEHOLD">State / Stool Leasehold (50/99 Yrs)</option>
                <option value="FREEHOLD">Titled Freehold</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Parcel Title / Name *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 5 Acres Light Industrial Land — Prampram"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Geographic Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Prampram Coastal View, Greater Accra"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Size (Acres) *</label>
              <input
                type="number"
                step="any"
                required
                value={sizeAcres || ''}
                onChange={(e) => setSizeAcres(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Sale Price (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={priceGhs || ''}
                onChange={(e) => setPriceGhs(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 450000"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Description &amp; Access Details</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Road access, electricity proximity, beacon markers..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Parcel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sale Transfer Deed Modal */}
      {selectedDeedLand && (
        <SaleTransferModal
          isOpen={Boolean(selectedDeedLand)}
          onClose={() => setSelectedDeedLand(null)}
          land={selectedDeedLand}
          onSuccess={() => setSelectedDeedLand(null)}
        />
      )}
    </div>
  );
}

export default function LandPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-semibold text-sm">
          Loading Land Registry...
        </div>
      }
    >
      <LandContent />
    </Suspense>
  );
}

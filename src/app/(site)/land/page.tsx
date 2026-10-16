'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { LandParcel } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default function PublicLandPage() {
  const parcels = useLiveQuery(() => db.landParcels.toArray(), []) || [];
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [titleTypeFilter, setTitleTypeFilter] = useState<'ALL' | 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE'>('ALL');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCloseModal = () => {
    setSelectedParcel(null);
    setName('');
    setPhone('');
    setEmail('');
    setIsSuccess(false);
  };

  const filteredParcels = parcels.filter((p) => {
    if (titleTypeFilter !== 'ALL' && p.titleType !== titleTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.siteRef.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel || !name || !phone) return;

    setIsSubmitting(true);
    try {
      const customerId = `cust-${Date.now()}`;
      await db.customers.add({
        id: customerId,
        fullName: name,
        phone,
        email: email || 'land-lead@domain.gh',
        ghanaCardNumber: 'LAND_INQUIRY_LEAD',
        address: 'Web Inquiry',
        customerType: 'INDIVIDUAL',
        kycVerified: false,
        notes: `Inquiry on Land ${selectedParcel.siteRef}: ${selectedParcel.title}`,
        createdAt: new Date().toISOString(),
      });

      await syncEngine.queueMutation('customers', customerId, 'CREATE', {
        fullName: name,
        phone,
        notes: `Land Inquiry: ${selectedParcel.siteRef}`,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit land inquiry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Titled Land Parcels
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Direct Land Sales &amp; Commercial Acreage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified cadastral survey plans, clear boundaries, and Lands Commission documentation across Greater Accra.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search location, site ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-1.5">
            {(['ALL', 'FREEHOLD', 'LEASEHOLD', 'INDENTURE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTitleTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  titleTypeFilter === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParcels.map((parcel) => (
          <div
            key={parcel.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
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

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {parcel.title}
              </h3>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{parcel.location}</span>
                </p>
                <p>Acreage: <strong className="text-slate-800 dark:text-slate-200">{parcel.sizeAcres} Acres</strong></p>
                <p className="text-slate-600 dark:text-slate-400">{parcel.description}</p>
              </div>

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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Direct Purchase Price:</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatGHS(parcel.priceGhs)}
                </p>
              </div>

              {parcel.status === 'AVAILABLE' || parcel.status === 'RESERVED' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedParcel(parcel);
                    setIsSuccess(false);
                  }}
                >
                  Schedule Site Visit
                </Button>
              ) : (
                <span className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  Parcel Sold
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inquire Modal */}
      {selectedParcel && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Inquire & Schedule Visit for ${selectedParcel.siteRef}`}
          subtitle={selectedParcel.title}
          maxWidth="md"
        >
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Site Visit Request Logged!
              </h3>
              <p className="text-xs text-slate-500">
                Our Land Acquisition officer has received your details in the AmenDesk CRM. We will call you to arrange an escorted site inspection.
              </p>
              <div className="pt-4">
                <Button variant="primary" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInquire} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Esi Mensah-Bonsu"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 24 XXX XXXX"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="buyer@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Request Escorted Inspection
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PropertyUnit } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { MapPin, Bed, Bath, CheckCircle2 } from 'lucide-react';

export default function PublicPropertiesPage() {
  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []) || [];
  const [selectedProp, setSelectedProp] = useState<PropertyUnit | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>('ALL');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCloseModal = () => {
    setSelectedProp(null);
    setName('');
    setPhone('');
    setEmail('');
    setIsSuccess(false);
  };

  const filteredProperties = properties.filter((prop) => {
    if (propertyTypeFilter !== 'ALL' && prop.propertyType !== propertyTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        prop.title.toLowerCase().includes(q) ||
        prop.unitRef.toLowerCase().includes(q) ||
        prop.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInquire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp || !name || !phone) return;

    setIsSubmitting(true);
    try {
      const customerId = `cust-${Date.now()}`;
      await db.customers.add({
        id: customerId,
        fullName: name,
        phone,
        email: email || 'realty-lead@domain.gh',
        ghanaCardNumber: 'PROPERTY_INQUIRY_LEAD',
        address: 'Web Inquiry',
        customerType: 'INDIVIDUAL',
        kycVerified: false,
        notes: `Inquiry on Property ${selectedProp.unitRef}: ${selectedProp.title}`,
        createdAt: new Date().toISOString(),
      });

      await syncEngine.queueMutation('customers', customerId, 'CREATE', {
        fullName: name,
        phone,
        notes: `Property Inquiry: ${selectedProp.unitRef}`,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit property inquiry:', err);
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
            Executive Real Estate
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Residential Townhouses &amp; Commercial Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct sale properties across Cantonments, Airport Residential, and Spintex Industrial Area.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search title, location, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-1.5">
            {(['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPropertyTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  propertyTypeFilter === type
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
        {filteredProperties.map((prop) => (
          <div
            key={prop.id}
            className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="relative h-64 bg-slate-200 dark:bg-slate-800">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
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

            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Asking Price:</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatGHS(prop.priceGhs)}
                </p>
              </div>

              {prop.status === 'AVAILABLE' || prop.status === 'RESERVED' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedProp(prop);
                    setIsSuccess(false);
                  }}
                >
                  Inquire &amp; View
                </Button>
              ) : (
                <span className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  Unit Sold
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Property Inquire Modal */}
      {selectedProp && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Property Inquiry: ${selectedProp.unitRef}`}
          subtitle={selectedProp.title}
          maxWidth="md"
        >
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Inquiry Received!
              </h3>
              <p className="text-xs text-slate-500">
                Our property sales team will contact you promptly to schedule an exclusive viewing.
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
                  placeholder="e.g. Dr. Mensah"
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
                  placeholder="client@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Request Viewing
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

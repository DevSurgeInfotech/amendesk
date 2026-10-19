'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AuctionCategory, AssetType, AuctionLot } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProductGalleryModal } from '@/components/ui/ProductGalleryModal';
import { syncEngine } from '@/lib/sync/syncEngine';
import {
  Gavel,
  ShieldAlert,
  Building2,
  Layers,
  MapPin,
  CheckCircle2,
  Images,
} from 'lucide-react';

function PublicAuctionsCatalog() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat')?.toUpperCase() as AuctionCategory | undefined;

  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AuctionCategory>(
    catParam && ['JUDICIAL', 'GOVERNMENT', 'PRIVATE'].includes(catParam) ? catParam : 'ALL'
  );
  const [assetTypeFilter, setAssetTypeFilter] = useState<'ALL' | AssetType>('ALL');
  const [inquiryLot, setInquiryLot] = useState<AuctionLot | null>(null);
  const [galleryLot, setGalleryLot] = useState<AuctionLot | null>(null);

  const [bidderName, setBidderName] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCloseModal = () => {
    setInquiryLot(null);
    setBidderName('');
    setBidderPhone('');
    setBidderEmail('');
    setIsSuccess(false);
  };

  const filteredLots = lots.filter((lot) => {
    if (categoryFilter !== 'ALL' && lot.category !== categoryFilter) return false;
    if (assetTypeFilter !== 'ALL' && lot.assetType !== assetTypeFilter) return false;
    return true;
  });

  const handleRegisterBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryLot || !bidderName || !bidderPhone) return;

    setIsSubmitting(true);
    try {
      const customerId = `cust-${Date.now()}`;
      await db.customers.add({
        id: customerId,
        fullName: bidderName,
        phone: bidderPhone,
        email: bidderEmail || 'bidder@domain.gh',
        ghanaCardNumber: 'PENDING_REGISTRATION_DESK',
        address: 'Online Bidder Registration',
        customerType: 'INDIVIDUAL',
        kycVerified: false,
        notes: `Online Bidder Registration for ${inquiryLot.lotNumber}: ${inquiryLot.title}`,
        createdAt: new Date().toISOString(),
      });

      await syncEngine.queueMutation('customers', customerId, 'CREATE', {
        fullName: bidderName,
        phone: bidderPhone,
        notes: `Registered for ${inquiryLot.lotNumber}`,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to register bidder:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Public Notifications &amp; Gazetted Notices
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Auction Notices &amp; Public Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filterable across Judicial, Government (Movable Only), and Private auctions. Synced live from AmenDesk.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Categories ({lots.length})
          </button>
          <button
            onClick={() => setCategoryFilter('JUDICIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'JUDICIAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Judicial</span>
          </button>
          <button
            onClick={() => setCategoryFilter('GOVERNMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'GOVERNMENT'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Government Movable</span>
          </button>
          <button
            onClick={() => setCategoryFilter('PRIVATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              categoryFilter === 'PRIVATE'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Private</span>
          </button>
        </div>

        {/* Asset Type Selector */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-500">Asset Scope:</span>
          {(['ALL', 'MOVABLE', 'IMMOVABLE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAssetTypeFilter(t)}
              className={`px-2.5 py-1 rounded font-medium ${
                assetTypeFilter === t
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredLots.map((lot) => (
          <div
            key={lot.id}
            className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              <div
                className="relative h-56 bg-slate-200 dark:bg-slate-800 cursor-pointer group overflow-hidden"
                onClick={() => setGalleryLot(lot)}
                title="Click to view photo gallery"
              >
                <Image
                  src={lot.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                  alt={lot.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                    {lot.lotNumber}
                  </span>
                  <Badge
                    variant={
                      lot.category === 'JUDICIAL'
                        ? 'danger'
                        : lot.category === 'GOVERNMENT'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  >
                    {lot.category}
                  </Badge>
                  <Badge variant="outline" size="sm" className="bg-white/90 dark:bg-slate-900/90 font-bold">
                    {lot.assetType}
                  </Badge>
                  <Badge
                    variant={
                      lot.status === 'ACTIVE'
                        ? 'success'
                        : lot.status === 'UPCOMING'
                        ? 'info'
                        : lot.status === 'AWAITING_BALANCE'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {lot.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                    <Images className="h-3 w-3 text-indigo-400" />
                    <span>{lot.photos?.length || 1} Photos</span>
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                  {lot.title}
                </h3>

                {lot.category === 'JUDICIAL' && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 font-mono space-y-0.5">
                    <p className="font-bold">Suit: {lot.courtCaseNumber || 'HC/ACR/COMM/2026/049'}</p>
                    <p>Sheriff Fi-Fa: {lot.sheriffInstructionRef || 'SHF/WRIT/EXEC/2026/012'}</p>
                  </div>
                )}

                <p className="text-xs text-slate-500 line-clamp-2">{lot.conditionNotes}</p>

                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{lot.yardLocation}</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Starting Bid:</span>
                <p className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatGHS(lot.startingBidGhs)}
                </p>
              </div>

              {lot.status === 'ACTIVE' || lot.status === 'UPCOMING' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setInquiryLot(lot);
                    setIsSuccess(false);
                  }}
                  icon={<Gavel className="h-3.5 w-3.5" />}
                >
                  Register to Bid
                </Button>
              ) : (
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800">
                  Hammer Closed ({lot.status.replace('_', ' ')})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bidder Registration Modal */}
      {inquiryLot && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Bidder Registration for ${inquiryLot.lotNumber}`}
          subtitle={inquiryLot.title}
          maxWidth="md"
        >
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Bidder Registration Logged
              </h3>
              <p className="text-xs text-slate-500">
                Your bid registration has been queued in the AmenDesk ERP auction terminal. A representative will verify your Ghana Card KYC prior to hammer session.
              </p>
              <div className="pt-4">
                <Button variant="primary" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterBid} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
                <p>Starting Bid: <strong className="font-mono text-indigo-600">{formatGHS(inquiryLot.startingBidGhs)}</strong></p>
                <p className="text-slate-500">Hammer terms: 14-day balance window &bull; Standard 7% auction fee.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={bidderName}
                  onChange={(e) => setBidderName(e.target.value)}
                  placeholder="e.g. Alhassan Yakubu"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={bidderPhone}
                  onChange={(e) => setBidderPhone(e.target.value)}
                  placeholder="+233 24 XXX XXXX"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={bidderEmail}
                  onChange={(e) => setBidderEmail(e.target.value)}
                  placeholder="bidder@domain.gh"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Confirm Bidder Registration
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {galleryLot && (
        <ProductGalleryModal
          isOpen={Boolean(galleryLot)}
          onClose={() => setGalleryLot(null)}
          title={galleryLot.title}
          subtitle={`${galleryLot.category} • ${galleryLot.lotNumber} • ${galleryLot.yardLocation}`}
          photos={galleryLot.photos || []}
        />
      )}
    </div>
  );
}

export default function PublicAuctionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-6 py-12 text-slate-500 text-xs">
          Loading auction catalog...
        </div>
      }
    >
      <PublicAuctionsCatalog />
    </Suspense>
  );
}

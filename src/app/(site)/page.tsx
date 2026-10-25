'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatGHS } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { recordInboundLead } from '@/lib/crm/leads';
import { HeroKpis } from '@/components/site/HeroKpis';
import {
  Gavel,
  Car,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Fuel,
  CreditCard,
  Send,
  Building2,
} from 'lucide-react';

export default function HomePage() {
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []) || [];

  const [inquiryModalItem, setInquiryModalItem] = useState<{ title: string; type: string } | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);

  const featuredCars = vehicles
    .filter((v) => v.status === 'AVAILABLE')
    .slice(0, 3);
  const featuredLots = lots
    .filter((l) => l.status === 'ACTIVE' || l.status === 'UPCOMING')
    .slice(0, 3);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;

    try {
      const noteText = `Inquiry on ${inquiryModalItem?.title} (${inquiryModalItem?.type}): ${inquiryNotes || 'No notes'}`;

      await recordInboundLead({
        fullName: inquiryName,
        phone: inquiryPhone,
        email: inquiryEmail,
        inquiryType: inquiryModalItem?.type || 'PORTAL',
        inquirySubject: inquiryModalItem ? `${inquiryModalItem.type}: ${inquiryModalItem.title}` : 'General Portal Inquiry',
        inquiryMessage: inquiryNotes || `Inquiry on ${inquiryModalItem?.title}`,
        leadSource: 'PORTAL',
        notes: noteText,
        address: 'Website Online Inquiry',
        ghanaCardNumber: 'PENDING_ONLINE_KYC',
      });

      setIsInquirySubmitted(true);
      setTimeout(() => {
        setIsInquirySubmitted(false);
        setInquiryModalItem(null);
        setInquiryName('');
        setInquiryPhone('');
        setInquiryEmail('');
        setInquiryNotes('');
      }, 1800);
    } catch (err) {
      console.error('Failed to register inquiry:', err);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section - Clean, High-Trust Light Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-slate-50/90 to-[#e9eff5]/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-14 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6">
        {/* Subtle decorative radial grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-10 sm:space-y-12">
          {/* Hero Header & Primary CTAs */}
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Amen Mart Auctioning Services &bull; Licensed by Ghana Auctioneers Association</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Ghana&apos;s Trusted Hub for Asset Auctions &amp; Direct Sales
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
              Bid on verified Judicial, Government, and Private lots or purchase inspected vehicles, titled land, and properties directly in Accra.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link href="/auctions" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />} className="w-full sm:w-auto">
                  View Upcoming Auctions
                </Button>
              </Link>
              <Link href="/showroom" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" icon={<Car className="h-5 w-5" />} className="w-full sm:w-auto">
                  Explore Car Showroom
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Performance Indicators (KPIs) Trust Ribbon - Full-Width of max-w-7xl */}
          <div className="pt-2 sm:pt-4">
            <HeroKpis />
          </div>
        </div>
      </section>

      {/* Service Lines Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Core Business Lines
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Explore Our Divisions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1: Judicial */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Judicial Auctions
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Court-ordered sheriff sales of vehicles and real estate with High Court certification.
              </p>
            </div>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>View Court Notices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 2: Government */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <Gavel className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Government &amp; Private Lots
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Official state fleet disposals, heavy machinery, and corporate liquidations.
              </p>
            </div>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Explore Fleet Lots</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 3: Dealership */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                <Car className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Car Showroom
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct-sale imported SUVs, sedans, and pickups ready for immediate transfer.
              </p>
            </div>
            <Link
              href="/showroom"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Browse Showroom</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 4: Land & Properties */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Land &amp; Properties
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified residential homes, commercial units, and titled land with site plans.
              </p>
            </div>
            <Link
              href="/properties"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>View Listings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Showroom Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Direct Dealership
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Showroom Stock
              </h2>
              <p className="text-xs text-slate-500">
                Premium imported vehicles ready for immediate ownership transfer.
              </p>
            </div>
            <Link href="/showroom">
              <Button variant="outline" size="sm">
                View All Vehicles ({vehicles.length}) &rarr;
              </Button>
            </Link>
          </div>

          {featuredCars.length === 0 ? (
            <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Showroom Inventory Arriving
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Direct imported vehicles are currently undergoing landed customs clearance and showroom detailing. Call{' '}
                <strong className="text-slate-700 dark:text-slate-300">0548517277 / 0558314744</strong> for vehicle reservations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCars.map((car) => (
                <div
                  key={car.id}
                  className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 bg-slate-200 dark:bg-slate-800">
                      <Image
                        src={car.photos[0] || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'}
                        alt={`${car.make} ${car.model}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
                          {car.stockNumber}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="success" size="sm">
                          Available
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{car.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3.5 w-3.5 text-indigo-500" />
                          {car.fuelType}
                        </span>
                        <span>{car.mileageKm.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400">Asking Price:</span>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatGHS(car.askingPriceGhs)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setInquiryModalItem({ title: `${car.year} ${car.make} ${car.model}`, type: 'DEALERSHIP_CAR' })}
                    >
                      Inquire / Reserve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Auction Notices */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Statutory Liquidations
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Upcoming Auction Notices
            </h2>
            <p className="text-xs text-slate-500">
              Public notifications filterable across Judicial, Government, and Private auctions.
            </p>
          </div>
          <Link href="/auctions">
            <Button variant="outline" size="sm">
              View All Notices ({lots.length}) &rarr;
            </Button>
          </Link>
        </div>

        {featuredLots.length === 0 ? (
          <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Auction Schedule in Preparation
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upcoming Judicial, Government, and Private auction gazette notices will appear here upon statutory certification. Call{' '}
              <strong className="text-slate-700 dark:text-slate-300">0548517277 / 0558314744</strong> for auction dates and lot viewings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredLots.map((lot) => (
              <div
                key={lot.id}
                className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-52 bg-slate-200 dark:bg-slate-800">
                    <Image
                      src={lot.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                      alt={lot.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
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
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2">
                      {lot.title}
                    </h3>

                    {lot.category === 'JUDICIAL' && (
                      <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 text-[11px] text-rose-800 dark:text-rose-300 font-mono">
                        Suit: {lot.courtCaseNumber || 'HC/ACR/COMM/2026/049'}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2">{lot.conditionNotes}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Starting Bid:</span>
                    <p className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatGHS(lot.startingBidGhs)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setInquiryModalItem({ title: `${lot.lotNumber}: ${lot.title}`, type: 'AUCTION_LOT' })}
                  >
                    Register to Bid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Online Paystack Deposit Banner */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              Online Payments Powered by Paystack &amp; Hubtel
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Pay Vehicle &amp; Auction Reservation Deposits Online
            </h2>
            <p className="text-sm text-indigo-100">
              Secure your lot or showroom vehicle instantly with Ghana Cards, MTN/Vodafone MoMo, and Visa/Mastercard.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link href="/showroom">
              <Button size="lg" variant="secondary" icon={<CreditCard className="h-5 w-5" />}>
                Pay Reservation Deposit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      {inquiryModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setInquiryModalItem(null)}
          title={`Inquire & Register Interest`}
          subtitle={`Particulars: ${inquiryModalItem.title}`}
          maxWidth="md"
        >
          {isInquirySubmitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Inquiry Successfully Logged!
              </h3>
              <p className="text-xs text-slate-500">
                Our sales team has received your inquiry into the AmenDesk CRM pipeline. We will call you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Nana Kwesi"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+233 24 XXX XXXX"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Message / Bid Offer</label>
                <textarea
                  rows={2}
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="I would like to schedule a viewing / confirm lot condition..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setInquiryModalItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" icon={<Send className="h-4 w-4" />}>
                  Submit Inquiry
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

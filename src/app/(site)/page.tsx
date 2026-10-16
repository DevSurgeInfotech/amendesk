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
import { syncEngine } from '@/lib/sync/syncEngine';
import {
  Gavel,
  Car,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Fuel,
  CreditCard,
  Send,
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
      // Deduplicate Customer: check if client already exists by phone or email
      const existingCustomer = await db.customers
        .filter(
          (c) =>
            c.phone.trim() === inquiryPhone.trim() ||
            (Boolean(inquiryEmail) && c.email.toLowerCase() === inquiryEmail.toLowerCase())
        )
        .first();

      const noteText = `Inquiry on ${inquiryModalItem?.title} (${inquiryModalItem?.type}): ${inquiryNotes || 'No notes'}`;

      if (existingCustomer) {
        const updatedNotes = existingCustomer.notes
          ? `${existingCustomer.notes}\n---\n${noteText}`
          : noteText;
        await db.customers.update(existingCustomer.id, {
          notes: updatedNotes,
        });
        await syncEngine.queueMutation('customers', existingCustomer.id, 'UPDATE', {
          notes: updatedNotes,
        });
      } else {
        const customerId = `cust-${Date.now()}`;
        const customer = {
          id: customerId,
          fullName: inquiryName,
          phone: inquiryPhone,
          email: inquiryEmail || 'web-inquiry@amenmartgh.com',
          ghanaCardNumber: 'PENDING_ONLINE_KYC',
          address: 'Website Online Inquiry',
          customerType: 'INDIVIDUAL' as const,
          kycVerified: false,
          notes: noteText,
          createdAt: new Date().toISOString(),
        };

        await db.customers.add(customer);
        await syncEngine.queueMutation('customers', customerId, 'CREATE', customer);
      }

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
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 border-b border-slate-200/80 pt-16 pb-24 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Official Government &amp; Judicial Service Auctioneers</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              Ghana&apos;s Foremost Asset Auction House &amp; Dealership Showroom
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Specialized disposal of court-ordered Judicial assets, official Government surplus fleet &amp; earthmoving machinery, direct luxury vehicle imports, and titled land parcels.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/auctions">
                <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />}>
                  View Upcoming Auctions
                </Button>
              </Link>
              <Link href="/showroom">
                <Button size="lg" variant="outline" icon={<Car className="h-5 w-5" />}>
                  Explore Car Showroom
                </Button>
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-slate-200 text-left">
              <div>
                <p className="text-2xl font-black text-indigo-600 font-mono">3 Categories</p>
                <p className="text-xs text-slate-600 font-medium">Judicial &bull; Govt &bull; Private</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-600 font-mono">100%</p>
                <p className="text-xs text-slate-600 font-medium">Clear Title &amp; Court Certified</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-600 font-mono">GH₵ 45M+</p>
                <p className="text-xs text-slate-600 font-medium">Assets Disposed Under Hammer</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-600 font-mono">14 Days</p>
                <p className="text-xs text-slate-600 font-medium">Standard Balance Window</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Lines Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            What We Do
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Four Core Pillars of Commercial Liquidation
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Every transaction is protected by statutory documentation, official receipts, and AML KYC diligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Pillar 1: Judicial */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Judicial Service Auctions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Court-ordered sheriff auctions on behalf of the Judicial Service of Ghana. High Court writ certifications, immovable titles, and executive vehicles.
            </p>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>View Court Notices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 2: Government */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Gavel className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Government Fleet Disposals
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Official surplus disposal for Ministries, Departments &amp; Agencies. Heavy construction plants, earthmoving backhoes, utility pickups, and equipment.
            </p>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Explore Fleet Lots</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 3: Dealership */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <Car className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Car Dealership Showroom
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct-sale imported vehicle showroom at Spintex Road. Inspected SUVs, sedans, and commercial haulers with online deposit reservations.
            </p>
            <Link
              href="/showroom"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Browse Showroom</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 4: Land & Property */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Titled Land &amp; Properties
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct parcel sales in beachfront, residential gated, and commercial enclaves. Verified cadastral survey plans and Lands Commission clearances.
            </p>
            <Link
              href="/land"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>View Land Parcels</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Showroom Section */}
      <section className="bg-slate-100 dark:bg-slate-900/60 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Direct Dealership
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Spintex Showroom Stock
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCars.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredLots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
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
              Secure your lot or showroom vehicle instantly with Ghana Cards, MTN/Vodafone MoMo, and Visa/Mastercard. All online payments route through Dev Surge-managed escrow with instant receipt generation.
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

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
import { HeroKpis } from '@/components/site/HeroKpis';
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
  Award,
  Globe2,
  Building2,
  TrendingUp,
  Layers,
  Sparkles,
  Users2,
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
          email: inquiryEmail || 'amenmart2291@gmail.com',
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
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-14 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6">
        {/* Subtle decorative radial grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-12 sm:space-y-14">
          {/* Top: 2-Column Hero Header & Authority Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline, Bio & Primary CTAs */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Amen Mart Auctioning Services &bull; Licensed by Ghana Auctioneers Association</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                A Best and Trusted Name in Ghana&apos;s Auction Industry
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                When it comes to acquiring valuable assets through competitive bidding, Amen Mart Auctioning Services stands out as one of Ghana&apos;s best auctioneers. Led by Managing Director <strong>Dr. Francis Kwaku Yeboah</strong>, the company has earned a solid reputation over the past decade by delivering reliable, professional auction services for both buyers and sellers across the country.
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
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
                <Link href="/about">
                  <Button size="lg" variant="outline" icon={<Award className="h-5 w-5" />}>
                    About Dr. Yeboah &amp; Firm
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: High-Trust Executive Verification & Accreditation Card */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="surface-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-black text-lg shadow-md ring-2 ring-indigo-100 dark:ring-indigo-950">
                      FY
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Dr. Francis Kwaku Yeboah
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Managing Director &bull; GAA
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Desk
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Approved by the <strong>Auctioneers Registration Board</strong></span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Recognized under the <strong>Ministry of the Interior</strong></span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Judicial &amp; constitutional disposals under Ghana&apos;s Constitution</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Headquarters in Accra</span>
                  <Link
                    href="/about"
                    className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Firm Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators (KPIs) Trust Bar - Full-Width of max-w-7xl */}
          <div className="pt-4 sm:pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
            <HeroKpis />
          </div>
        </div>
      </section>

      {/* Auctions Near Me & Real-Time Online Bidding Hub */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Auctions Near Me in Accra */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Looking for &quot;Auctions Near Me&quot;?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you&apos;re searching for &quot;auctions near me&quot; in Ghana, Amen Mart Auctioning Services should be your first stop. Strategically located in Accra, our auction house serves as a dynamic hub for asset auctions—from vehicles and industrial equipment to real estate and collectibles.
            </p>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline pt-1"
            >
              <span>Accra Live Auctions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 2: Ghana's Booming Market & GAA Licensing */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ghana&apos;s Auction Market Is Booming
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auctions are an increasingly popular method for buying and selling goods in Ghana, offering a structured, transparent alternative to traditional sales. As licensed auctioneers affiliated with the Ghana Auctioneers Association, we ensure every auction meets the highest standards of legality, fairness, and accountability.
            </p>
            <Link
              href="/about"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline pt-1"
            >
              <span>Learn About GAA Affiliation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Card 3: Bid From Anywhere Online */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Globe2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Bid From Anywhere Online
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Recognizing the evolving needs of clients, Amen Mart also offers online auction services. This allows participants from across Ghana—and even internationally—to join auctions in real time. Our secure, user-friendly bidding platform ensures safe and convenient engagement anywhere.
            </p>
            <Link
              href="/auctions"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline pt-1"
            >
              <span>Explore Online Lots</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Thousands Trust Amen Mart Auctioning Services Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="surface-card bg-gradient-to-br from-white via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Official Credentials &bull; Ghana Auctioneers Association</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Why Thousands Trust Amen Mart Auctioning Services
            </h2>
            <p className="text-xs text-slate-500">
              Upholding the highest standards of legality, fairness, and accountability under the guidance of Dr. Francis Kwaku Yeboah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Licensed Professionals</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fully certified and recognized by the Ghana Auctioneers Association, ensuring regulatory compliance and professional integrity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Diverse Auction Offerings</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                From real estate and vehicles to equipment and collectibles, Amen Mart handles a wide range of high-value assets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Experienced Leadership</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Under the guidance of Dr. Francis Kwaku Yeboah the company brings years of expertise and insight to every auction.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Accessible Locations</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Regular auctions held in Accra and other major cities, with online bidding options available for broader reach.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <Users2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Client-Centered</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Both buyers and sellers enjoy a smooth, transparent process tailored to meet their financial and asset goals.
              </p>
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
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <Car className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Car Dealership Showroom
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct-sale imported vehicle showroom. Inspected SUVs, sedans, and commercial haulers with online deposit reservations.
            </p>
            <Link
              href="/showroom"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Browse Showroom</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pillar 4: Property Auctions Made Easy */}
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Property Auctions Made Easy
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Residential homes, commercial buildings, and titled land parcels. Verified listings, cadastral site plans, Lands Commission clearances, and high-visibility buyer-seller matching.
            </p>
            <Link
              href="/properties"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <span>Explore Verified Properties</span>
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

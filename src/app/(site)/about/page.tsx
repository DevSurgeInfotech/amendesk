import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Gavel,
  ShieldCheck,
  Building2,
  Globe2,
  MapPin,
  Award,
  Users2,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Phone,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About Us — Amen Mart Auctioning Services | Approved by Auctioneers Registration Board & Ministry of the Interior',
  description:
    'Amen Mart is an Auctioning Service, approved by the Auctioneers Registration Board and the Ministry of the Interior to offer sale of Properties under the legal means of Ghana’s Constitution. Led by Dr. Francis Kwaku Yeboah.',
};

const trustPillars = [
  {
    icon: ShieldCheck,
    title: 'Statutory & Licensed Authority',
    description:
      'Approved by the Auctioneers Registration Board and the Ministry of the Interior, and recognized by the Ghana Auctioneers Association, executing property and asset sales under the legal means of Ghana’s Constitution.',
  },
  {
    icon: Layers,
    title: 'Diverse Auction Offerings',
    description:
      'From verified real estate and direct luxury vehicles to heavy industrial equipment, government fleet disposals, and rare collectibles, we handle high-value assets across all classes.',
  },
  {
    icon: Award,
    title: 'Experienced Leadership',
    description:
      'Under the strategic guidance of Dr. Francis Kwaku Yeboah, our company brings over a decade of proven auctioneering insight, valuation mastery, and trusted buyer-seller mediation.',
  },
  {
    icon: MapPin,
    title: 'Accessible Locations & Formats',
    description:
      'Regular live auction events organized in Accra and major Ghanaian cities, complemented by our cutting-edge online bidding portal for nationwide and international reach.',
  },
  {
    icon: Users2,
    title: 'Client-Centered Approach',
    description:
      'Whether you are a seasoned investor, a first-time buyer, or a seller looking to unlock peak value from your assets, our smooth and transparent process is tailored to your goals.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 border-b border-slate-200/80 pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Auctioneers Registration Board &bull; Ministry of the Interior &bull; GAA</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              About Amen Mart Auctioning Services
            </h1>
            <p className="text-lg sm:text-xl text-slate-800 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 dark:text-slate-200 py-3 rounded-r-xl">
              Amen Mart is an Auctioning Service, approved by the Auctioneers Registration Board and the Ministry of the Interior to offer sale of Properties under the legal means of Ghana&apos;s Constitution.
            </p>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              When it comes to acquiring valuable assets through competitive bidding, Amen Mart Auctioning Services stands out as one of Ghana&apos;s best auctioneers. Led by Managing Director <strong>Dr. Francis Kwaku Yeboah</strong>, the company has earned a solid reputation over the past decade by delivering reliable, professional auction services for both buyers and sellers across the country.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/auctions">
              <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />}>
                View Upcoming Auctions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" icon={<Phone className="h-5 w-5" />}>
                Contact Leadership &amp; Office
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Leadership Profile: Dr. Francis Kwaku Yeboah */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="surface-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 space-y-4 text-center lg:text-left">
            <div className="w-28 h-28 mx-auto lg:mx-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-950">
              FY
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Dr. Francis Kwaku Yeboah
              </h2>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Managing Director &amp; Principal Auctioneer
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Ghana Auctioneers Association (GAA) &bull; 10+ Years Licensed Leadership
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
            <p>
              Under the visionary leadership of <strong>Dr. Francis Kwaku Yeboah</strong>, Amen Mart Auctioning Services has grown from a specialized auction desk into one of the country&apos;s most sought-after asset auction houses. Over the past decade, Dr. Yeboah has steered countless public and private disposals, instilling unmatched discipline, procedural accuracy, and public trust.
            </p>
            <p>
              Every auction—whether a High Court sheriff liquidation, a nationwide ministerial fleet surplus disposal, or an executive private property sale—benefits from Dr. Yeboah&apos;s deep legal knowledge, comprehensive market insight, and unwavering commitment to client value.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Approved by Auctioneers Registration Board &amp; Ministry of the Interior
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Affiliated with Ghana Auctioneers Association (GAA)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sale of Properties under Ghana&apos;s Constitution
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Full AML KYC &amp; Title Diligence
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ghana's Auction Market is Booming & Accra Auctions */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Booming Market */}
          <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Ghana&apos;s Auction Market Is Booming
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Auctions are becoming an increasingly popular method for buying and selling goods in Ghana, offering a structured and efficient alternative to traditional sales. Amen Mart has been a driving force in this trend, upholding best practices in every transaction. As licensed auctioneers affiliated with the <strong>Ghana Auctioneers Association</strong>, the firm ensures every auction meets the highest standards of legality, fairness, and accountability.
            </p>
          </div>

          {/* Card 2: Accra Auctions & Auctions Near Me */}
          <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Looking for &quot;Auctions Near Me&quot;? Start in Accra
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              If you&apos;re searching for &quot;auctions near me&quot; in Ghana, Amen Mart Auctioning Services should be your first stop. Strategically located in Accra, this auction house serves as a dynamic hub for asset auctions—from vehicles and industrial equipment to real estate and collectibles.
            </p>
            <p className="text-xs text-slate-500">
              For those based in the capital, <em>&quot;Auction Accra&quot;</em> is a phrase to remember. Amen Mart frequently organizes live auctions in Accra, making it easy for residents to attend and participate in an energetic, rewarding environment powered by Dr. Yeboah and his team.
            </p>
          </div>
        </div>
      </section>

      {/* Online Auctions & Property Auctions */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Online Bidding */}
          <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Globe2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Bid From Anywhere with Online Auctions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Recognizing the evolving needs of clients, Amen Mart also offers online auction services. This allows participants from across Ghana—and even internationally—to join auctions in real time. With a secure and user-friendly online bidding platform, Amen Mart ensures participants engage in the auction process safely and conveniently, regardless of location.
            </p>
            <Link
              href="/auctions"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
            >
              <span>Explore Digital Auction Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Property Auctions Made Easy */}
          <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Property Auctions Made Easy
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              One of Amen Mart&apos;s key areas of expertise is in property auctions. Whether you&apos;re in the market for residential homes, commercial buildings, or land, the company provides a wide array of verified listings. Each property is presented with comprehensive details—including cadastral site plans and Lands Commission verifications—to help buyers make informed choices. For sellers, our extensive network ensures maximum visibility and engagement from serious buyers.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
            >
              <span>View Property Listings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars: Why Thousands Trust Amen Mart Auctioning Services */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Uncompromising Standards
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Why Thousands Trust Amen Mart Auctioning Services
          </h2>
          <p className="text-xs text-slate-500">
            A solid reputation built over a decade of delivering professional auction services across Ghana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {trustPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Partner with Ghana&apos;s Premier Auctioneers</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Ready to Buy or Consign with Amen Mart?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Whether you are a seasoned investor, a first-time buyer, or a seller looking to unlock value from your assets, Amen Mart Auctioning Services offers a trusted, efficient, and professional auction experience in Ghana.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link href="/auctions">
              <Button size="lg" variant="primary">
                Browse Auctions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                Consign Your Assets
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

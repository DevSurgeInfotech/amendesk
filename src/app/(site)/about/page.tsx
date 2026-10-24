import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Gavel,
  ShieldCheck,
  Globe2,
  CheckCircle2,
  Phone,
  Layers,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About Us — Amen Mart Auctioning Services | Approved by Auctioneers Registration Board & Ministry of the Interior',
  description:
    'Amen Mart is an Auctioning Service, approved by the Auctioneers Registration Board and the Ministry of the Interior to offer sale of Properties under the legal means of Ghana’s Constitution. Led by Dr. Francis Kwaku Yeboah.',
};

const coreStrengths = [
  {
    icon: ShieldCheck,
    title: 'Statutory & GAA Licensed',
    description:
      'Approved by the Auctioneers Registration Board, the Ministry of the Interior, and the Ghana Auctioneers Association.',
  },
  {
    icon: Layers,
    title: 'Multi-Asset Expertise',
    description:
      'Handling Judicial, Government, and Private disposals across vehicles, industrial plant, land, and commercial real estate.',
  },
  {
    icon: Globe2,
    title: 'Accra Yard & Online Bidding',
    description:
      'Regular live floor auctions in Accra complemented by digital bidding for nationwide and international buyers.',
  },
  {
    icon: FileCheck2,
    title: 'Verified Titles & Clearances',
    description:
      'Every lot is backed by High Court writs, Lands Commission site plans, or official customs and waybill documentation.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-14 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-14 sm:pt-16 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Auctioneers Registration Board &bull; Ministry of the Interior &bull; GAA</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              About Amen Mart Auctioning Services
            </h1>
            <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 py-3 rounded-r-xl">
              Amen Mart is a licensed Auctioning Service approved by the Auctioneers Registration Board and the Ministry of the Interior to conduct property and asset sales under the laws of Ghana.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/auctions">
              <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />}>
                View Upcoming Auctions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" icon={<Phone className="h-5 w-5" />}>
                Contact Office
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Leadership Profile: Dr. Francis Kwaku Yeboah */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="surface-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 space-y-3 text-center lg:text-left">
            <div className="w-24 h-24 mx-auto lg:mx-0 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-950">
              FY
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Dr. Francis Kwaku Yeboah
              </h2>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Managing Director &amp; Principal Auctioneer
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Ghana Auctioneers Association (GAA) &bull; 10+ Years Leadership
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
            <p>
              Led by Managing Director <strong>Dr. Francis Kwaku Yeboah</strong>, Amen Mart Auctioning Services has built a decade-long track record delivering transparent, compliant valuations and asset liquidations for courts, government ministries, financial institutions, and private sellers across Ghana.
            </p>
            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Auctioneers Registration Board Approved
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Ministry of the Interior Authorized
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Ghana Auctioneers Association (GAA) Member
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Full AML KYC &amp; Title Diligence
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Strengths Grid */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Why Choose Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Built on Compliance &amp; Transparency
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {coreStrengths.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Work With Us</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Ready to Bid or Consign Assets?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Browse our active auction notices or speak with our Accra office to schedule an asset valuation.
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
                Consign Assets
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  ShieldCheck,
  Calendar,
  Tag,
  ArrowRight,
  Gavel,
  Phone,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface NewsItem {
  id: string;
  title: string;
  category: 'STATUTORY' | 'AUCTION_NOTICE' | 'CORPORATE' | 'COMMUNITY';
  date: string;
  summary: string;
  content: string[];
  author: string;
  badgeText: string;
  isPinned?: boolean;
}

const newsData: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Amen Mart Secures 2026 Statutory Compliance Re-Certification from Auctioneers Registration Board & Ministry of the Interior',
    category: 'STATUTORY',
    date: 'October 12, 2026',
    badgeText: 'Statutory Certification',
    author: 'Legal & Compliance Desk',
    isPinned: true,
    summary:
      'The Auctioneers Registration Board and the Ministry of the Interior have officially validated Amen Mart Auctioning Services’ operating credentials under the legal auspices of Ghana’s Constitution.',
    content: [
      'Amen Mart Auctioning Services has officially concluded its comprehensive statutory compliance audit, securing full re-certification and licensing endorsements from both the Auctioneers Registration Board and the Ministry of the Interior for the 2026 fiscal cycle.',
      'Under the leadership of Managing Director Dr. Francis Kwaku Yeboah, Amen Mart continues to operate in strict compliance with the Auction Sales Law (PNDCL 230), guaranteeing buyers and consignors complete legal certainty across all private, government, and judicial auction proceedings.',
      '“Statutory compliance is the cornerstone of public confidence in Ghana’s auction industry,” remarked Dr. Yeboah. “Whether we are adjudicating a court-ordered asset liquidation or managing private corporate fleet divestments, our bidders can proceed with the absolute assurance that every lot has unblemished legal title.”',
    ],
  },
  {
    id: 'news-2',
    title: 'Expansion of Commercial Vehicle & Equipment Holding Yard at Gbawe, Flower Junction',
    category: 'CORPORATE',
    date: 'September 28, 2026',
    badgeText: 'Infrastructure Update',
    author: 'Operations Directorate',
    summary:
      'Amen Mart has completed the phase two expansion of its primary asset inspection facility in Gbawe, Accra, doubling vehicle staging capacity and adding round-the-clock secure holding bays.',
    content: [
      'To accommodate the escalating volume of corporate fleet turnovers and state-directed disposals, Amen Mart has finalized its modern logistics and staging facility at Flower Junction, Gbawe, Accra.',
      'The upgraded facility features 24/7 biometric surveillance, high-capacity vehicle inspection ramps, dedicated diagnostic bays for heavy machinery, and an expanded customer reception pavilion.',
      'Prospective buyers wishing to inspect auction-ready vehicles, prime construction gear, or dealership imports may now visit the Gbawe yard Monday through Saturday from 8:00 AM to 5:00 PM.',
    ],
  },
  {
    id: 'news-3',
    title: 'Public Auction Gazetted: Judicial Service Court-Ordered Fleet & Movable Property Sale',
    category: 'AUCTION_NOTICE',
    date: 'September 15, 2026',
    badgeText: 'Gazetted Judicial Sale',
    author: 'Court Bailiff & Sheriff Liaison',
    summary:
      'Notice is hereby given of an upcoming Judicial Auction of court-attached motor vehicles, earthmoving machinery, and commercial assets pursuant to High Court enforcement orders.',
    content: [
      'Under the warrant and direction of the Registrar and High Court Sheriff, Amen Mart Auctioning Services has scheduled a high-volume judicial auction at the Gbawe Auction Yard.',
      'Assets listed for sale include commercial utility trucks, sedans, industrial diesel generators, and office fixtures. Per statutory judicial rules, a 25% non-refundable deposit is required at the drop of the hammer, with the remaining balance due within fourteen (14) calendar days.',
      'Court disposal documents and certified auction catalogs are available for review at our front desk. Full inspection begins five days prior to the live hammer date.',
    ],
  },
  {
    id: 'news-4',
    title: 'Amen Mart Recognized by Ghana Auctioneers Association (GAA) for Rigorous AML/KYC Practices',
    category: 'COMMUNITY',
    date: 'August 22, 2026',
    badgeText: 'Industry Accolade',
    author: 'Corporate Communications',
    summary:
      'The Ghana Auctioneers Association has recognized Amen Mart’s mandatory Ghana Card identification and transparent banking settlement protocols as benchmark industry standards.',
    content: [
      'At the 2026 Ghana Auctioneering & Real Estate Colloquium, Amen Mart received special commendation for its rigorous anti-money laundering (AML) controls and seamless Ghana Card KYC verification pipeline.',
      'Through its integrated AmenDesk ERP infrastructure, all high-value bidder registrations, bank drafts, and MoMo deposits are reconciled in real time, preventing fraud and safeguarding legitimate asset purchasers.',
      'Amen Mart remains dedicated to elevating Ghanaian auctioneering practices in line with global best practices and national financial regulations.',
    ],
  },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  const categories = [
    { label: 'All News', value: 'ALL' },
    { label: 'Statutory & Licensing', value: 'STATUTORY' },
    { label: 'Auction Gazettes', value: 'AUCTION_NOTICE' },
    { label: 'Corporate Updates', value: 'CORPORATE' },
    { label: 'Industry & Community', value: 'COMMUNITY' },
  ];

  const filteredNews = newsData.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 border-b border-slate-200/80 pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs">
            <Newspaper className="h-4 w-4 text-indigo-600" />
            <span>Official Press &amp; Media Desk</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              News &amp; Official Press Releases
            </h1>
            <p className="text-lg sm:text-xl text-slate-800 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 dark:text-slate-200 py-3 rounded-r-xl">
              Stay informed on statutory compliance announcements, gazetted auction notices, corporate milestones, and regulatory updates from Amen Mart.
            </p>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              As an auctioning house authorized by the Ministry of the Interior and the Auctioneers Registration Board, Amen Mart publishes all official notices, legal gazettes, and corporate developments transparently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/auctions">
              <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />}>
                Browse Auction Notices
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" icon={<Phone className="h-5 w-5" />}>
                Media Inquiries &amp; Public Relations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search news releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                item.isPinned
                  ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={item.category === 'STATUTORY' ? 'info' : 'default'}>
                    {item.badgeText}
                  </Badge>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <h3
                  className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => setActiveArticle(item)}
                >
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Tag className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{item.author}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveArticle(item)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <span>Read Full Notice</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Newspaper className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching news notices found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or category filter.</p>
          </div>
        )}

        {/* Official Statutory Notice Footer Callout */}
        <div className="surface-card bg-indigo-50/70 dark:bg-slate-800/80 rounded-2xl border border-indigo-200/80 dark:border-slate-700 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Official Government &amp; Judicial Gazettes
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All statutory auction announcements comply with Act 230 and undergo mandatory national newspaper publication.
              </p>
            </div>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button size="sm" variant="primary">
              Subscribe to Auction Gazettes
            </Button>
          </Link>
        </div>
      </section>

      {/* Article Detail Modal */}
      {activeArticle && (
        <Modal
          isOpen={Boolean(activeArticle)}
          onClose={() => setActiveArticle(null)}
          title={activeArticle.title}
          maxWidth="2xl"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Badge variant="info">{activeArticle.badgeText}</Badge>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{activeArticle.date}</span>
                <span>&bull;</span>
                <span>{activeArticle.author}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeArticle.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveArticle(null)}>
                Close Notice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

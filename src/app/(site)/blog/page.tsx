'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Gavel,
  Car,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface BlogPost {
  id: string;
  title: string;
  category: 'AUCTION_RULES' | 'VEHICLE_BUYING' | 'LAND_PROPERTY' | 'VALUATION';
  categoryLabel: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  summary: string;
  paragraphs: string[];
  keyTakeaways: string[];
}

const blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'The Complete Guide to Bidding in Judicial & Sheriff Auctions in Ghana',
    category: 'AUCTION_RULES',
    categoryLabel: 'Judicial Auctions',
    date: 'October 18, 2026',
    readTime: '6 min read',
    author: 'Dr. Francis Kwaku Yeboah',
    authorRole: 'Licensed Managing Auctioneer',
    summary:
      'Understanding the statutory rules governing court-attached property, the 25% mandatory deposit at the hammer drop, and the 14-day final settlement requirement under Ghana law.',
    paragraphs: [
      'Judicial auctions represent some of the most lucrative opportunities for smart asset acquisition in Ghana, ranging from prime commercial vehicles to land and luxury homes. However, bidding in a court-directed auction requires a thorough grasp of the statutory legal framework established by the Courts Act and PNDCL 230.',
      'Unlike private auctions where consignor reserve prices are negotiable, judicial auctions proceed under strict court enforcement orders. Every lot sold has been formally attached by the Sheriff of the High Court or Circuit Court. When the auctioneer’s hammer falls, a legally binding contract is established instantly between the bidder and the court.',
      'The primary financial condition in a judicial auction is the strict payment structure: a non-negotiable 25% deposit must be paid immediately in cash, certified bank draft, or verified mobile money at the venue. The successful bidder then has exactly fourteen (14) calendar days to settle the remaining 75% balance. Failure to clear the balance within this timeframe can lead to forfeiture of the initial deposit and lot re-auctioning.',
      'Upon full settlement, Amen Mart issues the statutory Certificate of Sale and a formal Waybill for movable assets, or an endorsed Court Transfer Deed for immovable properties, enabling immediate and unencumbered change of ownership with the Driver and Vehicle Licensing Authority (DVLA) or Lands Commission.',
    ],
    keyTakeaways: [
      '25% non-refundable deposit required at the drop of the hammer.',
      'Exact 14-day statutory settlement window for the remaining balance.',
      'All assets sold with legal protection of a High Court execution warrant.',
      'Official Certificate of Sale guarantees unencumbered title registration.',
    ],
  },
  {
    id: 'post-2',
    title: 'Pre-Purchase Vehicle Inspection: What to Check at the Gbawe Yard Before the Hammer Falls',
    category: 'VEHICLE_BUYING',
    categoryLabel: 'Vehicle Buying',
    date: 'October 05, 2026',
    readTime: '5 min read',
    author: 'Amen Mart Fleet Technical Team',
    authorRole: 'Automotive Valuation Inspectors',
    summary:
      'A practical inspection checklist for imported vehicles and corporate fleet disposals: checking chassis numbers, transmission health, and Ghana Customs duty clearance documents.',
    paragraphs: [
      'At Amen Mart, prospective vehicle buyers are always encouraged to attend pre-auction inspection days at our Gbawe yard. Inspecting a vehicle prior to auction day allows you to set your maximum bid with total financial confidence.',
      'Begin by cross-referencing the physical Chassis / VIN plate on the vehicle against the auction catalog and ICUMS customs documentation. Confirm that the stamping on the firewall or door pillar matches the lot manifest exactly. At Amen Mart, our ERP system logs every vehicle with its unique VIN to ensure total tracking traceability.',
      'Second, inspect fluid levels and mechanical integrity. Our yard technicians permit bidders to bring licensed mechanics equipped with OBD-II diagnostic scanners. Pay careful attention to engine cold-starts, smoke color, transmission fluid condition, and signs of structural chassis repairs.',
      'Lastly, review the vehicle’s customs and duty clearance status. At Amen Mart, all dealership showroom cars and auction lots carry clearly marked documentation indicating whether Ghana Customs (GRA) import duties are fully discharged or payable by the bidder.',
    ],
    keyTakeaways: [
      'Cross-reference chassis numbers against the official auction catalog.',
      'Bring a certified technician with an OBD-II scanner on public inspection days.',
      'Verify GRA customs documentation and duty clearance status upfront.',
      'Factor in reconditioning costs before setting your maximum bidding threshold.',
    ],
  },
  {
    id: 'post-3',
    title: 'Navigating Land Title Verification in Greater Accra: Site Plans, Indentures & Due Diligence',
    category: 'LAND_PROPERTY',
    categoryLabel: 'Land & Property',
    date: 'September 22, 2026',
    readTime: '7 min read',
    author: 'Legal & Realty Desk',
    authorRole: 'Amen Mart Realty Specialists',
    summary:
      'Avoid land disputes and boundary fraud: step-by-step guidance on conducting Lands Commission official searches, verifying cadastre site plans, and executing statutory deeds of transfer.',
    paragraphs: [
      'Acquiring land in the Greater Accra Region requires vigilance, legal precision, and verifiable documentation. At Amen Mart, our direct Land and Property sales line operates under strict due-diligence protocols to protect buyers from boundary overlap and family land conflicts.',
      'The foundational document of any legitimate land parcel is a licensed cadastral site plan, certified and stamped by an official surveyor from the Survey and Mapping Division of the Lands Commission. Never commit deposit funds on hand-drawn sketches or unregistered paper drafts.',
      'Before issuing reservation deposits, Amen Mart’s legal desk coordinates an official search at the Lands Commission (Public and Vested Lands Management Division, Land Registration Division, and Survey & Mapping Division). This search verifies the true allodial titleholders and confirms zero pending litigation or encumbrances.',
      'Once a purchase is finalized through Amen Mart, buyers receive a certified Indenture and Transfer Agreement prepared by licensed solicitors, backed by proof of payment and recorded within the AmenDesk accounting ledger for total auditability.',
    ],
    keyTakeaways: [
      'Demand a certified cadastral site plan with official Lands Commission coordinates.',
      'Conduct a tripartite official search across all Lands Commission divisions.',
      'Ensure all payments are receipted through formal multi-mode banking channels.',
      'Receive solicitor-drafted indentures for unencumbered title registration.',
    ],
  },
  {
    id: 'post-4',
    title: 'Movable vs. Immovable Assets: How Disposal Documentation and Rights Differ',
    category: 'VALUATION',
    categoryLabel: 'Valuation & Legal',
    date: 'September 10, 2026',
    readTime: '4 min read',
    author: 'Dr. Francis Kwaku Yeboah',
    authorRole: 'Managing Director',
    summary:
      'Why movable assets like vehicles and machinery receive official Waybills for yard gate release, while immovable real estate requires statutory transfer deeds and indenture tracking.',
    paragraphs: [
      'In auctioneering and asset disposal, the legal distinction between movable and immovable property dictates the entire post-sale document workflow. Bidders frequently ask why vehicle buyers receive a Waybill while land buyers receive an Indenture or Court Transfer Document.',
      'Movable property—such as automobiles, industrial generators, earthmoving equipment, and office furnishings—physically leaves our Gbawe facility. For security, compliance, and gate pass verification, our ERP generates a tamper-evident Waybill detailing chassis numbers, item descriptions, consignor details, and carrier identification.',
      'Immovable property—such as residential residences, commercial plots, and titled land parcels—does not move. Consequently, ownership transfer is governed by real property law, requiring statutory deeds of conveyance, site plan attachments, and land title certificates.',
      'Understanding this distinction ensures that buyers arrive with the appropriate logistics support: vehicle buyers should arrange transport or driving permits, while property buyers should engage legal counsel for land registry filings.',
    ],
    keyTakeaways: [
      'Movable assets require an official Waybill for gate release and transit authorization.',
      'Immovable assets require formal Deeds of Conveyance and cadastral site plans.',
      'All transactions funnel through the same secure cash office and verified receipts.',
    ],
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  const categories = [
    { label: 'All Guides', value: 'ALL' },
    { label: 'Judicial Auctions', value: 'AUCTION_RULES' },
    { label: 'Vehicle Buying', value: 'VEHICLE_BUYING' },
    { label: 'Land & Property', value: 'LAND_PROPERTY' },
    { label: 'Valuation & Legal', value: 'VALUATION' },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'ALL' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 border-b border-slate-200/80 pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold shadow-2xs">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span>Amen Mart Insights &amp; Knowledge Hub</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Auction &amp; Real Estate Guides
            </h1>
            <p className="text-lg sm:text-xl text-slate-800 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 dark:text-slate-200 py-3 rounded-r-xl">
              Practical guides, buyer checklists, statutory auction rules, and vehicle valuation tips written by Ghana’s licensed auctioneering experts.
            </p>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Whether you are preparing to bid on a court-ordered auction lot, purchasing an imported vehicle, or investing in titled land in Accra, our expert articles provide the clarity and confidence you need.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/showroom">
              <Button size="lg" variant="primary" icon={<Car className="h-5 w-5" />}>
                Explore Vehicle Showroom
              </Button>
            </Link>
            <Link href="/auctions">
              <Button size="lg" variant="outline" icon={<Gavel className="h-5 w-5" />}>
                View Active Auction Notices
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Feed Section */}
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
              placeholder="Search guides & articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-indigo-400/50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="info">{post.categoryLabel}</Badge>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{post.date}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.readTime}</span>
                    </span>
                  </div>
                </div>

                <h3
                  className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug hover:text-indigo-600 transition-colors cursor-pointer"
                  onClick={() => setActivePost(post)}
                >
                  {post.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {post.summary}
                </p>

                {/* Key takeaways bullet preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Core Insights
                  </div>
                  <ul className="space-y-1">
                    {post.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {post.author}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {post.authorRole}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePost(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching articles found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or category filter.</p>
          </div>
        )}

        {/* Consultation Callout */}
        <div className="surface-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Need Professional Asset Valuation or Legal Consignment Advice?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Our licensed auctioneers and real estate appraisers provide statutory appraisals for court filings, bank collaterals, and private fleet disposals across Ghana.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact">
              <Button size="md" variant="primary">
                Book a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Guide Detail Modal */}
      {activePost && (
        <Modal
          isOpen={Boolean(activePost)}
          onClose={() => setActivePost(null)}
          title={activePost.title}
          maxWidth="2xl"
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap">
              <Badge variant="info">{activePost.categoryLabel}</Badge>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{activePost.date}</span>
                </span>
                <span>&bull;</span>
                <span>By {activePost.author} ({activePost.authorRole})</span>
              </div>
            </div>

            {/* Key Takeaways Box */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                Summary Takeaways
              </div>
              <ul className="space-y-1.5">
                {activePost.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Paragraphs */}
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activePost.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link href="/contact" onClick={() => setActivePost(null)}>
                <Button variant="outline" size="sm">
                  Speak to an Auctioneer
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => setActivePost(null)}>
                Close Guide
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Newspaper,
  ShieldCheck,
  Calendar,
  Tag,
  ArrowRight,
  Gavel,
  Phone,
  Search,
  Award,
  HeartHandshake,
  Landmark,
  Building2,
  Truck,
  FileText,
  Clock,
  Quote,
  CheckCircle2,
  Sparkles,
  Share2,
  Camera,
  Maximize2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface NewsImage {
  src: string;
  alt: string;
  caption: string;
}

interface NewsItem {
  id: string;
  title: string;
  thumbnailTitle: string;
  thumbnailKicker: string;
  category: 'STATUTORY' | 'AUCTION_NOTICE' | 'CORPORATE' | 'COMMUNITY' | 'GOVERNANCE';
  categoryLabel: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  badgeText: string;
  badgeVariant: 'success' | 'info' | 'warning' | 'purple' | 'default';
  gradient: string;
  iconName: 'Award' | 'ShieldCheck' | 'Gavel' | 'Truck' | 'Landmark' | 'Building2' | 'HeartHandshake' | 'FileText';
  isPinned?: boolean;
  images?: NewsImage[];
  summary: string;
  quote?: {
    text: string;
    speaker: string;
    title: string;
  };
  highlights: string[];
  content: string[];
}

const newsData: NewsItem[] = [
  {
    id: 'news-moga-award',
    title: 'Dr. Francis Kwaku Yeboah Conferred "Philanthropist of the Year" at Modern Gospel Awards (MOGA)',
    thumbnailTitle: 'MOGA Philanthropist of the Year',
    thumbnailKicker: 'HUMANITARIAN HONORS',
    category: 'COMMUNITY',
    categoryLabel: 'Philanthropy & Honors',
    date: 'October 18, 2026',
    readTime: '4 min read',
    author: 'Media & Public Relations Desk',
    authorRole: 'Corporate Communications Lead',
    badgeText: 'National MOGA Laureate',
    badgeVariant: 'success',
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    iconName: 'Award',
    isPinned: true,
    images: [
      {
        src: '/dr-francis-yeboah-moga-award.jpg',
        alt: 'Dr. Francis Kwaku Yeboah receiving MOGA Philanthropist of the Year Star Award',
        caption: 'Dr. Francis Kwaku Yeboah holding the MOGA Philanthropist of the Year Star Plaque alongside Amen Mart team members and delegates.',
      },
      {
        src: '/dr-francis-yeboah-moga-citation.jpg',
        alt: 'Official presentation of the framed MOGA Citation to Dr. Francis Kwaku Yeboah',
        caption: 'Official presentation of the framed MOGA Citation of Honour to Dr. Francis Kwaku Yeboah at the executive offices in Accra.',
      },
    ],
    summary:
      'Amen Mart CEO Dr. Francis Kwaku Yeboah has been honored at the prestigious Modern Gospel Awards (MOGA) at the GNAT Hall in Accra, receiving the Philanthropist of the Year citation for sustained community service, humanitarian giving, and youth empowerment.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Managing Director & Licensed Principal Auctioneer, Amen Mart',
      text: 'Auctioneering is not merely about asset valuation and liquidations; it is a sacred platform of public trust. When God blesses our enterprise, our highest duty is to reinvest those blessings into human lives, community healthcare, and youth education across Ghana.',
    },
    highlights: [
      'Conferred Philanthropist of the Year and honorary citation at the GNAT Hall in Accra.',
      'Honored across consecutive MOGA cycles (2024 citation and 2025 5th edition VIP guest).',
      'Celebrated for extensive community assistance across Kwashieman, Gbawe, and Greater Accra.',
      'Recognized for blending high-integrity commercial auctioneering with active social responsibility.',
    ],
    content: [
      'In a colourful and prestigious ceremony held at the GNAT Hall in Accra, the Chief Executive Officer and Managing Director of Amen Mart Auctioning Services, Dr. Francis Kwaku Yeboah (popularly known as Mr. Yeboah), was conferred with the distinguished "Philanthropist of the Year" award alongside an honorary citation of excellence at the Modern Gospel Awards (MOGA).',
      'The Modern Gospel Awards board praised Dr. Francis Kwaku Yeboah for his quiet yet profound contributions to humanity, commending his persistent financial sponsorships of youth education bursaries, emergency healthcare support for underprivileged families, and community development interventions across Accra and beyond.',
      'Dr. Yeboah, who has led Amen Mart since 2016 through thousands of transparent auction proceedings in conjunction with the courts and public institutions, dedicated the citation to his dedicated workforce and the countless Ghanaian families touched by their corporate social responsibility programs.',
      '“True success is measured not by how many auction gavels we strike, but by how many lives we uplift along the journey,” Dr. Yeboah remarked during his acceptance address. Amen Mart remains committed to setting benchmark standards both on the auction floor and within our host communities.',
    ],
  },
  {
    id: 'news-statutory-cert',
    title: 'Amen Mart Secures 2026 Statutory Compliance Re-Certification from Auctioneers Registration Board & Ministry of the Interior',
    thumbnailTitle: 'Act 230 Regulatory Endorsement',
    thumbnailKicker: 'STATUTORY GAZETTE',
    category: 'STATUTORY',
    categoryLabel: 'Statutory & Licensing',
    date: 'October 12, 2026',
    readTime: '3 min read',
    author: 'Legal & Compliance Directorate',
    authorRole: 'Statutory Counsel',
    badgeText: 'Ministry of the Interior Approved',
    badgeVariant: 'info',
    gradient: 'from-indigo-800 via-blue-900 to-slate-950',
    iconName: 'ShieldCheck',
    isPinned: false,
    summary:
      'The Auctioneers Registration Board and the Ministry of the Interior have reaffirmed Amen Mart Auctioning Services’ statutory operating credentials under the Auction Sales Law (PNDCL 230) and the Constitution of Ghana.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Principal Licensed Auctioneer',
      text: 'Statutory compliance is the bedrock of public confidence in Ghana’s auction industry. Whether we are adjudicating a court-ordered asset liquidation or managing private corporate fleet divestments, our bidders proceed with ironclad legal certainty.',
    },
    highlights: [
      'Full statutory re-certification under the Auction Sales Law (PNDCL 230).',
      'Joint approval from Auctioneers Registration Board and Ministry of the Interior.',
      'Active executive standing with the Ghana Auctioneers Association (GAA).',
      'Unbroken compliance record across Private, Government, and Judicial auctions.',
    ],
    content: [
      'Amen Mart Auctioning Services has officially concluded its annual statutory compliance evaluation, securing full re-certification and licensing endorsements from both the Auctioneers Registration Board and the Ministry of the Interior for the 2026 operating year.',
      'Under the stewardship of Managing Director Dr. Francis Kwaku Yeboah, Amen Mart continues to operate in rigorous conformity with the Auction Sales Law (PNDCL 230), guaranteeing buyers and consignors absolute legal title across movable (vehicles, plant, and machinery) and immovable (land and commercial buildings) assets.',
      'The re-certification confirms that Amen Mart satisfies all statutory insurance bonding requirements, escrow fiduciary standards, and standardized public gazetting mandates established by the Republic of Ghana.',
      'Bidders participating in Amen Mart auctions can inspect statutory licenses and certified gazette extracts at our Gbawe Flower Junction operational yard or request digital verification through our administrative desk.',
    ],
  },
  {
    id: 'news-judicial-court-fleet',
    title: 'Public Auction Gazetted: High Court Sheriff Court-Attached Commercial Fleet & Heavy Machinery Sale',
    thumbnailTitle: 'High Court Attached Fleet Sale',
    thumbnailKicker: 'COURT ENFORCEMENT',
    category: 'AUCTION_NOTICE',
    categoryLabel: 'Auction Gazettes',
    date: 'October 02, 2026',
    readTime: '5 min read',
    author: 'Court Bailiff & Sheriff Liaison',
    authorRole: 'Enforcement Operations Desk',
    badgeText: 'Gazetted Judicial Sale',
    badgeVariant: 'warning',
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
    iconName: 'Gavel',
    isPinned: false,
    summary:
      'Formal notice is hereby given of an upcoming Judicial Auction of High Court-attached motor vehicles, earthmoving machinery, and industrial commercial equipment at the Gbawe Yard pursuant to valid execution warrants.',
    quote: {
      speaker: 'High Court Enforcement Registry',
      title: 'Judicial Service Liaison',
      text: 'All assets attached under lawful execution warrants will be knocked down to the highest bidder in strict accordance with statutory judicial rules, guaranteeing immediate issuance of court disposal certificates.',
    },
    highlights: [
      'Mandatory 25% deposit at hammer fall (Cash, MoMo, or Certified Bank Draft).',
      'Strict 14-calendar-day statutory balance settlement window.',
      'Statutory Certificate of Sale and Court Transfer Waybill issued upon final settlement.',
      'Pre-auction asset inspection opens 5 days prior to live hammer date.',
    ],
    content: [
      'Under the warrant and direction of the Registrar and High Court Sheriff, Amen Mart Auctioning Services has published the statutory catalog for a major judicial liquidation scheduled at the Gbawe Auction Yard.',
      'Assets scheduled for public bidding include commercial haulage trucks, 4x4 utility pickups, heavy earthmoving equipment, diesel generating plants, and office furnishings attached in satisfaction of civil court judgments.',
      'In strict compliance with statutory judicial auction protocols, winning bidders must provide a 25% deposit upon the fall of the hammer. The remaining balance must be settled in full within fourteen (14) calendar days, after which official Certificates of Sale and High Court transfer documents are issued.',
      'Prospective bidders are invited to inspect lots at the Gbawe staging facility between 8:30 AM and 4:30 PM. Certified auction catalogs and VIN manifests may be downloaded or collected from the front cashier office.',
    ],
  },
  {
    id: 'news-gbawe-expansion',
    title: 'Dr. Francis Kwaku Yeboah Commissions Phase Two Staging Facility at Flower Junction, Gbawe',
    thumbnailTitle: 'Gbawe Staging Yard Expansion',
    thumbnailKicker: 'FACILITY LOGISTICS',
    category: 'CORPORATE',
    categoryLabel: 'Corporate Milestones',
    date: 'September 24, 2026',
    readTime: '4 min read',
    author: 'Operations Directorate',
    authorRole: 'Chief Logistics Officer',
    badgeText: 'Infrastructure Update',
    badgeVariant: 'info',
    gradient: 'from-cyan-800 via-blue-900 to-slate-900',
    iconName: 'Truck',
    isPinned: false,
    summary:
      'Amen Mart has finalized its multi-acre staging and inspection facility at Flower Junction, Gbawe, doubling vehicle capacity, adding 24/7 biometric security surveillance, and installing dedicated mechanical diagnostic bays.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Managing Director, Amen Mart',
      text: 'Our expanded Gbawe facility ensures that corporate fleets, judicial assets, and direct showroom imports are staged in secure, professional, and accessible conditions that dignify the Ghanaian auction experience.',
    },
    highlights: [
      'Staging capacity expanded to accommodate 150+ heavy trucks, earthmovers, and saloons.',
      'Equipped with modern vehicle diagnostic inspection ramps and OBD-II testing stations.',
      '24/7 biometric access control and continuous high-definition security surveillance.',
      'Air-conditioned customer bidding pavilion with integrated point-of-sale cash office.',
    ],
    content: [
      'To accommodate the escalating volume of corporate fleet turnovers, institutional disposals, and judicial attachments, Amen Mart Auctioning Services has officially unveiled Phase Two of its premier logistics yard at Flower Junction, Gbawe, Accra.',
      'The multi-acre facility includes heavy-duty concrete staging pads, high-capacity vehicle inspection ramps, dedicated diagnostic bays for heavy machinery, and an expanded customer reception pavilion capable of hosting hundreds of registered bidders comfortably.',
      'Security has been reinforced with round-the-clock biometric gate controls, night-vision perimeter surveillance, and armed security patrols to safeguard all consigned and court-attached movable property.',
      'Prospective buyers wishing to inspect auction-ready vehicles, construction machinery, or direct dealership imports are welcome to visit Monday through Saturday from 8:00 AM to 5:00 PM.',
    ],
  },
  {
    id: 'news-aml-kyc-digitization',
    title: 'Ghana Auctioneers Association (GAA) Commends Amen Mart for Pioneering Real-Time Bank Settlement & Digital KYC',
    thumbnailTitle: 'Ghana Card Real-Time Settlement',
    thumbnailKicker: 'FINTECH & KYC',
    category: 'GOVERNANCE',
    categoryLabel: 'Policy & Governance',
    date: 'September 11, 2026',
    readTime: '4 min read',
    author: 'Fintech & Banking Reconciliation Desk',
    authorRole: 'Head of Financial Governance',
    badgeText: 'GAA Benchmark',
    badgeVariant: 'purple',
    gradient: 'from-violet-800 via-purple-900 to-slate-950',
    iconName: 'Landmark',
    isPinned: false,
    summary:
      'At the National Auctioneering Symposium, GAA executive leadership praised Amen Mart’s proprietary AmenDesk ERP infrastructure for eliminating unreceipted cash handling through direct bank settlement and Ghana Card verification.',
    quote: {
      speaker: 'National Executive Secretariat',
      title: 'Ghana Auctioneers Association (GAA)',
      text: 'Amen Mart has shown the entire sector how modern technology protects both the consignor and the state by reconciling every transaction directly into authorized bank accounts with full AML traceability.',
    },
    highlights: [
      'Mandatory Ghana Card KYC biometric registration for all high-value bidders.',
      'Direct Bank of Ghana and partner commercial bank settlement integration.',
      'Automated 14-day instalment tracking and thermal multi-mode receipting.',
      'Complete digital audit trail preventing unremitted sales and cash diversion.',
    ],
    content: [
      'At the 2026 National Auctioneering and Real Estate Colloquium, Amen Mart received special commendation from the Ghana Auctioneers Association (GAA) for its pioneering deployment of modern digital governance across all bidding operations.',
      'Through its newly integrated AmenDesk ERP infrastructure, Amen Mart requires verified Ghana Card identification for all high-value bidder registrations, ensuring total adherence to Ghana’s Anti-Money Laundering (AML) standards.',
      'Furthermore, the firm’s multi-mode cashiering engine reconciles cash payments, mobile money transfers, and direct bank drafts into designated institutional bank accounts in real time, setting a new benchmark for financial transparency.',
      'Dr. Francis Kwaku Yeboah emphasized that digital traceability protects consignors, financial institutions, and public authorities alike, reinforcing Amen Mart’s standing as Ghana’s most trusted auction house.',
    ],
  },
  {
    id: 'news-state-assets-recovery',
    title: 'Dr. Francis Yeboah Addresses National Colloquium on Public Sector Asset Liquidation & Audit Governance',
    thumbnailTitle: 'National Asset Valuation Forum',
    thumbnailKicker: 'PUBLIC POLICY',
    category: 'GOVERNANCE',
    categoryLabel: 'Policy & Governance',
    date: 'August 28, 2026',
    readTime: '5 min read',
    author: 'Public Affairs Directorate',
    authorRole: 'Senior Policy Analyst',
    badgeText: 'Executive Keynote',
    badgeVariant: 'info',
    gradient: 'from-slate-800 via-indigo-950 to-slate-950',
    iconName: 'FileText',
    isPinned: false,
    summary:
      'Addressing public sector procurement officers and internal auditors, Dr. Francis Kwaku Yeboah shared actionable frameworks for state asset auctions, closing documentation loopholes, and ensuring strict Bank of Ghana account remittances.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Managing Director, Amen Mart',
      text: 'Public asset auctions must be insulated from administrative ambiguity. Every government vehicle or decommissioned plant item auctioned must trace directly into state treasury accounts with immutable documentation.',
    },
    highlights: [
      'Addressed over 120 procurement heads, district coordinating directors, and auditors.',
      'Outlined statutory reconciliation mechanisms for District Assemblies and MDAs.',
      'Advocated for standardized pre-auction valuation independent of consignor bias.',
      'Shared practical frameworks for maintaining verifiable public accounts ledger compliance.',
    ],
    content: [
      'Delivering the keynote address at the National Public Sector Asset Liquidation Workshop in Accra, Dr. Francis Kwaku Yeboah provided an authoritative perspective on modernizing government asset disposals.',
      'Reflecting on decades of industry practice and insights from public sector audit reviews, Dr. Yeboah outlined key procedural safeguards to prevent administrative discrepancies when auctioning state-owned machinery, vehicles, and obsolete plant equipment.',
      'He recommended mandatory escrow lodgements, verified pre-auction board inspections, and automated tripartite reconciliations between the auctioneer, the auctioning agency, and the Auditor-General’s designated accounts.',
      'Participants from metropolitan, municipal, and district assemblies (MMDAs) praised the presentation as a masterclass in combining commercial efficiency with statutory fiduciary rectitude.',
    ],
  },
  {
    id: 'news-kwashieman-headquarters',
    title: 'Amen Mart Celebrates a Decade of Professional Auctioneering Excellence Across Greater Accra',
    thumbnailTitle: '10 Years of Auction Leadership',
    thumbnailKicker: 'ACCRA DISPATCH',
    category: 'CORPORATE',
    categoryLabel: 'Corporate Milestones',
    date: 'August 14, 2026',
    readTime: '4 min read',
    author: 'Corporate Communications',
    authorRole: 'Senior Archivist & Communications Officer',
    badgeText: '10-Year Anniversary',
    badgeVariant: 'purple',
    gradient: 'from-rose-800 via-pink-900 to-slate-950',
    iconName: 'HeartHandshake',
    isPinned: false,
    summary:
      'From its founding roots in Kwashieman on Lofoi Street in 2016 to conducting high-volume auctions across Greater Accra and regional centers, Amen Mart reflects on ten years of integrity, growth, and customer satisfaction.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Founder & Managing Director',
      text: 'We started in Kwashieman with a simple promise: that auction bidding in Ghana could be transparent, disciplined, and legally unassailable. Ten years later, that foundation remains unshakable.',
    },
    highlights: [
      'Over 5,000+ lots successfully adjudicated across movable and immovable assets.',
      'Zero registered title disputes across a decade of judicial and private sales.',
      'Pioneered hybrid live yard auctions with digital pre-registration.',
      'Expanded operational footprint across Kwashieman, Gbawe, and greater southern Ghana.',
    ],
    content: [
      'Amen Mart Auctioning Services is proud to commemorate a decade of transformative service to Ghana’s commerce and legal asset liquidation landscape.',
      'Established in 2016 by Dr. Francis Kwaku Yeboah with core headquarters in Kwashieman, Lofoi Street, Accra, the firm began with a clear mission: to bring institutional professionalism, transparent valuations, and strict legal compliance to Ghanaian auctions.',
      'Over the past ten years, Amen Mart has conducted thousands of private, government, and judicial auctions, handling everything from luxury private vehicles and heavy industrial generators to vast commercial estates and court-attached properties.',
      'As part of the anniversary milestones, Amen Mart announced expanded community engagement programs, new digital showroom features, and upgraded bidder protections that will define the next decade of auction excellence.',
    ],
  },
  {
    id: 'news-land-cadastre',
    title: 'Statutory Property Auction: 12 Prime Light-Industrial & Commercial Land Parcels in Greater Accra Gazetted',
    thumbnailTitle: 'Lands Commission Cadastre Plots',
    thumbnailKicker: 'PROPERTY GAZETTE',
    category: 'AUCTION_NOTICE',
    categoryLabel: 'Auction Gazettes',
    date: 'July 30, 2026',
    readTime: '4 min read',
    author: 'Legal & Realty Desk',
    authorRole: 'Conveyancing & Lands Specialist',
    badgeText: 'Certified Cadastre Titles',
    badgeVariant: 'warning',
    gradient: 'from-emerald-800 via-teal-950 to-slate-950',
    iconName: 'Building2',
    isPinned: false,
    summary:
      'Public auction announcement for 12 strategically located commercial and light-industrial land parcels in Greater Accra, fully verified with Lands Commission cadastral plans and statutory transfer indentures.',
    quote: {
      speaker: 'Conveyancing Department',
      title: 'Amen Mart Realty Desk',
      text: 'All parcels auctioned have been cadastrally surveyed and vetted across Lands Commission divisions. Immovable asset purchasers receive endorsed Transfer Deeds upon 14-day balance clearance.',
    },
    highlights: [
      'Zoned for commercial warehouses, showrooms, and logistics yards.',
      'Lands Commission certified cadastral site plans with barcoded coordinates.',
      'Statutory transfer documentation and indenture preparation included.',
      '25% hammer-fall deposit with 14-day statutory settlement window.',
    ],
    content: [
      'Notice is hereby given of the upcoming statutory public auction of twelve (12) prime commercial and light-industrial land parcels situated within key economic corridors of the Greater Accra Region.',
      'Every parcel listed has undergone exhaustive title vetting through the Public and Vested Lands Management Division, Land Registration Division, and Survey & Mapping Division of the Lands Commission.',
      'Purchasers at the auction are protected by fully executed sale deeds and certified cadastral site plans, eliminating the boundary conflicts often associated with unverified property purchases.',
      'Bidders may register at our Gbawe office or online. Site inspections will be conducted with licensed surveyors on designated preview days.',
    ],
  },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [activeLeadPhotoIdx, setActiveLeadPhotoIdx] = useState<number>(0);
  const [modalEnlargedPhoto, setModalEnlargedPhoto] = useState<NewsImage | null>(null);

  const categories = [
    { label: 'All Press & Gazettes', value: 'ALL', count: newsData.length },
    {
      label: 'Philanthropy & Honors',
      value: 'COMMUNITY',
      count: newsData.filter((i) => i.category === 'COMMUNITY').length,
    },
    {
      label: 'Statutory & Licensing',
      value: 'STATUTORY',
      count: newsData.filter((i) => i.category === 'STATUTORY').length,
    },
    {
      label: 'Auction Gazettes',
      value: 'AUCTION_NOTICE',
      count: newsData.filter((i) => i.category === 'AUCTION_NOTICE').length,
    },
    {
      label: 'Corporate Milestones',
      value: 'CORPORATE',
      count: newsData.filter((i) => i.category === 'CORPORATE').length,
    },
    {
      label: 'Policy & Governance',
      value: 'GOVERNANCE',
      count: newsData.filter((i) => i.category === 'GOVERNANCE').length,
    },
  ];

  const filteredNews = newsData.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.thumbnailTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.thumbnailKicker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinnedLead = newsData.find((item) => item.isPinned);

  // Helper to render icon by name
  const renderIcon = (name: NewsItem['iconName'], className: string) => {
    switch (name) {
      case 'Award':
        return <Award className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Gavel':
        return <Gavel className={className} />;
      case 'Truck':
        return <Truck className={className} />;
      case 'Landmark':
        return <Landmark className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'FileText':
      default:
        return <FileText className={className} />;
    }
  };

  return (
    <div className="space-y-14 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
            <Newspaper className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Official Press, Statutory Gazettes &amp; Media Desk</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              News, Gazettes &amp; Official Releases
            </h1>
            <p className="text-lg sm:text-xl text-slate-800 dark:text-slate-200 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 py-3 rounded-r-xl">
              Verified statutory compliance reports, High Court auction gazettes, executive milestones, and humanitarian honors led by Managing Director Dr. Francis Kwaku Yeboah.
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Authorized by the Ministry of the Interior and the Auctioneers Registration Board, Amen Mart ensures that every court-directed disposal, corporate fleet auction, and community initiative operates under total transparency and public accountability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/auctions">
              <Button size="lg" variant="primary" icon={<Gavel className="h-5 w-5" />}>
                Browse Active Auction Catalogs
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" icon={<Phone className="h-5 w-5" />}>
                Media Inquiries &amp; Consignment Desk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Featured Hero Lead Story (Shown on default "ALL" filter without search) */}
        {selectedCategory === 'ALL' && !searchQuery && pinnedLead && (
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md transition-all hover:shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: Visual Media Thumbnail with Authentic Photography & Thumbnail Title */}
              <div
                className="lg:col-span-6 relative min-h-[380px] sm:min-h-[440px] p-6 sm:p-8 flex flex-col justify-between text-white select-none overflow-hidden group cursor-pointer"
                onClick={() => setActiveArticle(pinnedLead)}
              >
                {/* Authentic Background Image */}
                {pinnedLead.images && pinnedLead.images.length > 0 ? (
                  <>
                    <Image
                      src={pinnedLead.images[activeLeadPhotoIdx]?.src || pinnedLead.images[0].src}
                      alt={pinnedLead.images[activeLeadPhotoIdx]?.alt || pinnedLead.title}
                      fill
                      unoptimized
                      priority
                      className="object-cover object-top brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Atmospheric Vignette Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${pinnedLead.gradient}`} />
                )}

                {/* Top Row: Thumbnail Kicker, Reading Time & Interactive Photo Switcher */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/25 text-white shadow-xs">
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    <span>{pinnedLead.thumbnailKicker}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Multi-Photo Switcher Pills */}
                    {pinnedLead.images && pinnedLead.images.length > 1 && (
                      <div
                        className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera className="h-3 w-3 text-amber-300 ml-1 hidden sm:inline" />
                        {pinnedLead.images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveLeadPhotoIdx(idx)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                              activeLeadPhotoIdx === idx
                                ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                                : 'bg-white/10 text-white/80 hover:bg-white/25'
                            }`}
                            title={img.caption}
                          >
                            {idx === 0 ? 'Photo 1 (Plaque)' : 'Photo 2 (Citation)'}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/95 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      <Clock className="h-3.5 w-3.5 text-amber-300" />
                      <span>{pinnedLead.readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Center/Bottom: Prominent Thumbnail Title Plate & Active Photo Caption */}
                <div className="relative z-10 space-y-2 pt-16">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/30 shadow-xl">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
                      {pinnedLead.thumbnailTitle}
                    </span>
                  </div>

                  {pinnedLead.images && pinnedLead.images[activeLeadPhotoIdx] && (
                    <p className="text-xs font-medium text-emerald-100 max-w-lg line-clamp-2 drop-shadow-md bg-slate-950/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15">
                      {pinnedLead.images[activeLeadPhotoIdx].caption}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Editorial Headline, Excerpt & Pull Quote */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={pinnedLead.badgeVariant}>{pinnedLead.badgeText}</Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {pinnedLead.date}
                    </span>
                    {pinnedLead.images && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" />
                        {pinnedLead.images.length} Official Photos Attached
                      </span>
                    )}
                  </div>

                  <h2
                    onClick={() => setActiveArticle(pinnedLead)}
                    className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-snug hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {pinnedLead.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {pinnedLead.summary}
                  </p>

                  {/* Pull Quote Box */}
                  {pinnedLead.quote && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 border-emerald-600 text-xs text-slate-700 dark:text-slate-300 italic space-y-1">
                      <p className="flex items-start gap-1.5">
                        <Quote className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>&quot;{pinnedLead.quote.text}&quot;</span>
                      </p>
                      <p className="not-italic font-bold text-slate-900 dark:text-slate-100 pt-1 text-[11px]">
                        — {pinnedLead.quote.speaker}, {pinnedLead.quote.title}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Tag className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{pinnedLead.author}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setActiveArticle(pinnedLead)}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    Read Full Feature &amp; Gallery
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Category Tabs with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.value
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedCategory === cat.value
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, thumbnail title, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* News Grid with Thumbnail Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className={`group bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                item.isPinned
                  ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {/* Visual Thumbnail Header with Thumbnail Title & Kicker */}
              <div
                className={`relative h-48 sm:h-52 w-full overflow-hidden p-4 flex flex-col justify-between text-white select-none ${
                  !item.images || item.images.length === 0 ? `bg-gradient-to-br ${item.gradient}` : 'bg-slate-950'
                }`}
              >
                {/* Real Photo Thumbnail (if available) or SVG Accent Grid */}
                {item.images && item.images.length > 0 ? (
                  <>
                    <Image
                      src={item.images[0].src}
                      alt={item.images[0].alt}
                      fill
                      unoptimized
                      className="object-cover object-top brightness-90 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <pattern id={`grid-${item.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill={`url(#grid-${item.id})`} />
                      </svg>
                    </div>
                  </>
                )}

                {/* Top Row: Thumbnail Kicker & Reading Time */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/55 backdrop-blur-md border border-white/20 text-white shadow-2xs">
                    {renderIcon(item.iconName, 'h-3 w-3 text-amber-300 shrink-0')}
                    <span>{item.thumbnailKicker}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.images && item.images.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-400/30">
                        <Camera className="h-3 w-3" />
                        <span>{item.images.length} Photos</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      <Clock className="h-3 w-3 text-amber-200" />
                      <span>{item.readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Aesthetic Thumbnail Title Plate */}
                <div className="relative z-10 pt-4">
                  <div className="inline-flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/25 max-w-[95%] shadow-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <p className="text-xs font-black tracking-wide text-white uppercase truncate">
                      {item.thumbnailTitle}
                    </p>
                  </div>
                </div>

                {/* Background Watermark Icon (when no image) */}
                {(!item.images || item.images.length === 0) && (
                  <div className="absolute -bottom-3 -right-3 text-white/10 pointer-events-none transform -rotate-12 transition-transform duration-500 group-hover:scale-115">
                    {renderIcon(item.iconName, 'h-28 w-28')}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <Badge variant={item.badgeVariant}>{item.badgeText}</Badge>
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </span>
                  </div>

                  <h3
                    className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                    onClick={() => setActiveArticle(item)}
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                    <Tag className="h-3 w-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{item.author}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveArticle(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors shrink-0"
                  >
                    <span>Read Notice</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Newspaper className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching news releases found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or switching category filters.
            </p>
          </div>
        )}

        {/* Official Statutory Notice Callout Banner */}
        <div className="surface-card bg-indigo-50/70 dark:bg-slate-800/80 rounded-2xl border border-indigo-200/80 dark:border-slate-700 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Gazettes &amp; High Court Enforcements
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                All statutory auction announcements comply with the Auction Sales Law (PNDCL 230) and undergo mandatory national publication. Consignors and court registrars may contact our compliance desk for direct gazetting.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="md" variant="primary" className="w-full">
                Consign an Asset / Inquire
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Article Detail Modal with Rich Editorial Layout & Attached Photos */}
      {activeArticle && (
        <Modal
          isOpen={Boolean(activeArticle)}
          onClose={() => setActiveArticle(null)}
          title={activeArticle.title}
          maxWidth="4xl"
        >
          <div className="space-y-6 py-2">
            {/* Modal Thumbnail Title Banner */}
            <div
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${activeArticle.gradient} p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-2xs">
                  {renderIcon(activeArticle.iconName, 'h-3.5 w-3.5 text-amber-300')}
                  <span>{activeArticle.thumbnailKicker}</span>
                </span>
                <h4 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                  {activeArticle.thumbnailTitle}
                </h4>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-xs bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                <span>{activeArticle.readTime}</span>
                <span>&bull;</span>
                <span>{activeArticle.categoryLabel}</span>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Badge variant={activeArticle.badgeVariant}>{activeArticle.badgeText}</Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {activeArticle.date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Tag className="h-3.5 w-3.5 text-indigo-500" />
                <span>{activeArticle.author} ({activeArticle.authorRole})</span>
              </div>
            </div>

            {/* Official Photo Gallery (if photos are attached to this article) */}
            {activeArticle.images && activeArticle.images.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Press Photography ({activeArticle.images.length} Photos)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any photo to enlarge
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeArticle.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setModalEnlargedPhoto(img)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all"
                    >
                      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          unoptimized
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute top-2.5 right-2.5 bg-slate-950/75 backdrop-blur-xs text-white p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {img.caption}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quote Box (if available) */}
            {activeArticle.quote && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600 text-sm text-slate-700 dark:text-slate-300 italic space-y-1">
                <p className="flex items-start gap-2">
                  <Quote className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>&quot;{activeArticle.quote.text}&quot;</span>
                </p>
                <p className="not-italic font-bold text-slate-900 dark:text-slate-100 pt-1 text-xs">
                  — {activeArticle.quote.speaker}, {activeArticle.quote.title}
                </p>
              </div>
            )}

            {/* Full Story Paragraphs */}
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeArticle.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Highlights Checklist */}
            {activeArticle.highlights && activeArticle.highlights.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  Key Highlights &amp; Statutory Notes
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {activeArticle.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <Link href="/auctions">
                <Button variant="outline" size="sm" icon={<Gavel className="h-3.5 w-3.5" />}>
                  View Current Auction Lots
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/contact">
                  <Button variant="primary" size="sm" icon={<Share2 className="h-3.5 w-3.5" />}>
                    Inquire on this Release
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setActiveArticle(null)}>
                  Close Notice
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Full-Screen Enlarged Photo Viewer Modal */}
      {modalEnlargedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalEnlargedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-300">
                Official Press Photo &bull; Amen Mart Media Desk
              </span>
              <button
                type="button"
                onClick={() => setModalEnlargedPhoto(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Close Photo Viewer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative h-[65vh] w-full bg-black">
              <Image
                src={modalEnlargedPhoto.src}
                alt={modalEnlargedPhoto.alt}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-200">
              <p className="font-semibold">{modalEnlargedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

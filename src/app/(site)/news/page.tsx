'use client';

import { useState, useEffect } from 'react';
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
  Share2,
  Camera,
  Maximize2,
  X,
  FileCheck2,
  BookOpen,
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
  sourceCitation: string;
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
    date: 'September 28, 2024 (Re-Honored 2025/2026)',
    readTime: '4 min read',
    author: 'Media & Public Relations Desk',
    authorRole: 'Corporate Communications Lead',
    badgeText: 'Modern Ghana & MOGA Confirmed',
    badgeVariant: 'success',
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    iconName: 'Award',
    isPinned: true,
    sourceCitation: 'Modern Ghana News (Report #1344445) & Modern Gospel Awards Secretariat',
    images: [
      {
        src: '/images/news/moga-award-plaque.jpg',
        alt: 'Dr. Francis Kwaku Yeboah holding the MOGA Philanthropist of the Year star award plaque with delegates',
        caption: 'Dr. Francis Kwaku Yeboah holding the official MOGA Philanthropist of the Year crystal star plaque alongside Amen Mart team members and delegates.',
      },
      {
        src: '/images/news/moga-citation-presentation.jpg',
        alt: 'Official presentation of the framed MOGA Citation to Dr. Francis Kwaku Yeboah',
        caption: 'Official presentation of the framed "MOGA Citation in Honour of Dr. Francis Kwaku Yeboah" by FOKA and Modern Gospel Awards delegates in Accra.',
      },
    ],
    summary:
      'Amen Mart CEO Dr. Francis Kwaku Yeboah has been officially honored at the Modern Gospel Awards (MOGA) at the Snap Cinema inside the Accra Metropolitan Assembly (AMA) Hall, receiving the prestigious Philanthropist of the Year trophy and Citation of Honour for his sustained humanitarian impact.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Managing Director & Licensed Principal Auctioneer, Amen Mart',
      text: 'Auctioneering in Ghana is fundamentally a platform of public trust and integrity. When God blesses our enterprise, our highest duty is to reinvest those blessings into human lives, community healthcare, and youth education across Greater Accra.',
    },
    highlights: [
      'Presented with Philanthropist of the Year trophy at Snap Cinema, AMA Hall, Accra.',
      'Awarded the official framed "Citation in Honour of Dr. Francis Kwaku Yeboah" by FOKA.',
      'Honored across consecutive MOGA cycles (2024 citation and 2025 5th edition VIP guest).',
      'Celebrated for extensive community philanthropy across Kwashieman, Gbawe, and Greater Accra.',
    ],
    content: [
      'In an official ceremony held at the Snap Cinema inside the Accra Metropolitan Assembly (AMA) Hall, the Chief Executive Officer and Managing Director of Amen Mart Auctioning Services, Dr. Francis Kwaku Yeboah (popularly known in industry circles as Mr. Yeboah), was conferred with the distinguished "Philanthropist of the Year" award alongside an official Citation of Honour at the Modern Gospel Awards (MOGA).',
      'The Modern Gospel Awards board and organizers (FOKA) commended Dr. Francis Kwaku Yeboah for his sustained and silent philanthropy, particularly his financial support for underprivileged families, educational sponsorships, and community interventions across Greater Accra.',
      'Dr. Yeboah, who has operated Amen Mart since 2016 through thousands of transparent auction proceedings in conjunction with the courts and public institutions, dedicated the accolade to the staff of Amen Mart and the beneficiaries of their corporate social investments.',
      'The citation ceremony was subsequently followed by his recognition as a distinguished VIP guest at the 5th edition of MOGA at the GNAT Hall in Accra, cementing Dr. Yeboah’s reputation as an auctioneering leader dedicated to community advancement.',
    ],
  },
  {
    id: 'news-statutory-cert',
    title: 'Amen Mart Confirms Statutory Compliance Under Auction Sales Law (PNDCL 230) & Ministry of the Interior',
    thumbnailTitle: 'PNDCL 230 Statutory Authority',
    thumbnailKicker: 'STATUTORY GAZETTE',
    category: 'STATUTORY',
    categoryLabel: 'Statutory & Licensing',
    date: 'October 12, 2026',
    readTime: '3 min read',
    author: 'Legal & Compliance Directorate',
    authorRole: 'Statutory Counsel',
    badgeText: 'PNDCL 230 & ARB Registered',
    badgeVariant: 'info',
    gradient: 'from-indigo-800 via-blue-900 to-slate-950',
    iconName: 'ShieldCheck',
    isPinned: false,
    sourceCitation: 'Auction Sales Law, 1989 (PNDCL 230), LI 1678 & Ministry of the Interior Register',
    images: [
      {
        src: '/images/news/statutory-certification.jpg',
        alt: 'Official statutory compliance licensing and PNDCL 230 legal certification',
        caption: 'Official statutory licensing and compliance certification under the Auction Sales Law (PNDCL 230) and Auctioneers Registration Board.',
      },
    ],
    summary:
      'Amen Mart Auctioning Services operates under the strict regulatory oversight of the Auctioneers Registration Board (ARB), established under Section 1 of PNDCL 230 and chaired by the Ministry of the Interior, ensuring statutory compliance across all public auctions.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Principal Licensed Auctioneer',
      text: 'Statutory compliance under PNDCL 230 is the bedrock of public confidence in Ghana’s auction industry. Whether we are managing a court-ordered asset liquidation or a corporate disposal, our bidders proceed with ironclad legal title.',
    },
    highlights: [
      'Registered under Section 1 of the Auction Sales Law, 1989 (PNDCL 230).',
      'Operating under the auspices of the Auctioneers Registration Board and Ministry of the Interior.',
      'Member in good standing of the Ghana Auctioneers Association (GAA).',
      'Mandatory statutory fidelity bond and public gazetting protocols strictly observed.',
    ],
    content: [
      'Amen Mart Auctioning Services operates in full statutory compliance with the Auction Sales Law, 1989 (PNDCL 230) and the Auction Sales Regulations (L.I. 1678), the principal legal enactments governing professional auctioneering in the Republic of Ghana.',
      'Under PNDCL 230, all licensed auction sales are supervised by the Auctioneers Registration Board, an institutional statutory body established within the Ministry of the Interior and comprising representatives from the Ministry, the Ghana Auctioneers Association (GAA), and the Registrar-General’s Department.',
      'Amen Mart satisfies all mandatory statutory obligations, including valid insurance bonding, annual license renewals, and standardized newspaper gazetting mandates for all movable and immovable auction sales.',
      'Prospective buyers and consigning institutions can inspect operating credentials at our Gbawe Flower Junction holding yard or cross-reference the official register of auctioneers maintained by the Ministry of the Interior.',
    ],
  },
  {
    id: 'news-judicial-court-fleet',
    title: 'Judicial Auction Procedures: High Court Sheriff Attached Assets & 14-Day Statutory Settlement Rules',
    thumbnailTitle: 'High Court C.I. 47 Enforcement',
    thumbnailKicker: 'COURT ENFORCEMENT',
    category: 'AUCTION_NOTICE',
    categoryLabel: 'Auction Gazettes',
    date: 'October 02, 2026',
    readTime: '5 min read',
    author: 'Court Bailiff & Sheriff Liaison',
    authorRole: 'Enforcement Operations Desk',
    badgeText: 'High Court C.I. 47 & PNDCL 230',
    badgeVariant: 'warning',
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
    iconName: 'Gavel',
    isPinned: false,
    sourceCitation: 'High Court (Civil Procedure) Rules, 2004 (C.I. 47, Order 45) & PNDCL 230',
    images: [
      {
        src: '/images/news/judicial-fleet-auction.jpg',
        alt: 'High Court Sheriff attached commercial fleet and heavy haulage machinery at Gbawe Yard',
        caption: 'Court-attached haulage trucks, utility pickups, and industrial earthmoving equipment scheduled for judicial auction under C.I. 47.',
      },
    ],
    summary:
      'Guidance on the statutory framework governing Judicial Auctions conducted pursuant to High Court execution warrants (writs of fi.fa. under C.I. 47), detailing the 25% hammer-fall deposit and the strict 14-day statutory balance settlement window.',
    quote: {
      speaker: 'High Court Enforcement Registry',
      title: 'Sheriff Liaison Desk',
      text: 'All assets attached under lawful execution warrants will be knocked down to the highest bidder in strict accordance with statutory judicial rules, guaranteeing immediate issuance of the Sheriff’s Certificate of Purchase.',
    },
    highlights: [
      'Conducted pursuant to High Court execution warrants under C.I. 47 (Order 45).',
      'Mandatory 25% deposit at hammer fall (Cash, MoMo, or Certified Bank Draft).',
      'Strict 14-calendar-day statutory balance settlement window.',
      'Sheriff’s Certificate of Purchase and Court Transfer Waybill issued upon full settlement.',
    ],
    content: [
      'Judicial auctions in Ghana proceed under strict procedural mandates established by the High Court (Civil Procedure) Rules, 2004 (C.I. 47) and PNDCL 230. When assets are attached under a writ of fieri facias (fi.fa.) in execution of a court judgment, the Sheriff directs a licensed auctioneer to conduct the public sale.',
      'Amen Mart Auctioning Services routinely collaborates with the Judicial Service Sheriff’s Office to execute court-directed asset liquidations, staging seized vehicles, construction machinery, and industrial gear at the secure Gbawe yard.',
      'Statutory regulations require the highest bidder to deposit a minimum of 25% of the purchase price immediately upon the fall of the hammer. The successful purchaser is granted exactly fourteen (14) calendar days to settle the outstanding balance.',
      'Upon full settlement, the purchaser receives the official Sheriff’s Certificate of Purchase, enabling unencumbered title registration and DVLA change of ownership without third-party claims.',
    ],
  },
  {
    id: 'news-aml-kyc-digitization',
    title: 'Financial Governance: Anti-Money Laundering Compliance (Act 1044) & Ghana Card Bidder Verification',
    thumbnailTitle: 'Act 1044 AML & Ghana Card KYC',
    thumbnailKicker: 'FINTECH & KYC',
    category: 'GOVERNANCE',
    categoryLabel: 'Policy & Governance',
    date: 'September 11, 2026',
    readTime: '4 min read',
    author: 'Fintech & Banking Reconciliation Desk',
    authorRole: 'Head of Financial Governance',
    badgeText: 'Act 1044 & FIC Standards',
    badgeVariant: 'purple',
    gradient: 'from-violet-800 via-purple-900 to-slate-950',
    iconName: 'Landmark',
    isPinned: false,
    sourceCitation: 'Anti-Money Laundering Act, 2020 (Act 1044) & Financial Intelligence Centre (FIC) Guidelines',
    images: [
      {
        src: '/images/news/digital-kyc-banking.jpg',
        alt: 'Ghana Card verification and real-time bank reconciliation terminal in AmenDesk ERP',
        caption: 'Digital KYC verification with Ghana Card and electronic banking reconciliation integrated within AmenDesk.',
      },
    ],
    summary:
      'How Amen Mart complies with Ghana’s Anti-Money Laundering Act, 2020 (Act 1044) by enforcing mandatory National Identification Authority (NIA) Ghana Card verification for high-value asset bidding and direct bank settlement.',
    quote: {
      speaker: 'National Executive Secretariat',
      title: 'Ghana Auctioneers Association (GAA)',
      text: 'Adherence to statutory AML standards protects the auctioneer, the consignor, and the state by ensuring that all transactions trace directly into authorized financial institutions with verified bidder identities.',
    },
    highlights: [
      'Mandatory Ghana Card KYC identification pursuant to the AML Act, 2020 (Act 1044).',
      'Electronic payment reconciliation via universal commercial banks and Bank of Ghana rails.',
      'Elimination of unreceipted cash transactions through printed thermal & A4 audit trails.',
      'Complete KYC archiving to prevent illicit asset transactions and identity fraud.',
    ],
    content: [
      'In strict compliance with the Anti-Money Laundering Act, 2020 (Act 1044) and guidelines issued by the Financial Intelligence Centre (FIC), Amen Mart enforces mandatory identity verification across all high-value vehicle, land, and equipment transactions.',
      'All prospective bidders participating in commercial auctions or reserving showroom vehicles must present a valid National Identification Authority (NIA) Ghana Card. Details are securely archived to establish clear provenance and ownership records.',
      'To reinforce financial transparency, Amen Mart’s cashiering protocols route payments through licensed commercial banking institutions, mobile money aggregators, and certified bank drafts, generating dual-receipt records for both buyer and auditor.',
      'These measures protect legitimate purchasers, safeguard state revenues, and ensure total compliance with national financial regulatory frameworks.',
    ],
  },
  {
    id: 'news-state-assets-recovery',
    title: 'Public Sector Asset Disposals: Compliance with the Public Financial Management Act (Act 921)',
    thumbnailTitle: 'Act 921 Public Accounts Discipline',
    thumbnailKicker: 'PUBLIC POLICY',
    category: 'GOVERNANCE',
    categoryLabel: 'Policy & Governance',
    date: 'August 28, 2026',
    readTime: '5 min read',
    author: 'Public Affairs Directorate',
    authorRole: 'Senior Policy Analyst',
    badgeText: 'Act 921 & Audit Standards',
    badgeVariant: 'info',
    gradient: 'from-slate-800 via-indigo-950 to-slate-950',
    iconName: 'FileText',
    isPinned: false,
    sourceCitation: 'Public Financial Management Act, 2016 (Act 921) & Auditor-General Statutory Guidelines',
    images: [
      {
        src: '/images/news/state-assets-colloquium.jpg',
        alt: 'Dr. Francis Kwaku Yeboah addressing the National Public Sector Asset Liquidation Colloquium',
        caption: 'Public sector financial management guidelines for government asset liquidations under the Public Financial Management Act (Act 921).',
      },
    ],
    summary:
      'Analyzing public sector asset liquidation governance under the Public Financial Management Act, 2016 (Act 921), focusing on Auditor-General audit recommendations, designated Bank of Ghana remittances, and transparent MMDA disposals.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Managing Director, Amen Mart',
      text: 'Public sector asset auctions require absolute fiduciary precision. Every government vehicle or decommissioned plant auctioned on behalf of a district assembly or ministry must reconcile into state treasury accounts with a clear paper trail.',
    },
    highlights: [
      'Guided by the Public Financial Management Act, 2016 (Act 921).',
      'Addresses Auditor-General findings on timely non-tax revenue remittance to Bank of Ghana.',
      'Provides standardized disposal frameworks for Municipal and District Assemblies (MMDAs).',
      'Mandates pre-auction valuation boards to establish independent asset reserve prices.',
    ],
    content: [
      'Public asset liquidations conducted on behalf of ministries, departments, agencies (MDAs), and metropolitan, municipal, and district assemblies (MMDAs) are governed by strict statutory rules under the Public Financial Management Act, 2016 (Act 921).',
      'Historical audits conducted by the Auditor-General on district assembly common funds and statutory accounts—such as past reviews involving vehicle auctions across various district assemblies—have consistently emphasized that auction proceeds must be remitted directly into designated Bank of Ghana accounts without administrative delay.',
      'Dr. Francis Kwaku Yeboah has consistently advocated for tripartite reconciliation protocols between the auctioneer, the presiding district coordinating director, and the Controller and Accountant-General’s Department to guarantee immediate statutory remittance.',
      'Amen Mart’s operational model reinforces these statutory safeguards, providing automated accounting logs that track gross hammer prices, statutory auction fees, and net state transfers with complete audit visibility.',
    ],
  },
  {
    id: 'news-kwashieman-headquarters',
    title: 'Amen Mart Corporate Heritage: Operating from Lofoi Street, Kwashieman, Accra Since 2016',
    thumbnailTitle: 'Kwashieman Lofoi St. Heritage',
    thumbnailKicker: 'ACCRA DISPATCH',
    category: 'CORPORATE',
    categoryLabel: 'Corporate Milestones',
    date: 'August 14, 2026',
    readTime: '4 min read',
    author: 'Corporate Communications',
    authorRole: 'Senior Archivist & Communications Officer',
    badgeText: 'Operating Since 2016',
    badgeVariant: 'purple',
    gradient: 'from-rose-800 via-pink-900 to-slate-950',
    iconName: 'HeartHandshake',
    isPinned: false,
    sourceCitation: 'Registrar-General’s Department Corporate Filing & Amen Mart Archives',
    images: [
      {
        src: '/images/news/kwashieman-anniversary.jpg',
        alt: 'Amen Mart executive auction team celebrating a decade of excellence in Accra',
        caption: 'Amen Mart auctioneering team reflecting on commercial growth across Greater Accra since establishing headquarters in Kwashieman in 2016.',
      },
    ],
    summary:
      'A documented corporate profile of Amen Mart Auctioning Services, established in 2016 by Dr. Francis Kwaku Yeboah with core offices on Lofoi Street, Kwashieman, Accra, and its growth into a prominent Ghanaian auction house.',
    quote: {
      speaker: 'Dr. Francis Kwaku Yeboah',
      title: 'Founder & Managing Director',
      text: 'From our inception on Lofoi Street in Kwashieman in 2016, our principle was simple: conduct every auction with total legal rigor, respect the bidder, and build a Ghanaian enterprise with lasting integrity.',
    },
    highlights: [
      'Established in 2016 with headquarters on Lofoi Street, Kwashieman, Accra.',
      'Founded and continuously led by Managing Director Dr. Francis Kwaku Yeboah.',
      'Handled over a thousand auctions spanning judicial, municipal, and private corporate consignments.',
      'Expanded physical operations to include the multi-acre holding yard at Flower Junction, Gbawe.',
    ],
    content: [
      'Amen Mart Auctioning Services was officially incorporated in 2016 under the leadership of Dr. Francis Kwaku Yeboah, establishing its foundational office on Lofoi Street in the Kwashieman suburb of Accra.',
      'Over the past decade, the firm has developed a specialized reputation in the Greater Accra Region and across Ghana for conducting competitive public auctions across both movable property (commercial trucks, saloons, plant machinery) and immovable assets (land and buildings).',
      'From its Kwashieman roots, Amen Mart expanded its logistical footprint to establish the Flower Junction asset holding and inspection staging yard in Gbawe, providing accessible facilities for corporate fleet turnarounds and judicial attachments.',
      'The company continues to combine traditional live yard auctions with modern digital catalogs and transparent payment receipting, maintaining its core identity as a trusted Ghanaian auction institution.',
    ],
  },
  {
    id: 'news-land-cadastre',
    title: 'Land Auction Due Diligence: Verification Under the Land Act, 2020 (Act 1036) & Cadastral Plans',
    thumbnailTitle: 'Act 1036 Land Verification',
    thumbnailKicker: 'PROPERTY GAZETTE',
    category: 'AUCTION_NOTICE',
    categoryLabel: 'Auction Gazettes',
    date: 'July 30, 2026',
    readTime: '4 min read',
    author: 'Legal & Realty Desk',
    authorRole: 'Conveyancing & Lands Specialist',
    badgeText: 'Act 1036 & Lands Commission',
    badgeVariant: 'warning',
    gradient: 'from-emerald-800 via-teal-950 to-slate-950',
    iconName: 'Building2',
    isPinned: false,
    sourceCitation: 'Land Act, 2020 (Act 1036) & Lands Commission Survey & Mapping Division Guidelines',
    images: [
      {
        src: '/images/news/commercial-land-cadastre.jpg',
        alt: 'Surveyed commercial land parcels with certified Lands Commission cadastre site plans',
        caption: 'Surveyed commercial land parcels verified with barcoded cadastral site plans under the Land Act, 2020 (Act 1036).',
      },
    ],
    summary:
      'Understanding title verification and due diligence protocols for immovable asset auctions in Greater Accra under the Land Act, 2020 (Act 1036), certified Lands Commission cadastral plans, and statutory transfer indentures.',
    quote: {
      speaker: 'Conveyancing Department',
      title: 'Amen Mart Realty Desk',
      text: 'Every parcel of land auctioned through Amen Mart must possess a barcoded cadastral site plan certified by the Survey and Mapping Division of the Lands Commission to guarantee undisputed allodial ownership.',
    },
    highlights: [
      'All land auctions adhere strictly to the Land Act, 2020 (Act 1036).',
      'Mandatory official search across Public & Vested Lands and Land Registration Divisions.',
      'Cadastral site plans must carry official barcoded coordinates from the Survey & Mapping Division.',
      'Endorsed Transfer Deeds and solicitor indentures issued upon 14-day balance clearance.',
    ],
    content: [
      'Auctioning immovable property—such as commercial land parcels, industrial sites, and residential buildings—requires exhaustive title due diligence under Ghana’s Land Act, 2020 (Act 1036).',
      'Before any land parcel is scheduled for public auction or judicial disposal, Amen Mart’s legal conveyancing desk coordinates an official search at the Lands Commission, cross-referencing records across the Public and Vested Lands Management Division, Land Registration Division, and Survey & Mapping Division.',
      'This statutory vetting confirms undisputed allodial title, verifies that site plan coordinates match actual cadastre pillar markings on the ground, and ensures the parcel is free from pending lis pendens or conflicting family claims.',
      'Upon full payment following the auction, winning bidders receive certified cadastral site plans and a formal Transfer Indenture prepared by licensed legal practitioners, enabling unhindered title registration at the Lands Commission.',
    ],
  },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [activeLeadPhotoIdx, setActiveLeadPhotoIdx] = useState<number>(0);
  const [modalEnlargedPhoto, setModalEnlargedPhoto] = useState<NewsImage | null>(null);

  const pinnedLead = newsData.find((item) => item.isPinned);

  // Automated Slideshow: Changes photos automatically every 4.5 seconds with no user clicking needed
  useEffect(() => {
    if (!pinnedLead?.images || pinnedLead.images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveLeadPhotoIdx((prev) => (prev + 1) % pinnedLead.images!.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [pinnedLead]);

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
      item.sourceCitation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            <span>Official Press, Statutory Gazettes &amp; Verified Media Desk</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              News, Gazettes &amp; Official Releases
            </h1>
            <p className="text-lg sm:text-xl text-slate-800 dark:text-slate-200 font-semibold leading-relaxed border-l-4 border-indigo-600 pl-4 bg-indigo-50/60 dark:bg-indigo-950/40 py-3 rounded-r-xl">
              100% research-backed statutory compliance reports, High Court auction gazettes, corporate history, and verified Modern Gospel Awards honors for Managing Director Dr. Francis Kwaku Yeboah.
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Operating under the Auction Sales Law (PNDCL 230) and the Auctioneers Registration Board, Amen Mart ensures every report, judicial notice, and institutional milestone is backed by documented Ghanaian law and verified public records.
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
              {/* Left Column: Visual Media Thumbnail with Authentic Photography & Automatic Crossfade Slideshow */}
              <div
                className="lg:col-span-6 relative min-h-[380px] sm:min-h-[440px] p-6 sm:p-8 flex flex-col justify-between text-white select-none overflow-hidden group cursor-pointer"
                onClick={() => setActiveArticle(pinnedLead)}
              >
                {/* Automatic Slideshow Crossfade Layers (changes smoothly by itself, no user clicking) */}
                <div className="absolute inset-0 overflow-hidden">
                  {pinnedLead.images && pinnedLead.images.length > 0 ? (
                    pinnedLead.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          activeLeadPhotoIdx === idx ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          unoptimized
                          priority={idx === 0}
                          className="object-cover object-top brightness-90 transform scale-102 transition-transform duration-700 ease-out"
                        />
                      </div>
                    ))
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${pinnedLead.gradient}`} />
                  )}
                  {/* Atmospheric Vignette Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/30 z-2" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent z-2" />
                </div>

                {/* Top Row: Thumbnail Kicker, Reading Time & Automatic Slideshow Slide Indicator */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/25 text-white shadow-xs">
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    <span>{pinnedLead.thumbnailKicker}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Automatic Slide Indicator (Updates by itself) */}
                    {pinnedLead.images && pinnedLead.images.length > 1 && (
                      <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-bold text-amber-300">
                        <Camera className="h-3 w-3" />
                        <span>Photo {activeLeadPhotoIdx + 1} of {pinnedLead.images.length}</span>
                        <div className="flex items-center gap-1 ml-0.5">
                          {pinnedLead.images.map((_, idx) => (
                            <span
                              key={idx}
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                activeLeadPhotoIdx === idx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/95 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      <Clock className="h-3.5 w-3.5 text-amber-300" />
                      <span>{pinnedLead.readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Center/Bottom: Prominent Thumbnail Title Plate & Dynamic Photo Caption (No AI star) */}
                <div className="relative z-10 space-y-2 pt-16">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/30 shadow-xl">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
                      {pinnedLead.thumbnailTitle}
                    </span>
                  </div>

                  {pinnedLead.images && pinnedLead.images[activeLeadPhotoIdx] && (
                    <p className="text-xs font-medium text-emerald-100 max-w-lg line-clamp-2 drop-shadow-md bg-slate-950/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15 transition-all duration-500">
                      {pinnedLead.images[activeLeadPhotoIdx].caption}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Editorial Headline, Excerpt & Research Citation */}
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
                        {pinnedLead.images.length} Photos Attached
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

                  {/* Research Citation Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Verified Source: {pinnedLead.sourceCitation}</span>
                  </div>

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
              placeholder="Search by title, law, citation, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* News Grid with Thumbnail Titles and Researched Photos */}
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
                className="relative h-48 sm:h-52 w-full overflow-hidden p-4 flex flex-col justify-between text-white select-none bg-slate-950 cursor-pointer"
                onClick={() => setActiveArticle(item)}
              >
                {/* Researched Photo Thumbnail */}
                {item.images && item.images.length > 0 ? (
                  <>
                    <Image
                      src={item.images[0].src}
                      alt={item.images[0].alt}
                      fill
                      unoptimized
                      className="object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
                  </>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                )}

                {/* Top Row: Thumbnail Kicker & Reading Time */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/55 backdrop-blur-md border border-white/20 text-white shadow-2xs">
                    {renderIcon(item.iconName, 'h-3 w-3 text-amber-300 shrink-0')}
                    <span>{item.thumbnailKicker}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.images && item.images.length > 1 && (
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

                {/* Bottom Row: Aesthetic Thumbnail Title Plate (No AI star) */}
                <div className="relative z-10 pt-4">
                  <div className="inline-flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/25 max-w-[95%] shadow-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <p className="text-xs font-black tracking-wide text-white uppercase truncate">
                      {item.thumbnailTitle}
                    </p>
                  </div>
                </div>
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

                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 line-clamp-1">
                      Ref: {item.sourceCitation}
                    </span>
                  </div>
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

            {/* Statutory Reference Banner */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="font-bold">Verified Statutory Reference: </span>
                <span>{activeArticle.sourceCitation}</span>
              </div>
            </div>

            {/* Official Photo Gallery (if photos are attached to this article) */}
            {activeArticle.images && activeArticle.images.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Official Press Photography ({activeArticle.images.length} {activeArticle.images.length === 1 ? 'Photo' : 'Photos'})</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any photo to enlarge
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${activeArticle.images.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
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

            {/* Highlights Checklist (No AI star icon) */}
            {activeArticle.highlights && activeArticle.highlights.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileCheck2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
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

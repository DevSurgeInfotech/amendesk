export interface AiInventoryCardItem {
  id: string;
  type: 'AUCTION' | 'SHOWROOM' | 'LAND' | 'PROPERTY';
  title: string;
  subtitle: string;
  priceLabel: string;
  priceValueGhs: number;
  badgeText: string;
  location: string;
  href: string;
}

export interface AiSuggestedLink {
  label: string;
  href: string;
}

export interface AmenAiResponse {
  id: string;
  answer: string;
  categoryLabel: string;
  highlights?: string[];
  inventoryItems?: AiInventoryCardItem[];
  suggestedLinks: AiSuggestedLink[];
  followUpPrompts: string[];
  suggestLeadCapture?: boolean;
  createdAt: string;
}

export interface LiveInventorySnapshot {
  auctionLots: Array<{
    id: string;
    lotNumber: string;
    title: string;
    category: 'PRIVATE' | 'GOVERNMENT' | 'JUDICIAL';
    assetType: 'MOVABLE' | 'IMMOVABLE';
    startingBidGhs: number;
    currentBidGhs: number;
    reservePriceGhs: number;
    status: string;
    yardLocation: string;
    conditionNotes?: string;
    make?: string;
    model?: string;
    year?: number;
    fuelType?: string;
    courtCaseNumber?: string;
  }>;
  dealershipVehicles: Array<{
    id: string;
    stockNumber: string;
    make: string;
    model: string;
    year: number;
    fuelType: string;
    transmission: string;
    mileageKm: number;
    color: string;
    askingPriceGhs: number;
    status: string;
    location: string;
    description?: string;
  }>;
  landParcels: Array<{
    id: string;
    siteRef: string;
    title: string;
    location: string;
    sizeAcres: number;
    priceGhs: number;
    status: string;
    titleType: string;
    description?: string;
  }>;
  propertyUnits: Array<{
    id: string;
    unitRef: string;
    title: string;
    propertyType: string;
    location: string;
    bedrooms?: number;
    bathrooms?: number;
    priceGhs: number;
    status: string;
    description?: string;
  }>;
}

export const AMEN_MART_COMPANY_FACTS = {
  officialName: 'Amen Mart Auctioning Services (Amen Mart Limited)',
  managingDirector: 'Dr. Francis Kwaku Yeboah (popularly known as "Mr. Yeboah")',
  directorTitle: 'Managing Director & Licensed Principal Auctioneer',
  experienceYears: '10+ Years (Established 2016)',
  awards:
    'Double recipient of the Philanthropist of the Year Award at the Modern Gospel Awards (MOGA 2024 & 2025 at GNAT Hall, Accra)',
  statutoryApprovals: [
    'Approved by the Auctioneers Registration Board (ARB)',
    'Authorized by the Ministry of the Interior under the Auction Sales Law (PNDCL 230)',
    'Certified Member in Good Standing of the Ghana Auctioneers Association (GAA)',
    'Empaneled for High Court & Circuit Court Sheriff Execution Sales under Ghana’s Constitution',
  ],
  location: {
    physical: 'Gbawe, Flower Junction, Accra, Ghana (Head Office, Holding Yard, Showroom & Cash Office)',
    postal: 'P. O. Box DC 1013, Dansoman, Accra — Ghana',
    city: 'Accra, Greater Accra Region, Ghana',
  },
  contacts: {
    primaryPhone: '0548517277',
    secondaryPhone: '0558314744',
    internationalPrimary: '+233 54 851 7277',
    internationalSecondary: '+233 55 831 4744',
    whatsappNumber: '233548517277',
    email: 'amenmart2291@gmail.com',
  },
  operatingHours: {
    weekdays: 'Monday – Friday: 8:00 AM – 5:00 PM',
    saturday: 'Saturday: 9:00 AM – 2:00 PM (Yard Inspection & Showroom Viewing)',
    sunday: 'Closed on Sundays',
  },
  financialRules: {
    currency: 'Ghana Cedis (GH₵ / GHS)',
    auctionDepositPercent: 25,
    settlementWindowDays: 14,
    auctionMarginFeePercent: 7,
    dealershipAuctionFeePercent: 0,
    paymentMethods: [
      'Cash at the Gbawe Head Office Cash Office (8:00 AM – 5:00 PM)',
      'Mobile Money (MTN MoMo, Telecel/Vodafone Cash, AirtelTigo Money via Hubtel)',
      'Bank Transfer / Certified Bankers Draft (GCB Bank & Partner Commercial Banks)',
      'Visa / Mastercard & Online Reservation Deposits via Paystack',
    ],
  },
};

interface KnowledgeTopic {
  id: string;
  categoryLabel: string;
  title: string;
  keywords: string[];
  phrases: string[];
  answer: string;
  highlights: string[];
  suggestedLinks: AiSuggestedLink[];
  followUpPrompts: string[];
  suggestLeadCapture?: boolean;
}

export const AMEN_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'company-overview',
    categoryLabel: 'Company & Licensing',
    title: 'About Amen Mart Auctioning Services & Statutory Mandate',
    keywords: [
      'amen',
      'mart',
      'about',
      'company',
      'who',
      'legit',
      'licensed',
      'license',
      'approved',
      'ministry',
      'interior',
      'gaa',
      'board',
      'pndcl',
      '230',
      'trust',
      'trusted',
      'services',
      'what do you do',
    ],
    phrases: [
      'what is amen mart',
      'tell me about amen mart',
      'are you licensed',
      'is amen mart registered',
      'what services do you offer',
      'auctioneers registration board',
      'ministry of the interior',
    ],
    answer:
      '**Amen Mart Auctioning Services** (Amen Mart Limited) is one of Ghana’s premier, government-authorized auctioneering and multi-asset trading companies, headquartered at **Gbawe, Flower Junction, Accra**.\n\nWe are fully licensed and approved by the **Auctioneers Registration Board (ARB)** and the **Ministry of the Interior** under **PNDCL 230**, and we are an active member of the **Ghana Auctioneers Association (GAA)**.\n\nOur operations span **four core business lines**:\n• **Public & Online Auctions**: Judicial (Court-Ordered), Government Fleet, and Private Consignment auctions across Movable (vehicles, machinery) and Immovable (land, buildings) assets.\n• **Car Dealership Showroom**: Direct sale of clean-title imported and local vehicles at our Gbawe Showroom (with 0% auction fee).\n• **Titled Land Parcels**: Litigation-free, surveyed land plots verified with the Lands Commission.\n• **Commercial & Residential Properties**: Direct sale and lease of verified homes, townhouses, and commercial units.',
    highlights: [
      'Approved by the Ministry of the Interior & Auctioneers Registration Board (PNDCL 230)',
      'Certified member of the Ghana Auctioneers Association (GAA)',
      'Led by Managing Director Dr. Francis Kwaku Yeboah (10+ years track record)',
      '4 Business Lines: Auctions, Car Showroom, Titled Land & Real Estate Properties',
    ],
    suggestedLinks: [
      { label: 'About Amen Mart', href: '/about' },
      { label: 'Upcoming Auctions', href: '/auctions' },
      { label: 'Explore Car Showroom', href: '/showroom' },
    ],
    followUpPrompts: [
      'Who is Dr. Francis Kwaku Yeboah?',
      'How do your Judicial, Government, and Private auctions work?',
      'Where is your office and what are your viewing hours?',
    ],
  },
  {
    id: 'leadership-yeboah',
    categoryLabel: 'Executive Leadership',
    title: 'Dr. Francis Kwaku Yeboah — Managing Director & Principal Auctioneer',
    keywords: [
      'francis',
      'kwaku',
      'yeboah',
      'ceo',
      'director',
      'owner',
      'founder',
      'leader',
      'leadership',
      'auctioneer',
      'moga',
      'award',
      'philanthropist',
      'dr',
      'doctor',
    ],
    phrases: [
      'who is dr francis',
      'dr francis kwaku yeboah',
      'mr yeboah',
      'managing director',
      'who owns amen mart',
      'who leads amen mart',
      'philanthropist of the year',
    ],
    answer:
      '**Dr. Francis Kwaku Yeboah** (popularly known across Ghana’s commercial and legal circles as **"Mr. Yeboah"**) is the **Managing Director and Licensed Principal Auctioneer** of Amen Mart Auctioning Services.\n\nWith over **10+ years of executive leadership** since founding the firm’s modern operations in 2016, Dr. Yeboah has built a stellar reputation for transparent, compliant asset valuations and liquidations on behalf of the High Courts and Circuit Courts of Ghana, government ministries, commercial banks, and private estates.\n\nBeyond the auction podium, Dr. Francis Kwaku Yeboah is a celebrated humanitarian—honored consecutively as **Philanthropist of the Year** at the **Modern Gospel Awards (MOGA 2024 & 2025)** at the GNAT Hall in Accra.',
    highlights: [
      'Licensed Principal Auctioneer & GAA Member with 10+ years of leadership',
      'Trusted by High Courts, Government Ministries, Banks & Private Consignors',
      '2x MOGA Philanthropist of the Year Honoree (2024 & 2025)',
      'Available for executive consignment and valuation consultations at Gbawe',
    ],
    suggestedLinks: [
      { label: 'Leadership Profile', href: '/about' },
      { label: 'Read Press & MOGA Award News', href: '/news' },
      { label: 'Book Valuation Consultation', href: '/contact' },
    ],
    followUpPrompts: [
      'How can I consign an asset with Dr. Francis Kwaku Yeboah?',
      'What are your office contact numbers and address?',
      'How do Judicial Court auctions work?',
    ],
  },
  {
    id: 'location-contacts-hours',
    categoryLabel: 'Location, Hours & Contact',
    title: 'Office Location, Yard Viewing Hours & Direct Hotlines',
    keywords: [
      'where',
      'location',
      'address',
      'located',
      'gbawe',
      'flower',
      'junction',
      'dansoman',
      'accra',
      'phone',
      'number',
      'call',
      'contact',
      'whatsapp',
      'email',
      'hours',
      'open',
      'close',
      'time',
      'direction',
      'directions',
      'visit',
      'yard',
    ],
    phrases: [
      'where are you located',
      'where is your office',
      'contact number',
      'phone number',
      'opening hours',
      'working hours',
      'business hours',
      'how can i reach you',
      'gbawe flower junction',
    ],
    answer:
      'You can visit or contact **Amen Mart Auctioning Services** at our Accra headquarters and holding yard:\n\n• **Physical Location (Yard, Showroom & Cash Office)**: **Gbawe, Flower Junction, Accra, Ghana**\n• **Postal Address**: **P. O. Box DC 1013, Dansoman, Accra — Ghana**\n• **Direct Telephone / WhatsApp Lines**: **`0548517277`** / **`0558314744`** (International: `+233 54 851 7277` / `+233 55 831 4744`)\n• **Official Email**: **`amenmart2291@gmail.com`**\n\n**Operating & Yard Viewing Hours**:\n• **Monday – Friday**: **8:00 AM – 5:00 PM** (Standard operating hours across Yard, Showroom & Cash Office)\n• **Saturday**: **9:00 AM – 2:00 PM** (Public inspection & showroom viewing)\n• **Sunday**: Closed',
    highlights: [
      'Physical Yard & Showroom: Gbawe, Flower Junction, Accra',
      'Hotlines & WhatsApp: 0548517277 / 0558314744',
      'Email: amenmart2291@gmail.com',
      'Hours: Mon–Fri (8:00 AM – 5:00 PM) • Sat (9:00 AM – 2:00 PM)',
    ],
    suggestedLinks: [
      { label: 'Contact & Inquiry Page', href: '/contact' },
      { label: 'View Upcoming Auctions', href: '/auctions' },
    ],
    followUpPrompts: [
      'Can I bring a mechanic to inspect a car at the Gbawe yard?',
      'How do I register to bid in an auction?',
      'What vehicles are currently in the showroom?',
    ],
    suggestLeadCapture: true,
  },
  {
    id: 'auction-categories',
    categoryLabel: 'Auction Categories',
    title: 'Three Statutory Auction Categories: Judicial, Government & Private',
    keywords: [
      'category',
      'categories',
      'types of auction',
      'judicial',
      'government',
      'private',
      'sheriff',
      'court',
      'state',
      'ministry',
      'execution',
      'writ',
      'fifa',
    ],
    phrases: [
      'types of auctions',
      'auction categories',
      'judicial auction',
      'government auction',
      'private auction',
      'court ordered auction',
      'sheriff auction',
      'difference between judicial and private',
    ],
    answer:
      'Amen Mart conducts **three distinct statutory auction categories**, covering both **Movable** (vehicles, plant, equipment) and **Immovable** (land, houses, commercial buildings) property:\n\n1. **Judicial Auctions (Court-Ordered / Sheriff Sales)**:\n   • Conducted under High Court or Circuit Court Writs of Execution (`Fi.Fa.`) on behalf of the Judicial Service of Ghana.\n   • Covers **Movable and Immovable** assets.\n   • Every lot carries a verified **Court Case Number**, **Sheriff Instruction Reference**, and attached **Court Order / Writ**.\n   • Buyers receive a statutory **Certificate of Sale** guaranteeing unencumbered title registration at the DVLA or Lands Commission.\n\n2. **Government Auctions (State Fleet & Asset Disposals)**:\n   • Authorized disposal of state vehicles, ministry fleets, and public machinery (primarily **Movable** assets).\n   • Backed by official government disposal authorization and customs/allocation documentation.\n\n3. **Private Auctions (Corporate & Voluntary Consignments)**:\n   • Conducted on behalf of commercial banks, corporate fleets, liquidators, and private property owners.\n   • Covers **Movable and Immovable** assets with pre-agreed reserve prices.',
    highlights: [
      'Judicial: High Court / Sheriff Writs (Movable & Immovable)',
      'Government: State & Ministry Fleet Disposals (Mainly Movable)',
      'Private: Corporate, Bank & Individual Consignments (Movable & Immovable)',
      'Standard 7% statutory auction fee applies across all auction categories',
    ],
    suggestedLinks: [
      { label: 'All Auction Notices', href: '/auctions' },
      { label: 'Judicial Auctions', href: '/auctions?cat=JUDICIAL' },
      { label: 'Government Auctions', href: '/auctions?cat=GOVERNMENT' },
      { label: 'Private Auctions', href: '/auctions?cat=PRIVATE' },
    ],
    followUpPrompts: [
      'What are the deposit and 14-day payment rules for auctions?',
      'What documents do I get after winning a Movable vs. Immovable lot?',
      'Are there any upcoming auction lots right now?',
    ],
  },
  {
    id: 'bidding-deposit-14day-settlement',
    categoryLabel: 'Deposit & 14-Day Settlement',
    title: '25% Hammer Deposit & 14-Day Statutory Settlement Window',
    keywords: [
      'deposit',
      '14',
      'fourteen',
      'two weeks',
      '2 weeks',
      'balance',
      'instalment',
      'installment',
      'settlement',
      'settle',
      'deadline',
      'overdue',
      'forfeit',
      'extension',
      '25%',
      '75%',
      'hammer',
      'payment plan',
      'rules',
    ],
    phrases: [
      'how long to pay',
      '14 day rule',
      '14-day settlement',
      'how much deposit',
      '25% deposit',
      'can i pay in instalments',
      'what happens if i miss the deadline',
      'when is the balance due',
      'payment terms',
    ],
    answer:
      'Under Ghana’s statutory auction guidelines (PNDCL 230) and Amen Mart’s settlement policy, winning bids follow a strict **Deposit & 14-Day Instalment Settlement Engine**:\n\n1. **25% Mandatory Immediate Deposit**:\n   • When the auctioneer’s hammer falls, a legally binding sale contract is formed.\n   • The winning bidder must immediately pay a **minimum 25% non-refundable deposit** at the cash office (via Cash, MoMo, Certified Bank Draft, or Paystack).\n   • The lot status transitions to **`Sold — Awaiting Balance`** and an official deposit receipt (`AM-RCP-2026-XXXX`) is printed immediately.\n\n2. **14-Day (2-Week) Balance Window**:\n   • You have exactly **14 calendar days (2 weeks)** from the auction date to pay the remaining **75% balance**.\n   • **Flexible Instalments**: You may clear the balance in a single payment or across multiple instalments within the 14-day window. Every payment receives a printed thermal or A4 receipt showing **Amount Paid**, **Total Paid to Date**, and **Balance Remaining**.\n\n3. **Strict Hold & Overdue Policy**:\n   • **No Release Before Full Payment**: Vehicles, keys, waybills, and land transfer deeds remain strictly held until **100% of the balance** is settled.\n   • If the 14-day deadline expires without an approved extension from the Auction Manager, the lot is flagged **Overdue** and may face deposit forfeiture and re-auctioning.',
    highlights: [
      '25% immediate non-refundable deposit required at hammer drop',
      '14 calendar days (2 weeks) to settle the remaining 75% balance',
      'Pay in one lump sum or multiple instalments within the 14 days',
      'Assets and Waybills/Transfer Deeds are released ONLY after 100% payment',
    ],
    suggestedLinks: [
      { label: 'Read Judicial Bidding Guide', href: '/blog' },
      { label: 'Browse Active Auctions', href: '/auctions' },
      { label: 'Contact Cash Office', href: '/contact' },
    ],
    followUpPrompts: [
      'What payment methods do you accept?',
      'What is the difference between a Waybill and a Sale/Transfer Deed?',
      'Is there a 7% fee on auctions and showroom cars?',
    ],
  },
  {
    id: 'fees-margin-policy',
    categoryLabel: 'Fees & Pricing Policy',
    title: '7% Statutory Auction Fee vs. 0% Fee on Dealership Showroom Cars',
    keywords: [
      'fee',
      'fees',
      'commission',
      'margin',
      '7%',
      'seven percent',
      'percentage',
      'charge',
      'charges',
      'premium',
      'buyer premium',
      'extra cost',
      'vat',
      'tax',
    ],
    phrases: [
      'what is the auction fee',
      'is there a 7% fee',
      'how much commission',
      'do showroom cars have a fee',
      'auction margin',
      'extra charges',
    ],
    answer:
      'Amen Mart maintains a transparent, two-tier corporate fee structure separating **Auction Lots** from **Direct Dealership Showroom Sales**:\n\n• **Public & Online Auctions (7% Statutory Fee)**:\n  A standard **7% statutory auction fee/margin** applies across all auction categories (**Judicial, Government, and Private**) on auctioned vehicles, property, equipment, and collectibles.\n\n• **Car Dealership Showroom (0% Auction Fee)**:\n  Vehicles listed in our **Car Dealership Showroom (`/showroom`)** are Amen Mart’s own direct-sale inventory. They carry **NO 7% auction fee**—you pay only the agreed purchase price for the vehicle, with instant receipting and ownership documentation.',
    highlights: [
      '7% statutory fee applies to all Auction Lots (Judicial, Government & Private)',
      '0% auction fee on Direct Car Dealership Showroom vehicles',
      'All payments receive official numbered receipts (AM-RCP-2026-XXXX)',
    ],
    suggestedLinks: [
      { label: 'Explore Car Showroom (0% Fee)', href: '/showroom' },
      { label: 'View Auction Notices', href: '/auctions' },
    ],
    followUpPrompts: [
      'What cars are available in the showroom right now?',
      'How does the 14-day payment plan work?',
      'What documents do I receive after buying a car?',
    ],
  },
  {
    id: 'movable-vs-immovable-docs',
    categoryLabel: 'Disposal Documentation',
    title: 'Movable vs. Immovable Assets: Waybills, Certificates of Sale & Transfer Deeds',
    keywords: [
      'waybill',
      'waybills',
      'document',
      'documents',
      'documentation',
      'movable',
      'immovable',
      'deed',
      'indenture',
      'certificate of sale',
      'dvla',
      'release',
      'gate pass',
      'gate',
      'transfer',
      'paperwork',
      'customs',
      'icums',
    ],
    phrases: [
      'what documents do i get',
      'movable vs immovable',
      'what is a waybill',
      'how do i register with dvla',
      'gate release waybill',
      'sale transfer document',
      'when do i get my documents',
    ],
    answer:
      'Once your purchase is **100% paid in full**, AmenDesk automatically generates the legal disposal document matching the **asset type**:\n\n1. **Movable Assets (Vehicles, Plant, Generators, Machinery & Equipment)**:\n   • **Official A5 Gate Release Waybill (`AM-WB-2026-XXXX`)**: Tamper-evident document recording the Vehicle Chassis/VIN or Serial Number, Registration Number, quantity, buyer details, transporting driver’s Ghana Card, and gate officer sign-off—required to exit the Gbawe security yard.\n   • **Statutory Certificate of Sale & Customs Docs**: Enables smooth change of ownership with the **DVLA**.\n   • **Final Settlement Receipt (`AM-RCP-2026-XXXX`)**.\n\n2. **Immovable Assets (Titled Land Parcels & Residential/Commercial Buildings)**:\n   • **Formal Sale / Transfer Deed (`AM-TRF-2026-XXXX`)**: Records the parcel/title reference, location, dimensions, buyer’s Ghana Card, consideration amount, lawyer witness, and Court Case / Sheriff reference (for judicial lots).\n   • **Certified Cadastral Site Plan & Indenture** for **Lands Commission** registration.\n   • *(Note: Immovable properties never receive a Waybill because real estate does not physically move.)*',
    highlights: [
      'Movable Assets → A5 Gate Release Waybill + Certificate of Sale + Receipt',
      'Immovable Assets → Sale/Transfer Deed + Site Plan / Indenture + Receipt',
      'Documents are issued immediately upon 100% full balance settlement',
    ],
    suggestedLinks: [
      { label: 'Read Movable vs. Immovable Guide', href: '/blog' },
      { label: 'Browse Vehicles', href: '/showroom' },
      { label: 'Browse Titled Land', href: '/land' },
    ],
    followUpPrompts: [
      'What do I need to bring for bidder registration and KYC?',
      'How do I verify a land parcel at the Lands Commission?',
      'Can I inspect a vehicle with my mechanic before buying?',
    ],
  },
  {
    id: 'payment-methods-kyc',
    categoryLabel: 'Payments, Receipts & KYC',
    title: 'Accepted Payment Modes, Thermal Receipts & Ghana Card KYC',
    keywords: [
      'pay',
      'payment',
      'payments',
      'cash',
      'momo',
      'mobile money',
      'mtn',
      'vodafone',
      'telecel',
      'airteltigo',
      'hubtel',
      'paystack',
      'card',
      'visa',
      'mastercard',
      'bank',
      'draft',
      'transfer',
      'receipt',
      'kyc',
      'ghana card',
      'id',
      'register',
      'registration',
    ],
    phrases: [
      'how can i pay',
      'payment methods',
      'do you accept momo',
      'do you accept mobile money',
      'can i pay with card',
      'what id is required',
      'ghana card kyc',
      'how to register as a bidder',
    ],
    answer:
      'All transactions across Auctions, Car Showroom, Land, and Properties funnel through Amen Mart’s centralized **Cash Office** with multi-mode receipting:\n\n**4 Accepted Payment Modes**:\n1. **Cash**: Paid directly at the Gbawe Front-Desk Cash Office (Mon–Fri, 8:00 AM – 5:00 PM).\n2. **Mobile Money (MoMo)**: **MTN MoMo**, **Telecel (Vodafone) Cash**, and **AirtelTigo Money** processed via Hubtel.\n3. **Bank Transfer / Bankers Draft**: Direct transfer or certified bank draft to Amen Mart’s corporate bank accounts (e.g., GCB Bank).\n4. **Card & Online Reservations (Paystack)**: Secure **Visa / Mastercard** payments and online vehicle reservation deposits.\n\n**Instant Offline-First Receipting**:\n• Every payment generates an immediate **80mm POS Thermal Receipt** or **Formal A4 Invoice (`AM-RCP-2026-XXXX`)** showing Amount Paid, Total Paid to Date, and Remaining Balance.\n\n**Mandatory KYC Requirement**:\n• In compliance with Ghana AML/KYC regulations, DVLA rules, and High Court bidding directives, a valid **Ghana Card (`GHA-XXXXXXXXX-X`)** is required to complete buyer KYC, issue Waybills, or execute Land Indentures.',
    highlights: [
      'Cash, MoMo (MTN/Telecel/AirtelTigo), Bank Transfer & Paystack Card accepted',
      'Split payments supported (e.g., part MoMo + part Cash)',
      'Instant 80mm thermal receipt or A4 invoice issued for every payment',
      'Valid Ghana Card (GHA-XXXXXXXXX-X) required for KYC & title transfer',
    ],
    suggestedLinks: [
      { label: 'Register as a Bidder', href: '/contact' },
      { label: 'Explore Car Showroom', href: '/showroom' },
    ],
    followUpPrompts: [
      'How does the 25% deposit and 14-day balance rule work?',
      'Can I reserve a showroom vehicle online?',
      'Where is the Cash Office located?',
    ],
  },
  {
    id: 'car-dealership-inspection',
    categoryLabel: 'Car Dealership & Inspection',
    title: 'Car Dealership Showroom, VIN Verification & Mechanic Inspections',
    keywords: [
      'car',
      'cars',
      'vehicle',
      'vehicles',
      'showroom',
      'dealership',
      'auto',
      'suv',
      'truck',
      'toyota',
      'honda',
      'hyundai',
      'kia',
      'lexus',
      'mercedes',
      'benz',
      'ford',
      'nissan',
      'vin',
      'chassis',
      'mechanic',
      'inspect',
      'inspection',
      'obd',
      'duty',
      'customs',
      'imported',
    ],
    phrases: [
      'buy a car',
      'showroom cars',
      'can i bring a mechanic',
      'vehicle inspection',
      'customs duty paid',
      'direct car sale',
      'how to reserve a car',
    ],
    answer:
      'Amen Mart operates a dedicated **Car Dealership Showroom (`/showroom`)** at our Gbawe facility, completely separate from our auction lots:\n\n• **Direct Purchase with 0% Auction Fee**: Unlike auction lots (which carry a 7% fee), showroom vehicles are sold directly at their listed or agreed price with **zero auction fee**.\n• **Full VIN & Customs Verification**: Every showroom vehicle is logged with its physical **Chassis / VIN number**, mileage, fuel type, transmission, and verified **Ghana Customs (GRA / ICUMS)** duty clearance status.\n• **Pre-Purchase Mechanic Inspections**: We strongly encourage buyers to visit our Gbawe yard (Mon–Fri 8am–5pm, Sat 9am–2pm) and bring a **certified mechanic with an OBD-II diagnostic scanner** to inspect engine health, transmission, and chassis integrity before paying.\n• **Online Reservation**: You can click **"Reserve / Inquire"** on any vehicle in `/showroom` to place a reservation hold or schedule a test viewing.',
    highlights: [
      'Direct sales of clean-title imported & local cars (0% auction fee)',
      'Verified VIN/Chassis numbers & GRA/ICUMS customs duty clearance',
      'Buyers welcome to bring mechanics with OBD-II scanners to Gbawe Yard',
      'Online reservation & direct showroom inquiry supported',
    ],
    suggestedLinks: [
      { label: 'Browse Vehicle Showroom', href: '/showroom' },
      { label: 'Read Vehicle Inspection Checklist', href: '/blog' },
      { label: 'Schedule Yard Inspection', href: '/contact' },
    ],
    followUpPrompts: [
      'What vehicles are currently available in the showroom?',
      'Are there any vehicles in upcoming auctions?',
      'What payment modes can I use to buy a car?',
    ],
    suggestLeadCapture: true,
  },
  {
    id: 'land-and-property',
    categoryLabel: 'Titled Land & Real Estate',
    title: 'Titled Land Parcels, Lands Commission Searches & Property Units',
    keywords: [
      'land',
      'lands',
      'plot',
      'plots',
      'parcel',
      'parcels',
      'acre',
      'acres',
      'site plan',
      'cadastral',
      'lands commission',
      'freehold',
      'leasehold',
      'property',
      'properties',
      'house',
      'houses',
      'home',
      'building',
      'real estate',
      'commercial',
      'residential',
      'townhouse',
      'warehouse',
      'east legon',
      'prampram',
      'oyibi',
      'litigation',
    ],
    phrases: [
      'buy land',
      'titled land',
      'land for sale',
      'properties for sale',
      'houses for sale',
      'is the land litigation free',
      'lands commission search',
      'site plan and indenture',
    ],
    answer:
      'Amen Mart offers both **Direct Titled Land Sales (`/land`)** and **Residential & Commercial Properties (`/properties`)**, alongside immovable real estate lots in our Judicial and Private auctions:\n\n• **100% Litigation-Free Due Diligence**: Every land parcel undergoes a tripartite official search across the **Lands Commission** (Survey & Mapping Division, Land Registration Division, and Public & Vested Lands Management Division) to confirm allodial title and zero encumbrances.\n• **Certified Cadastral Site Plans**: Every plot comes with an official surveyor-stamped cadastral site plan with Lands Commission coordinates—never unregistered hand-drawn sketches.\n• **Solicitor-Drafted Indentures & Deeds**: Upon full settlement, buyers receive a formal **Sale/Transfer Deed (`AM-TRF-2026-XXXX`)** and **Indenture** (*Freehold, Leasehold, or Registered Indenture*) ready for title registration.\n• ** Escorted Site Visits**: Our Realty Desk arranges escorted physical inspections to all land sites and property units across Greater Accra.',
    highlights: [
      'Tripartite Lands Commission official search on every parcel',
      'Licensed surveyor cadastral site plans & solicitor-drafted indentures',
      'Available across Freehold, Leasehold & Registered Indenture titles',
      'Escorted site inspections arranged from our Gbawe Head Office',
    ],
    suggestedLinks: [
      { label: 'Explore Titled Land Parcels', href: '/land' },
      { label: 'Explore Property Units', href: '/properties' },
      { label: 'Read Land Title Verification Guide', href: '/blog' },
    ],
    followUpPrompts: [
      'What land parcels or properties are currently available?',
      'How do I book a site visit for a land parcel?',
      'What documents do I receive after paying for land?',
    ],
    suggestLeadCapture: true,
  },
  {
    id: 'consignment-selling',
    categoryLabel: 'Asset Consignment & Valuations',
    title: 'How to Consign Vehicles, Property or Equipment with Amen Mart',
    keywords: [
      'consign',
      'consignment',
      'sell',
      'selling',
      'seller',
      'liquidate',
      'liquidation',
      'valuation',
      'appraise',
      'appraisal',
      'repossess',
      'fleet disposal',
      'partner',
    ],
    phrases: [
      'how can i sell my car',
      'consign an asset',
      'sell my property through amen mart',
      'asset valuation',
      'how to list my car in auction',
      'work with dr francis',
    ],
    answer:
      'Property owners, corporate fleet managers, financial institutions, law firms, and government agencies can consign assets with **Amen Mart Auctioning Services** for transparent valuation and rapid liquidation:\n\n1. **Request a Valuation Consultation**:\n   Contact **Dr. Francis Kwaku Yeboah’s Consignment Desk** at **`0548517277` / `0558314744`** or submit a **Consignment Inquiry** via our website.\n2. **Physical Inspection & Title Verification**:\n   Our valuation engineers inspect the vehicle, machinery, land, or building, verify ownership/customs/land title documents, and advise on a realistic **Reserve Price**.\n3. **Choose Auction or Direct Showroom Sale**:\n   • **Private Auction**: Your asset is cataloged, marketed in our public auction notices, and sold to the highest bidder above your reserve price.\n   • **Direct Showroom / Realty Listing**: Featured directly in our `/showroom`, `/land`, or `/properties` catalog.\n4. **Transparent Accounting & Payout**:\n   All buyer payments are tracked in the AmenDesk ledger with full audit trails and prompt consignor settlement.',
    highlights: [
      'Professional statutory valuations for Courts, Banks, Companies & Individuals',
      'Option of Public/Online Auction or Direct Showroom/Realty Sale',
      'Full KYC, reserve price protection & audited settlement payout',
    ],
    suggestedLinks: [
      { label: 'Submit Consignment Request', href: '/contact' },
      { label: 'Learn About Leadership', href: '/about' },
    ],
    followUpPrompts: [
      'Can I leave my contact details for Dr. Yeboah’s team to call me?',
      'What is the statutory fee on auction sales?',
      'Where is the Gbawe yard located for vehicle drop-off?',
    ],
    suggestLeadCapture: true,
  },
];

function formatGhs(amount: number): string {
  return `GH₵ ${Number(amount || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Generates an intelligent, context-aware response using the Amen Mart Knowledge Base
 * combined with live IndexedDB/Server inventory data.
 */
export function generateAmenAiResponse(
  rawQuery: string,
  inventory?: LiveInventorySnapshot,
  currentPathname?: string,
  options?: { id?: string; createdAt?: string }
): AmenAiResponse {
  const query = rawQuery.trim().toLowerCase();
  const nowIso = options?.createdAt ?? new Date().toISOString();
  const responseId =
    options?.id ?? `ai-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const activeLots = (inventory?.auctionLots || []).filter(
    (l) => l.status === 'ACTIVE' || l.status === 'UPCOMING'
  );
  const availableVehicles = (inventory?.dealershipVehicles || []).filter(
    (v) => v.status === 'AVAILABLE' || v.status === 'RESERVED'
  );
  const availableLand = (inventory?.landParcels || []).filter(
    (l) => l.status === 'AVAILABLE' || l.status === 'RESERVED'
  );
  const availableProps = (inventory?.propertyUnits || []).filter(
    (p) => p.status === 'AVAILABLE' || p.status === 'RESERVED'
  );

  // 1. Check if greeting or general help request
  const isGreetingOnly =
    /^(hi|hello|hey|good morning|good afternoon|good evening|akwaaba|greetings|help|start|menu|yo)\b[!.,?\s]*$/i.test(
      query
    );

  if (isGreetingOnly || !query) {
    const totalLiveAssets =
      activeLots.length + availableVehicles.length + availableLand.length + availableProps.length;

    const inventoryLine =
      totalLiveAssets > 0
        ? `Right now, we have **${activeLots.length} active/upcoming auction lots**, **${availableVehicles.length} showroom vehicles**, **${availableLand.length} titled land parcels**, and **${availableProps.length} property units** indexed on the platform.`
        : `Our catalog is synced directly with the **Gbawe Head Office & Yard ERP**. You can browse our 4 business lines or ask me to log a direct inquiry for our sales and auction desk.`;

    return {
      id: responseId,
      categoryLabel: 'Amen AI Concierge',
      answer: `**Akwaaba! Welcome to Amen Mart Auctioning Services.**\n\nI am the **Amen AI Assistant**, trained on all statutory rules, inventory, and procedures of Amen Mart (approved by the **Auctioneers Registration Board**, **Ministry of the Interior**, and **GAA**, led by **Dr. Francis Kwaku Yeboah**).\n\n${inventoryLine}\n\nHow may I assist you today? You can ask me about:\n• **Judicial, Government & Private Auctions** (bidding rules, 25% deposit & 14-day settlement)\n• **Showroom Cars** (0% auction fee, VIN verification & mechanic inspections)\n• **Titled Land & Real Estate Properties** (Lands Commission searches & site plans)\n• **Office Location, Payment Methods (Cash/MoMo/Bank/Paystack) & Consignments**`,
      highlights: [
        'Gbawe, Flower Junction, Accra • Hotlines: 0548517277 / 0558314744',
        'Mon–Fri: 8:00 AM – 5:00 PM • Sat: 9:00 AM – 2:00 PM',
        'Ask any question or request a direct staff callback below',
      ],
      suggestedLinks: [
        { label: 'Upcoming Auctions', href: '/auctions' },
        { label: 'Vehicle Showroom', href: '/showroom' },
        { label: 'Titled Land', href: '/land' },
        { label: 'Properties', href: '/properties' },
      ],
      followUpPrompts: [
        'What are the rules for the 25% deposit and 14-day balance?',
        'What vehicles or auction lots are currently available?',
        'Where is your office located and what are your phone numbers?',
      ],
      createdAt: nowIso,
    };
  }

  // 2. Check for explicit Live Inventory / Catalog Availability Queries
  const asksInventoryAvailability =
    /\b(available|in stock|current|currently|list|listing|listings|show me|what cars|which cars|any cars|any vehicles|upcoming auction|active auction|what lots|any land|what land|any properties|what properties|catalog|inventory|for sale|price of|how much is)\b/i.test(
      query
    );

  const mentionsShowroomOrCar =
    /\b(car|cars|vehicle|vehicles|showroom|suv|sedan|truck|toyota|honda|lexus|mercedes|benz|hyundai|kia|ford|nissan|pickup)\b/i.test(
      query
    );
  const mentionsAuction = /\b(auction|auctions|lot|lots|bid|bidding|judicial|government|sheriff)\b/i.test(
    query
  );
  const mentionsLand = /\b(land|lands|plot|plots|parcel|parcels|acre|acres|east legon|prampram|oyibi)\b/i.test(
    query
  );
  const mentionsProperty =
    /\b(property|properties|house|houses|home|homes|building|apartment|townhouse|warehouse|commercial|residential)\b/i.test(
      query
    );

  if (
    asksInventoryAvailability &&
    (mentionsShowroomOrCar || mentionsAuction || mentionsLand || mentionsProperty)
  ) {
    const matchedCards: AiInventoryCardItem[] = [];
    const sections: string[] = [];

    if (mentionsShowroomOrCar) {
      const matchingCars = availableVehicles.filter((v) => {
        const text = `${v.make} ${v.model} ${v.year} ${v.color} ${v.fuelType} ${v.description || ''}`.toLowerCase();
        // If user specified a make, filter by it; otherwise return all
        const specificMake = ['toyota', 'honda', 'lexus', 'mercedes', 'benz', 'hyundai', 'kia', 'ford', 'nissan', 'mitsubishi', 'land rover', 'range rover', 'bmw'].find(
          (m) => query.includes(m)
        );
        return specificMake ? text.includes(specificMake) : true;
      });

      if (matchingCars.length > 0) {
        sections.push(
          `**Showroom Vehicles (${matchingCars.length} Available — 0% Auction Fee)**:\n` +
            matchingCars
              .slice(0, 4)
              .map(
                (v) =>
                  `• **${v.year} ${v.make} ${v.model}** (${v.fuelType}, ${v.transmission}, ${v.mileageKm.toLocaleString()} km) — **${formatGhs(v.askingPriceGhs)}** [${v.status}]`
              )
              .join('\n')
        );
        matchingCars.slice(0, 2).forEach((v) => {
          matchedCards.push({
            id: v.id,
            type: 'SHOWROOM',
            title: `${v.year} ${v.make} ${v.model}`,
            subtitle: `${v.fuelType} • ${v.transmission} • ${v.mileageKm.toLocaleString()} km`,
            priceLabel: 'Asking Price (0% Fee)',
            priceValueGhs: v.askingPriceGhs,
            badgeText: v.status,
            location: v.location || 'Gbawe Showroom',
            href: '/showroom',
          });
        });
      } else {
        sections.push(
          `**Car Dealership Showroom**:\nCurrently, our live online showroom catalog is awaiting the next batch of inspected vehicle uploads from the Gbawe Yard. Remember: direct showroom vehicles carry **0% auction fee**, full VIN/Chassis verification, and GRA/ICUMS customs clearance. You can request a specific vehicle make/model below or call **0548517277** for incoming stock.`
        );
      }
    }

    if (mentionsAuction) {
      const catFilter = query.includes('judicial')
        ? 'JUDICIAL'
        : query.includes('government')
        ? 'GOVERNMENT'
        : query.includes('private')
        ? 'PRIVATE'
        : null;

      const matchingLots = activeLots.filter((l) => (catFilter ? l.category === catFilter : true));

      if (matchingLots.length > 0) {
        sections.push(
          `**Active & Upcoming Auction Lots (${matchingLots.length} Listed)**:\n` +
            matchingLots
              .slice(0, 4)
              .map(
                (l) =>
                  `• **${l.lotNumber}: ${l.title}** [${l.category} • ${l.assetType}] — Starting/Current Bid: **${formatGhs(l.currentBidGhs || l.startingBidGhs)}** (${l.yardLocation})`
              )
              .join('\n')
        );
        matchingLots.slice(0, 2).forEach((l) => {
          matchedCards.push({
            id: l.id,
            type: 'AUCTION',
            title: `${l.lotNumber}: ${l.title}`,
            subtitle: `${l.category} Auction • ${l.assetType}`,
            priceLabel: l.currentBidGhs > 0 ? 'Current Bid' : 'Starting Bid',
            priceValueGhs: l.currentBidGhs || l.startingBidGhs,
            badgeText: l.category,
            location: l.yardLocation || 'Gbawe Auction Yard',
            href: `/auctions?cat=${l.category}`,
          });
        });
      } else {
        sections.push(
          `**Public & Online Auction Notices**:\nNew **Judicial, Government, and Private** auction lots are currently being cataloged by our Gbawe Auction Desk prior to gazette publication. All auction lots require a **25% deposit** at the hammer drop and **14 calendar days** to settle the remaining 75% balance (with a 7% statutory auction fee).`
        );
      }
    }

    if (mentionsLand) {
      if (availableLand.length > 0) {
        sections.push(
          `**Titled Land Parcels (${availableLand.length} Available)**:\n` +
            availableLand
              .slice(0, 4)
              .map(
                (l) =>
                  `• **${l.title}** (${l.location} • ${l.sizeAcres} Acres • ${l.titleType}) — **${formatGhs(l.priceGhs)}** [${l.status}]`
              )
              .join('\n')
        );
        availableLand.slice(0, 2).forEach((l) => {
          matchedCards.push({
            id: l.id,
            type: 'LAND',
            title: l.title,
            subtitle: `${l.sizeAcres} Acres • ${l.titleType} Title`,
            priceLabel: 'Parcel Price',
            priceValueGhs: l.priceGhs,
            badgeText: l.titleType,
            location: l.location,
            href: '/land',
          });
        });
      } else {
        sections.push(
          `**Titled Land Parcels**:\nOur Realty Desk is currently updating the online parcel registry with newly surveyed plots verified with the **Lands Commission**. Every parcel includes a licensed surveyor cadastral site plan and solicitor-drafted Indenture. Leave your preferred location below to schedule a site inspection.`
        );
      }
    }

    if (mentionsProperty) {
      if (availableProps.length > 0) {
        sections.push(
          `**Residential & Commercial Properties (${availableProps.length} Available)**:\n` +
            availableProps
              .slice(0, 4)
              .map(
                (p) =>
                  `• **${p.title}** (${p.location} • ${p.propertyType}${p.bedrooms ? ` • ${p.bedrooms} Bed` : ''}) — **${formatGhs(p.priceGhs)}** [${p.status}]`
              )
              .join('\n')
        );
        availableProps.slice(0, 2).forEach((p) => {
          matchedCards.push({
            id: p.id,
            type: 'PROPERTY',
            title: p.title,
            subtitle: `${p.propertyType}${p.bedrooms ? ` • ${p.bedrooms} Bedrooms` : ''}`,
            priceLabel: 'Listed Price',
            priceValueGhs: p.priceGhs,
            badgeText: p.propertyType,
            location: p.location,
            href: '/properties',
          });
        });
      } else {
        sections.push(
          `**Commercial & Residential Properties**:\nOur Property Desk is currently onboarding verified residential homes and commercial units across Accra. Contact us at **0548517277** or log an inquiry below to receive our private property portfolio.`
        );
      }
    }

    return {
      id: responseId,
      categoryLabel: 'Live ERP Catalog Check',
      answer:
        sections.join('\n\n') +
        `\n\nWould you like to **book an inspection at Gbawe Flower Junction** or leave your contact details so our sales desk can reach out to you right away?`,
      highlights: [
        'Showroom Cars: 0% auction fee, VIN & GRA Customs verified',
        'Auctions: 25% hammer deposit, 14-day balance window, 7% statutory fee',
        'Land & Properties: Lands Commission verified site plans & indentures',
      ],
      inventoryItems: matchedCards.slice(0, 3),
      suggestedLinks: [
        { label: 'Explore Car Showroom', href: '/showroom' },
        { label: 'View Auction Notices', href: '/auctions' },
        { label: 'Titled Land Parcels', href: '/land' },
        { label: 'Properties Catalog', href: '/properties' },
      ],
      followUpPrompts: [
        'How does the 25% deposit and 14-day payment plan work?',
        'Can I bring my mechanic to inspect a car at Gbawe?',
        'What payment methods do you accept?',
      ],
      suggestLeadCapture: true,
      createdAt: nowIso,
    };
  }

  // 3. Score against all Knowledge Base Topics
  const scoredTopics = AMEN_KNOWLEDGE_TOPICS.map((topic) => {
    let score = 0;

    // Exact phrase matches carry high weight
    for (const phrase of topic.phrases) {
      if (query.includes(phrase.toLowerCase())) {
        score += 12;
      }
    }

    // Keyword matches
    for (const kw of topic.keywords) {
      const kwLower = kw.toLowerCase();
      if (query.includes(kwLower)) {
        // Word boundary bonus
        const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        score += regex.test(query) ? 5 : 2;
      }
    }

    // Contextual page boost
    if (currentPathname) {
      if (currentPathname.startsWith('/auctions') && topic.id.includes('auction')) score += 1;
      if (currentPathname.startsWith('/showroom') && topic.id.includes('car')) score += 1;
      if (currentPathname.startsWith('/land') && topic.id.includes('land')) score += 1;
      if (currentPathname.startsWith('/properties') && topic.id.includes('land')) score += 1;
    }

    return { topic, score };
  }).sort((a, b) => b.score - a.score);

  const primaryMatch = scoredTopics[0];
  const secondaryMatch = scoredTopics[1];

  if (primaryMatch && primaryMatch.score >= 3) {
    // Check if the user asked a compound question hitting 2 distinct high-confidence topics
    if (secondaryMatch && secondaryMatch.score >= 8 && secondaryMatch.topic.id !== primaryMatch.topic.id) {
      const combinedLinks = [
        ...primaryMatch.topic.suggestedLinks,
        ...secondaryMatch.topic.suggestedLinks,
      ].filter((v, idx, arr) => arr.findIndex((item) => item.href === v.href) === idx);

      return {
        id: responseId,
        categoryLabel: `${primaryMatch.topic.categoryLabel} • ${secondaryMatch.topic.categoryLabel}`,
        answer: `${primaryMatch.topic.answer}\n\n---\n\n${secondaryMatch.topic.answer}`,
        highlights: [
          ...primaryMatch.topic.highlights.slice(0, 2),
          ...secondaryMatch.topic.highlights.slice(0, 2),
        ],
        suggestedLinks: combinedLinks.slice(0, 4),
        followUpPrompts: primaryMatch.topic.followUpPrompts,
        suggestLeadCapture:
          primaryMatch.topic.suggestLeadCapture || secondaryMatch.topic.suggestLeadCapture,
        createdAt: nowIso,
      };
    }

    return {
      id: responseId,
      categoryLabel: primaryMatch.topic.categoryLabel,
      answer: primaryMatch.topic.answer,
      highlights: primaryMatch.topic.highlights,
      suggestedLinks: primaryMatch.topic.suggestedLinks,
      followUpPrompts: primaryMatch.topic.followUpPrompts,
      suggestLeadCapture: primaryMatch.topic.suggestLeadCapture,
      createdAt: nowIso,
    };
  }

  // 4. Intelligent Comprehensive Fallback when query is highly specific or outside standard keywords
  return {
    id: responseId,
    categoryLabel: 'Amen Mart Advisory Desk',
    answer:
      `Thank you for your inquiry regarding **"${rawQuery.trim()}"**.\n\nHere are the core essentials of **Amen Mart Auctioning Services** that may help answer your question:\n\n• **Statutory Authority**: Licensed by the **Auctioneers Registration Board (ARB)** and the **Ministry of the Interior (PNDCL 230)**, and affiliated with the **Ghana Auctioneers Association (GAA)** under Managing Director **Dr. Francis Kwaku Yeboah**.\n• **4 Business Lines**:\n  1. **Auctions** (*Judicial, Government & Private* — Movable & Immovable assets, **7% statutory auction fee**, **25% hammer deposit**, and **14-day balance settlement window**).\n  2. **Car Dealership Showroom** (Direct imported/local vehicles at Gbawe with **0% auction fee**, verified VIN & GRA customs clearance).\n  3. **Titled Land Parcels** (Lands Commission verified with cadastral site plans & solicitor indentures).\n  4. **Real Estate Properties** (Residential & commercial units for sale/lease).\n• **Location & Hotlines**: **Gbawe, Flower Junction, Accra** (Mon–Fri 8:00 AM – 5:00 PM, Sat 9:00 AM – 2:00 PM) • Call/WhatsApp **0548517277** / **0558314744** or email **amenmart2291@gmail.com**.\n\nYou can also click **"Leave an Inquiry for Staff"** below and our Gbawe desk will contact you directly.`,
    highlights: [
      'Gbawe, Flower Junction, Accra • 0548517277 / 0558314744',
      '25% deposit & 14-day settlement on auctions • 0% fee on showroom cars',
      'Cash, MoMo (MTN/Telecel/AirtelTigo), Bank Transfer & Paystack accepted',
    ],
    suggestedLinks: [
      { label: 'Contact Auction Desk', href: '/contact' },
      { label: 'View Auctions', href: '/auctions' },
      { label: 'Car Showroom', href: '/showroom' },
      { label: 'Land & Properties', href: '/land' },
    ],
    followUpPrompts: [
      'How do Judicial, Government, and Private auctions work?',
      'What are the 25% deposit and 14-day payment rules?',
      'How can I consign a vehicle or property for sale?',
    ],
    suggestLeadCapture: true,
    createdAt: nowIso,
  };
}

export interface ProactiveVisitorGreeting {
  badge: string;
  headline: string;
  message: string;
  quickReplies: Array<{
    label: string;
    prompt: string;
  }>;
}

/**
 * Generates a contextual proactive greeting when a visitor is detected on any website page.
 */
export function getProactiveVisitorGreeting(
  pathname?: string,
  inventory?: LiveInventorySnapshot,
  isReturningVisitor?: boolean
): ProactiveVisitorGreeting {
  const path = (pathname || '/').toLowerCase();
  const activeLotsCount = (inventory?.auctionLots || []).filter(
    (l) => l.status === 'ACTIVE' || l.status === 'UPCOMING'
  ).length;
  const showroomCount = (inventory?.dealershipVehicles || []).filter(
    (v) => v.status === 'AVAILABLE' || v.status === 'RESERVED'
  ).length;
  const landCount = (inventory?.landParcels || []).filter(
    (l) => l.status === 'AVAILABLE' || l.status === 'RESERVED'
  ).length;
  const propCount = (inventory?.propertyUnits || []).filter(
    (p) => p.status === 'AVAILABLE' || p.status === 'RESERVED'
  ).length;

  const welcomePrefix = isReturningVisitor ? 'Welcome back to Amen Mart!' : 'Akwaaba! Welcome to Amen Mart.';

  if (path.startsWith('/showroom')) {
    return {
      badge: 'Car Showroom Concierge',
      headline: `${welcomePrefix} Looking for a vehicle?`,
      message:
        showroomCount > 0
          ? `We currently have ${showroomCount} verified vehicle(s) in our Gbawe Showroom with 0% auction fee and full GRA/ICUMS customs clearance. How can I help you today?`
          : 'Every vehicle in our Gbawe Showroom is sold directly with 0% auction fee and verified VIN/Customs clearance. Would you like to check incoming stock or book an inspection?',
      quickReplies: [
        {
          label: 'Show available cars',
          prompt: 'What vehicles are currently available in the showroom?',
        },
        {
          label: '0% Fee vs. 7% Auction Fee',
          prompt: 'What is the difference in fees between showroom cars and auction lots?',
        },
        {
          label: 'Mechanic inspection rules',
          prompt: 'Can I bring my mechanic with an OBD-II scanner to inspect a car at Gbawe?',
        },
      ],
    };
  }

  if (path.startsWith('/auctions')) {
    return {
      badge: 'Auction Desk Advisor',
      headline: `${welcomePrefix} Interested in bidding?`,
      message:
        activeLotsCount > 0
          ? `We have ${activeLotsCount} active/upcoming auction lot(s) across Judicial, Government & Private categories. Need help with the 25% deposit or 14-day settlement rule?`
          : 'We conduct licensed Judicial, Government & Private auctions under PNDCL 230. Ask me about our 25% hammer deposit, 14-day balance window, or bidder registration!',
      quickReplies: [
        {
          label: '25% Deposit & 14-Day Rule',
          prompt: 'How do the 25% hammer deposit and 14-day balance settlement rules work?',
        },
        {
          label: 'Judicial vs. Govt Auctions',
          prompt: 'Explain the 3 auction categories: Judicial, Government, and Private auctions.',
        },
        {
          label: 'Check active auction lots',
          prompt: 'What auction lots are currently available or upcoming?',
        },
      ],
    };
  }

  if (path.startsWith('/land')) {
    return {
      badge: 'Titled Land Advisor',
      headline: `${welcomePrefix} Exploring titled land?`,
      message:
        landCount > 0
          ? `We have ${landCount} litigation-free land parcel(s) verified with the Lands Commission. Would you like to review plot prices or schedule an escorted site visit?`
          : 'All Amen Mart land parcels undergo tripartite Lands Commission searches and include certified cadastral site plans. How can I assist with your land acquisition?',
      quickReplies: [
        {
          label: 'View available plots',
          prompt: 'What titled land parcels are currently available for sale?',
        },
        {
          label: 'Lands Commission verification',
          prompt: 'How do you verify land titles and site plans at the Lands Commission?',
        },
        {
          label: 'Book a site visit',
          prompt: 'Where is your office and how do I schedule an escorted land site visit?',
        },
      ],
    };
  }

  if (path.startsWith('/properties')) {
    return {
      badge: 'Real Estate Concierge',
      headline: `${welcomePrefix} Browsing properties?`,
      message:
        propCount > 0
          ? `We have ${propCount} verified residential and commercial property unit(s) listed. Ask me about pricing, Deeds of Conveyance, or booking a property walkthrough.`
          : 'We offer verified residential homes, townhouses, and commercial units with solicitor-drafted Deeds of Conveyance. How can I help you today?',
      quickReplies: [
        {
          label: 'Available property units',
          prompt: 'What residential or commercial properties are currently available?',
        },
        {
          label: 'Transfer Deeds & Indentures',
          prompt: 'What documents do I receive after paying for an immovable property?',
        },
        {
          label: 'Payment modes accepted',
          prompt: 'What payment methods do you accept for property purchases?',
        },
      ],
    };
  }

  if (path.startsWith('/contact')) {
    return {
      badge: 'Gbawe Front Desk',
      headline: 'Need instant answers or a callback?',
      message:
        'Our Gbawe Flower Junction Yard & Cash Office is open Mon–Fri (8am–5pm) and Sat (9am–2pm). Ask me any question right now or log a priority callback!',
      quickReplies: [
        {
          label: 'Office location & hotlines',
          prompt: 'Where is your office located and what are your direct phone and WhatsApp numbers?',
        },
        {
          label: 'Consign a car or property',
          prompt: 'How can I consign a vehicle or property for sale with Dr. Francis Kwaku Yeboah?',
        },
        {
          label: 'How to register as a bidder',
          prompt: 'What payment methods do you accept and what ID is required for KYC?',
        },
      ],
    };
  }

  return {
    badge: 'Online Now • Gbawe Desk',
    headline: `${welcomePrefix} How may I help you today?`,
    message:
      'I am your Amen AI Concierge—trained on Judicial/Govt/Private Auctions, 0%-Fee Showroom Cars, Titled Land, and our 14-Day Settlement Rules.',
    quickReplies: [
      {
        label: 'How auctions & 14-day rule work',
        prompt: 'How do the 25% hammer deposit and 14-day balance settlement rules work?',
      },
      {
        label: 'Browse Showroom Cars (0% Fee)',
        prompt: 'What cars are available in the showroom and is there an auction fee on showroom cars?',
      },
      {
        label: 'Location & Contact Numbers',
        prompt: 'Where is the Amen Mart office and yard located, and what are your viewing hours and phone numbers?',
      },
    ],
  };
}

/**
 * Full system prompt for optional server-side LLM enrichment (/api/ai/assistant).
 */
export const AMEN_MART_SYSTEM_PROMPT = `You are the official "Amen AI Assistant" (Amen AI Concierge) for Amen Mart Auctioning Services (Amen Mart Limited) in Accra, Ghana.
Always be authoritative, polite, concise, and helpful. Use Ghana Cedis (GH₵) for all currency references.

CORE FACTS ABOUT AMEN MART:
1. Statutory Licensing & Leadership:
   - Approved by the Auctioneers Registration Board (ARB) and the Ministry of the Interior under PNDCL 230 and Ghana's Constitution.
   - Active member of the Ghana Auctioneers Association (GAA).
   - Led by Managing Director & Licensed Principal Auctioneer Dr. Francis Kwaku Yeboah (popularly called "Mr. Yeboah"), with 10+ years of industry leadership (since 2016) and 2x winner of the Modern Gospel Awards (MOGA 2024 & 2025) Philanthropist of the Year.
2. Location, Address, Contacts & Hours:
   - Physical Location (Head Office, Holding Yard, Dealership Showroom & Cash Office): Gbawe, Flower Junction, Accra, Ghana.
   - Postal Address: P. O. Box DC 1013, Dansoman, Accra — Ghana.
   - Telephone & WhatsApp: 0548517277 / 0558314744 (+233 54 851 7277 / +233 55 831 4744).
   - Official Email: amenmart2291@gmail.com.
   - Operating Hours: Monday – Friday: 8:00 AM – 5:00 PM; Saturday: 9:00 AM – 2:00 PM (Closed Sundays).
3. Four Core Business Lines:
   - Public & Online Auctions (/auctions):
     * 3 Categories: Judicial (High Court / Circuit Court Sheriff Writs of Execution with Court Case No. & Sheriff Ref), Government (State/Ministry fleet & equipment disposals, mainly movable), and Private (Corporate, bank & individual consignments).
     * 2 Asset Types: Movable (Vehicles with Chassis/VIN & GRA/ICUMS customs docs; plus industrial machinery, generators, furniture) and Immovable (Titled land parcels and buildings).
     * Fee: Standard 7% statutory auction fee applies across all auction categories.
   - Car Dealership Showroom (/showroom):
     * Direct sales of Amen Mart's imported and local vehicles.
     * 0% Auction Fee (no 7% buyer's premium).
     * Full VIN/Chassis and GRA/ICUMS duty verification; buyers are encouraged to bring certified mechanics with OBD-II scanners to the Gbawe yard.
   - Titled Land Parcels (/land):
     * Direct sales of litigation-free plots verified via tripartite Lands Commission searches (Survey & Mapping, Land Registration, Public & Vested Lands Management).
     * Includes certified cadastral site plans and solicitor-drafted Indentures (Freehold, Leasehold, Indenture).
   - Commercial & Residential Properties (/properties):
     * Direct sales and leases of houses, townhouses, commercial offices, and warehouses.
4. Bidding, 25% Deposit, 14-Day Settlement & Disposal Documents:
   - Winning auction bidders pay a mandatory 25% non-refundable deposit immediately at the drop of the hammer.
   - Buyers have exactly 14 calendar days (2 weeks) to pay the remaining 75% balance (in one payment or multiple instalments).
   - Assets and documents are NEVER released until 100% of the balance is paid. Overdue lots after 14 days (without Auction Manager extension) face deposit forfeiture and re-auctioning.
   - Disposal Documents upon 100% settlement:
     * Movable Assets -> Official A5 Gate Release Waybill (AM-WB-2026-XXXX) + Certificate of Sale + Final Settlement Receipt (AM-RCP-2026-XXXX) for DVLA transfer and gate exit.
     * Immovable Assets -> Formal Sale/Transfer Deed (AM-TRF-2026-XXXX) + Cadastral Site Plan / Indenture + Final Settlement Receipt for Lands Commission registration.
5. Payment Modes & KYC:
   - Accepted Payments: Cash (at Gbawe Cash Office), Mobile Money (MTN MoMo, Telecel/Vodafone Cash, AirtelTigo via Hubtel), Bank Transfer / Certified Draft (GCB Bank), and Visa/Mastercard via Paystack.
   - Mandatory KYC: Valid Ghana Card (GHA-XXXXXXXXX-X) required for bidder registration, vehicle release, and land indenture execution.`;

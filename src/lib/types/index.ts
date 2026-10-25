export type AuctionCategory = 'PRIVATE' | 'GOVERNMENT' | 'JUDICIAL';
export type AssetType = 'MOVABLE' | 'IMMOVABLE';
export type MovableSubType = 'VEHICLE' | 'OTHER_MOVABLE';
export type ImmovableSubType = 'LAND' | 'BUILDING';

export type LotStatus =
  | 'UPCOMING'
  | 'ACTIVE'
  | 'AWAITING_BALANCE'
  | 'FULLY_PAID'
  | 'DISPOSED'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'MOMO' | 'BANK_TRANSFER' | 'CARD_PAYSTACK';
export type MoMoNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export interface AuctionLot {
  id: string;
  eventId: string;
  lotNumber: string;
  title: string;
  category: AuctionCategory;
  assetType: AssetType;
  movableSubType?: MovableSubType;
  immovableSubType?: ImmovableSubType;

  // Movable Vehicle specifics
  chassisNumber?: string;
  registrationNumber?: string;
  fuelType?: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  make?: string;
  model?: string;
  year?: number;
  mileageKm?: number;

  // Movable Other specifics (Equipment, Machinery, Furniture)
  serialOrTagNumber?: string;
  quantity?: number;
  equipmentType?: string;

  // Immovable Land / Building specifics
  parcelReference?: string;
  titleReference?: string;
  locationArea?: string;
  sizeDimensions?: string;
  sitePlanDocUrl?: string;

  // Judicial Mandatory Compliance Fields
  courtCaseNumber?: string;
  sheriffInstructionRef?: string;
  courtOrderDocUrl?: string;

  // Common specifications & condition
  conditionNotes: string;
  photos: string[];
  yardLocation: string;

  // Pricing & Bidding
  reservePriceGhs: number;
  startingBidGhs: number;
  currentBidGhs: number;
  hammerPriceGhs?: number;
  marginRatePercent: number; // strictly 7% default across all categories
  marginFeeGhs?: number;

  // Winning bidder & settlement
  winningBidderId?: string;
  winningBidderName?: string;
  winningBidderPhone?: string;

  // 14-day instalment settlement
  depositAmountGhs?: number;
  balanceDueGhs?: number;
  balanceDueDate?: string; // ISO string 14 days after hammer
  status: LotStatus;
  extensionCount: number;
  extensionReason?: string;

  // Disposal documents
  waybillId?: string;
  saleTransferDocId?: string;

  createdAt: string;
  updatedAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface PaymentPlan {
  id: string;
  referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY';
  referenceId: string;
  referenceTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;

  totalPriceGhs: number;
  depositPaidGhs: number;
  balanceRemainingGhs: number;
  initialDueDate: string; // createdAt + 14 days
  currentDueDate: string; // extended if granted
  status: 'AWAITING_BALANCE' | 'PAID_IN_FULL' | 'OVERDUE' | 'EXTENDED';

  extensions: Array<{
    extendedBy: string;
    extendedAt: string;
    newDueDate: string;
    reason: string;
  }>;

  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. AM-RCP-2026-0012
  paymentPlanId?: string;
  referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL';
  referenceId: string;
  referenceTitle: string;

  customerId: string;
  customerName: string;
  customerPhone: string;

  amountPaidGhs: number;
  paymentMethod: PaymentMethod;
  momoNetwork?: MoMoNetwork;
  transactionReference?: string;

  totalPaidToDateGhs: number;
  balanceRemainingGhs: number;
  balanceDueDate?: string;

  splitPayments?: PaymentSplit[];

  cashierName: string;
  issuedLocation: string;
  printedAt: string;
  depositStatus?: 'UNDEPOSITED' | 'DEPOSITED';
  bankDepositId?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface Waybill {
  id: string;
  waybillNumber: string; // e.g. AM-WB-2026-0045
  lotId: string;
  lotNumber: string;
  assetDescription: string;
  identifier: string; // Chassis No. or Serial/Tag No.
  registrationNumber?: string;
  quantity: number;

  buyerName: string;
  buyerPhone: string;
  driverName: string;
  driverPhone: string;
  driverGhanaCard?: string;
  vehiclePlateNo: string; // Transporting vehicle plate
  destinationAddress: string;

  authorizedBy: string;
  gateOfficerName?: string;
  releasedAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface SaleTransferDoc {
  id: string;
  docNumber: string; // e.g. AM-TRF-2026-0008
  lotId?: string;
  landId?: string;
  propertyId?: string;
  parcelReference: string;
  titleReference: string;
  locationArea: string;
  sizeDimensions: string;

  buyerName: string;
  buyerGhanaCard: string;
  buyerPhone: string;
  buyerAddress: string;

  considerationAmountGhs: number;
  courtCaseNumber?: string;
  sheriffInstructionRef?: string;

  lawyerWitnessName?: string;
  authorizedOfficer: string;
  executedDate: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export type LeadSource =
  | 'CONTACT_PAGE'
  | 'SHOWROOM'
  | 'AUCTIONS'
  | 'LAND'
  | 'PROPERTY'
  | 'PORTAL'
  | 'DIRECT';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CONVERTED';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  ghanaCardNumber: string;
  address: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  kycVerified: boolean;
  kycDocumentUrl?: string;
  notes?: string;
  createdAt: string;

  // Inbound Leads & Website Inquiries
  leadSource?: LeadSource;
  leadStatus?: LeadStatus;
  inquiryType?: string;
  inquirySubject?: string;
  inquiryMessage?: string;
}

export interface DealershipVehicle {
  id: string;
  vin: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  transmission: 'AUTOMATIC' | 'MANUAL';
  mileageKm: number;
  color: string;
  landedCostGhs: number;
  askingPriceGhs: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  photos: string[];
  description: string;
  featured: boolean;
  location: string;
  createdAt: string;
}

export interface MediaAttachment {
  id: string;
  entityType: 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'AUCTION';
  entityId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  dataUrl?: string;
  remoteUrl?: string;
  isPrimary: boolean;
  caption?: string;
  syncStatus: 'LOCAL' | 'UPLOADING' | 'SYNCED' | 'FAILED';
  createdAt: string;
}

export interface LandParcel {
  id: string;
  siteRef: string;
  title: string;
  location: string;
  sizeAcres: number;
  priceGhs: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  titleType: 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE';
  features: string[];
  description: string;
  photos: string[];
  sitePlanUrl?: string;
  indentureDocUrl?: string;
  createdAt: string;
}

export interface PropertyUnit {
  id: string;
  unitRef: string;
  title: string;
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  priceGhs: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  features: string[];
  description: string;
  photos: string[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'VEHICLE' | 'EQUIPMENT' | 'PART' | 'MATERIAL';
  location: 'AUCTION_YARD' | 'DEALERSHIP_SHOWROOM' | 'WORKSHOP';
  quantity: number;
  landedCostGhs: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR';
  lastCountDate: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  transferredBy: string;
  timestamp: string;
  reason: string;
}

export interface SyncOutboxItem {
  id: string;
  entity: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  tenantId?: string;
}

// ==========================================
// ACCOUNTING & FINANCIAL MANAGEMENT TYPES
// ==========================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type AccountCategory =
  | 'CURRENT_ASSET'
  | 'NON_CURRENT_ASSET'
  | 'CURRENT_LIABILITY'
  | 'LONG_TERM_LIABILITY'
  | 'EQUITY'
  | 'OPERATING_REVENUE'
  | 'OTHER_REVENUE'
  | 'COST_OF_SALES'
  | 'OPERATING_EXPENSE'
  | 'ADMIN_EXPENSE'
  | 'FINANCIAL_EXPENSE';

export interface Account {
  id: string;
  code: string; // e.g. "1010", "1030", "1050", "2010", "4010", "6010"
  name: string;
  type: AccountType;
  category: AccountCategory;
  balanceGhs: number;
  description: string;
  isSystem: boolean;
  currency: 'GHS';
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debitGhs: number;
  creditGhs: number;
  classId?: string;
  className?: string;
  locationId?: string;
  locationName?: string;
  itemId?: string;
  customerId?: string;
  vendorId?: string;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. "JE-2026-0001"
  date: string;
  reference: string; // Receipt number, Expense number, or manual memo
  description: string;
  lines: JournalEntryLine[];
  totalAmountGhs: number;
  createdBy: string;
  status: 'POSTED' | 'DRAFT';
  createdAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export type ExpenseCategory =
  | 'YARD_OPERATIONS'
  | 'SECURITY'
  | 'JUDICIAL_LEGAL'
  | 'TOWING_LOGISTICS'
  | 'MARKETING'
  | 'UTILITIES'
  | 'TELECOMS'
  | 'PAYROLL_CASUAL'
  | 'FEES_COMMISSIONS'
  | 'REPAIRS_MAINTENANCE'
  | 'OTHER';

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. "EXP-2026-0001"
  date: string;
  category: ExpenseCategory;
  expenseAccountId: string;
  expenseAccountName: string;
  payee: string;
  amountGhs: number;
  paymentMethod: PaymentMethod;
  paidFromAccountId: string;
  paidFromAccountName: string;
  referenceNumber?: string;
  description: string;
  recordedBy: string;
  approvedBy?: string;
  status: 'PAID' | 'PENDING_APPROVAL';
  receiptDocUrl?: string;
  createdAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceGhs: number;
  totalGhs: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerGhanaCard?: string;
  referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL';
  referenceId?: string;
  referenceTitle?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotalGhs: number;
  vatGhs: number; // 15%
  nhilGhs: number; // 2.5%
  getfundGhs: number; // 2.5%
  covidGhs: number; // 1%
  totalAmountGhs: number;
  amountPaidGhs: number;
  balanceDueGhs: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  notes?: string;
  createdAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface CashShift {
  id: string;
  shiftNumber: string;
  cashierName: string;
  facilityLocation: string;
  shiftDate: string;
  openingFloatGhs: number;
  cashCollectionsGhs: number;
  momoCollectionsGhs: number;
  bankCollectionsGhs: number;
  cardCollectionsGhs: number;
  cashDisbursementsGhs: number;
  expectedCashInDrawerGhs: number;
  actualCashInDrawerGhs: number;
  varianceGhs: number;
  notes?: string;
  status: 'OPEN' | 'BALANCED' | 'CLOSED';
  closedAt?: string;
}

export interface PaymentSplit {
  method: PaymentMethod;
  amountGhs: number;
  momoNetwork?: MoMoNetwork;
  bankName?: string;
  transactionReference?: string;
}

// ==========================================
// QUICKBOOKS ENTERPRISE ACCOUNTING ARCHITECTURE
// ==========================================

export type ItemType = 'SERVICE' | 'INVENTORY' | 'NON_INVENTORY' | 'FEE' | 'TAX';

export interface AccountingItem {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  description: string;
  incomeAccountId: string; // Account credited on sale (e.g. 4010 Auction Margin)
  expenseAccountId?: string; // Account debited when cost incurred (e.g. 5010 COGS)
  assetAccountId?: string; // Account debited when inventoried (e.g. 1300 Vehicle Inventory)
  defaultUnitPriceGhs?: number;
  isTaxable: boolean; // Subject to standard GRA VAT/NHIL/GETFund/COVID levies
  category: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'OPERATIONS';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BusinessLineCode =
  | 'AUCTION_PRIVATE'
  | 'AUCTION_GOVERNMENT'
  | 'AUCTION_JUDICIAL'
  | 'DEALERSHIP'
  | 'LAND'
  | 'PROPERTY'
  | 'ADMIN';

export interface AccountingClass {
  id: string;
  code: string;
  name: string;
  businessLine: BusinessLineCode;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccountingLocation {
  id: string;
  code: string;
  name: string;
  facilityType: 'AUCTION_YARD' | 'SHOWROOM' | 'HEAD_OFFICE' | 'LAND_SITE';
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface BankDeposit {
  id: string;
  depositNumber: string; // e.g. "DEP-2026-0001"
  depositDate: string;
  targetBankAccountId: string; // e.g. 'acc-1050' (GCB Bank Operating Account)
  targetBankAccountName: string;
  totalAmountGhs: number;
  sourceAccountType: 'CASH_CLEARING' | 'MOMO_CLEARING' | 'MIXED';
  clearedReceiptIds: string[]; // IDs of receipts cleared from 1015 / 1035
  bankSlipReference?: string; // Teller reference / deposit slip #
  depositorName: string;
  depositedByRole: 'ACCOUNTANT' | 'OWNER' | 'ADMIN';
  notes?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
  createdAt: string;
}

export interface LinkedTxn {
  txnId: string;
  txnType: 'INVOICE' | 'PAYMENT' | 'BANK_DEPOSIT' | 'AUCTION_LOT';
  docNumber: string;
  amountAppliedGhs: number;
  appliedAt: string;
}

export * from './hr';



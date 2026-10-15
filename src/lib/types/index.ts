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
  referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY';
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

  cashierName: string;
  issuedLocation: string;
  printedAt: string;
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
  sitePlanUrl?: string;
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
}

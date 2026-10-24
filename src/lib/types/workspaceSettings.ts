import type { AppRole } from './auth';

export interface WorkspaceSettings {
  organizationName: string;
  shortName: string;
  tagline: string;
  contactEmail: string;
  phone: string;
  address: string;
  gaaLicenseNumber: string;
  tinNumber: string;
  currency: string;
  settlementDays: number;
  buyerRegistrationFee: number;
  defaultBuyersPremium: number;
  taxRateVAT: number;
  receiptPrinterWidth: '80mm' | '58mm' | 'A4';
  autoPrintReceipt: boolean;
  enableSmsReceiptAlerts: boolean;
  updatedAt?: string;
}

export interface StaffInvitation {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: AppRole;
  phone: string;
  invitedBy: string;
  invitedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  inviteCode: string;
}

export const DEFAULT_WORKSPACE_SETTINGS: Record<string, WorkspaceSettings> = {
  'amen-mart-live': {
    organizationName: 'Amen Mart Ghana Limited',
    shortName: 'Amen Mart',
    tagline: 'Licensed Auctioneers & Asset Liquidation Specialists',
    contactEmail: 'amenmart2291@gmail.com',
    phone: '0548517277 / 0558314744',
    address: 'Gbawe, Flower Junction, Accra — Ghana',
    gaaLicenseNumber: 'GAA/ACC/2026-044',
    tinNumber: 'C000294819X',
    currency: 'GH₵',
    settlementDays: 14,
    buyerRegistrationFee: 200,
    defaultBuyersPremium: 10,
    taxRateVAT: 0,
    receiptPrinterWidth: '80mm',
    autoPrintReceipt: true,
    enableSmsReceiptAlerts: true,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  'amen-mart-sandbox': {
    organizationName: 'Amen Mart Demo Yard',
    shortName: 'Demo Yard',
    tagline: 'Dev Surge Client Demonstration & Sandbox Testing Workspace',
    contactEmail: 'devsurgeinfotech@gmail.com',
    phone: '0548517277',
    address: 'Dev Surge Sandbox Yard, Accra — Ghana',
    gaaLicenseNumber: 'GAA/DEMO/2026-001',
    tinNumber: 'C000000000X',
    currency: 'GH₵',
    settlementDays: 14,
    buyerRegistrationFee: 200,
    defaultBuyersPremium: 10,
    taxRateVAT: 0,
    receiptPrinterWidth: '80mm',
    autoPrintReceipt: true,
    enableSmsReceiptAlerts: false,
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

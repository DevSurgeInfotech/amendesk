export type AppRole = 'OWNER' | 'ACCOUNTANT' | 'SECRETARY' | 'STAFF';

export type TenantEnvironment = 'LIVE' | 'SANDBOX';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED';

export interface TenantRecord {
  id: string; // e.g. 'amen-mart-live', 'amen-mart-sandbox'
  code: string; // e.g. 'AMEN-MART', 'DEMO'
  name: string; // 'Amen Mart Ghana', 'AmenDesk Demo Yard'
  shortName: string;
  environment: TenantEnvironment;
  status: TenantStatus;
  contactEmail: string;
  phone: string;
  address: string;
  createdAt: string;
  description: string;
}

export interface UserAccount {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  fullName: string;
  role: AppRole;
  password: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: AppRole;
    tenantId: string;
  };
  tenant: TenantRecord;
  token: string;
  createdAt: string;
  expiresAt: number;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  OWNER: 'Managing Director & Owner',
  ACCOUNTANT: 'Chief Accountant & Finance Lead',
  SECRETARY: 'Auction Secretary & Front Desk',
  STAFF: 'Operations Staff & Cashier',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  OWNER: 'Full administrative control, ledger review, approvals, and user provisioning.',
  ACCOUNTANT: 'General ledger, bank deposits, receipting, invoices, and financial reports.',
  SECRETARY: 'Auction lot intake, buyer CRM/KYC verification, waybills, and transfer deeds.',
  STAFF: 'Payment cashiering, yard inventory tracking, stock movements, and intake inspections.',
};

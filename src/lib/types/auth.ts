export type AppRole =
  | 'OWNER'
  | 'ACCOUNTANT'
  | 'HR_ADMIN'
  | 'SECRETARY'
  | 'AUCTION_MANAGER'
  | 'CASHIER'
  | 'SALES_OFFICER'
  | 'STAFF';

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
  ACCOUNTANT: 'Chief Accountant & Payroll Lead',
  HR_ADMIN: 'HR & Administrative Officer',
  SECRETARY: 'Auction Secretary & Staff Onboarding',
  AUCTION_MANAGER: 'Auction & Yard Manager',
  CASHIER: 'Front Desk Cashier (POS)',
  SALES_OFFICER: 'Dealership, Land & Property Officer',
  STAFF: 'Operations & Yard Officer',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  OWNER:
    'Full executive control, payroll & salary approvals, general ledger, and workspace RBAC.',
  ACCOUNTANT:
    'General ledger, bank deposits, staff salary configuration, monthly payroll, and GRA/SSNIT filings.',
  HR_ADMIN:
    'Staff onboarding (no salary access), statutory ID verification, and staff leave management.',
  SECRETARY:
    'Staff onboarding (no salary access), leave requests, auction lot intake, buyer CRM/KYC, and waybills.',
  AUCTION_MANAGER:
    'Auction events, lot intake, 14-day payment plan monitoring, waybill release, and yard stock.',
  CASHIER:
    'POS payment terminal, daily till balancing (8:00 AM – 5:00 PM), and 80mm thermal receipts.',
  SALES_OFFICER:
    'Direct sales inventory across Car Dealership, Land Parcels, Property Units, and buyer CRM.',
  STAFF:
    'Yard inventory tracking, stock transfers, and lot inspections (8:00 AM – 5:00 PM).',
};

export interface RolePermissions {
  canViewStaffDirectory: boolean;
  canOnboardStaff: boolean; // Add/edit staff personal & statutory details (NO salary)
  canConfigureSalaryAndPayroll: boolean; // View/set salaries, run payroll, GRA/SSNIT filings
  canDisbursePayrollAndApproveLedger: boolean; // Approve payroll journal & Hubtel disbursement
  canManageLeave: boolean;
  canApproveLeaveAndStatus: boolean;
  canManageAccountsAndDeposits: boolean;
  canProcessPosPayments: boolean;
  canManageAuctionsAndWaybills: boolean;
  canManageDirectSales: boolean;
  canManageSettingsAndRbac: boolean;
}

export const RBAC_PERMISSIONS: Record<AppRole, RolePermissions> = {
  OWNER: {
    canViewStaffDirectory: true,
    canOnboardStaff: true,
    canConfigureSalaryAndPayroll: true,
    canDisbursePayrollAndApproveLedger: true,
    canManageLeave: true,
    canApproveLeaveAndStatus: true,
    canManageAccountsAndDeposits: true,
    canProcessPosPayments: true,
    canManageAuctionsAndWaybills: true,
    canManageDirectSales: true,
    canManageSettingsAndRbac: true,
  },
  ACCOUNTANT: {
    canViewStaffDirectory: true,
    canOnboardStaff: true,
    canConfigureSalaryAndPayroll: true,
    canDisbursePayrollAndApproveLedger: true,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: true,
    canProcessPosPayments: true,
    canManageAuctionsAndWaybills: false,
    canManageDirectSales: false,
    canManageSettingsAndRbac: false,
  },
  HR_ADMIN: {
    canViewStaffDirectory: true,
    canOnboardStaff: true,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: true,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: false,
    canManageAuctionsAndWaybills: false,
    canManageDirectSales: false,
    canManageSettingsAndRbac: false,
  },
  SECRETARY: {
    canViewStaffDirectory: true,
    canOnboardStaff: true,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: true,
    canManageAuctionsAndWaybills: true,
    canManageDirectSales: true,
    canManageSettingsAndRbac: false,
  },
  AUCTION_MANAGER: {
    canViewStaffDirectory: true,
    canOnboardStaff: false,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: false,
    canManageAuctionsAndWaybills: true,
    canManageDirectSales: false,
    canManageSettingsAndRbac: false,
  },
  CASHIER: {
    canViewStaffDirectory: false,
    canOnboardStaff: false,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: true,
    canManageAuctionsAndWaybills: false,
    canManageDirectSales: false,
    canManageSettingsAndRbac: false,
  },
  SALES_OFFICER: {
    canViewStaffDirectory: false,
    canOnboardStaff: false,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: false,
    canManageAuctionsAndWaybills: false,
    canManageDirectSales: true,
    canManageSettingsAndRbac: false,
  },
  STAFF: {
    canViewStaffDirectory: false,
    canOnboardStaff: false,
    canConfigureSalaryAndPayroll: false,
    canDisbursePayrollAndApproveLedger: false,
    canManageLeave: true,
    canApproveLeaveAndStatus: false,
    canManageAccountsAndDeposits: false,
    canProcessPosPayments: false,
    canManageAuctionsAndWaybills: false,
    canManageDirectSales: false,
    canManageSettingsAndRbac: false,
  },
};

export function normalizeAppRole(role: string | undefined | null): AppRole {
  if (!role) return 'OWNER';
  if (role === 'ADMIN') return 'OWNER';
  if (role === 'DEALERSHIP_AGENT') return 'SALES_OFFICER';
  if (role === 'INVENTORY_OFFICER') return 'STAFF';
  if (role in RBAC_PERMISSIONS) {
    return role as AppRole;
  }
  return 'OWNER';
}

export function getRolePermissions(role: string | undefined | null): RolePermissions {
  return RBAC_PERMISSIONS[normalizeAppRole(role)];
}

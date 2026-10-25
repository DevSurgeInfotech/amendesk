export type EmploymentType = 'FULL_TIME_SALARIED' | 'PROBATION_SALARIED' | 'EXECUTIVE';

export type HrDepartment =
  | 'AUCTION_OPERATIONS'
  | 'DEALERSHIP_SHOWROOM'
  | 'LAND_DESK'
  | 'PROPERTY_DESK'
  | 'FINANCE_ACCOUNTS'
  | 'LEGAL_ADMIN'
  | 'SECURITY_LOGISTICS';

export type SalaryPaymentMethod = 'HUBTEL_MOMO_API' | 'BANK_TRANSFER';

export type PayrollRunStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'POSTED'
  | 'DISBURSING'
  | 'DISBURSED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'FIELD_AUCTION_DUTY';

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'COMPASSIONATE'
  | 'STUDY';

export interface Employee {
  id: string;
  employeeCode: string; // e.g. AM-EMP-001
  fullName: string;
  phone: string;
  email?: string;
  ghanaCardNumber: string; // GHA-XXXXXXXXX-X
  ssnitNumber?: string; // 13-digit SSNIT number
  tinNumber?: string; // Ghana Revenue Authority TIN
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE';
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  department: HrDepartment;
  jobTitle: string;
  employmentType: EmploymentType;
  dateHired: string;
  locationId: string; // references accountingLocations (e.g. loc-gbawe, loc-showroom)
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
  isCashier: boolean; // whether employee can open/close front-desk cash till shifts

  // Salaried Remuneration Structure (strictly monthly salaried + allowances; no casuals, no sales commissions)
  basicSalaryGhs: number;
  transportAllowanceGhs: number;
  housingAllowanceGhs: number;
  lunchAllowanceGhs: number;
  communicationAllowanceGhs: number;
  personalTaxReliefGhs?: number; // Monthly GRA approved relief (disability, aged dependent, etc.)

  // Statutory & Payout Endpoints
  hasSsnitContribution: boolean;
  tier3VoluntaryPct?: number; // 0 to 16.5%
  paymentMethod: SalaryPaymentMethod;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  momoNetwork?: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
  momoPhoneNumber?: string;
  momoAccountName?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface PayrollRun {
  id: string;
  runNumber: string; // e.g. PR-2026-10
  period: string; // YYYY-MM
  status: PayrollRunStatus;
  totalEmployees: number;
  totalBasicGhs: number;
  totalAllowancesGhs: number;
  totalGrossGhs: number;
  totalTaxableGhs: number;
  totalPayeGhs: number;
  totalSsnitTier1EmployerGhs: number; // 13% employer burden
  totalSsnitTier2EmployeeGhs: number; // 5% mandatory Tier 2 employee deduction
  totalSsnitEmployeeTotalGhs: number; // 5.5% total mandatory employee deduction
  totalTier3Ghs: number;
  totalDeductionsGhs: number;
  totalNetGhs: number;
  journalEntryId?: string; // references journalEntries (accrual entry)
  disbursementJournalEntryId?: string; // references journalEntries (settlement entry)
  hubtelBatchId?: string; // Hubtel automated API batch reference
  processedBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface PayrollSlip {
  id: string;
  slipNumber: string; // e.g. PS-2026-10-001
  runId: string;
  period: string; // YYYY-MM
  employeeId: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  department: HrDepartment;
  ghanaCardNumber: string;
  ssnitNumber?: string;
  tinNumber?: string;

  // Salaried Earnings
  basicSalaryGhs: number;
  transportAllowanceGhs: number;
  housingAllowanceGhs: number;
  lunchAllowanceGhs: number;
  communicationAllowanceGhs: number;
  allowancesGhs: number;
  grossSalaryGhs: number;

  // Statutory & Other Deductions
  ssnitEmployeeGhs: number; // 5.5% mandatory employee deduction (0.5% Tier 1 + 5.0% Tier 2)
  ssnitTier2Ghs: number; // 5.0% Tier 2 portion
  tier3VoluntaryGhs: number;
  personalReliefGhs: number;
  taxableIncomeGhs: number;
  payeTaxGhs: number;
  salaryAdvanceDeductionGhs: number;
  totalDeductionsGhs: number;

  // Net & Employer Cost
  netPayGhs: number;
  ssnitEmployerGhs: number; // 13.0% employer contribution
  employerTotalCostGhs: number;

  paymentMethod: SalaryPaymentMethod;
  bankName?: string;
  bankAccountNumber?: string;
  momoNetwork?: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
  momoPhoneNumber?: string;
  hubtelTransactionId?: string;
  hubtelResponseMessage?: string;
  paymentReference?: string;
  status: 'PENDING' | 'PROCESSING' | 'DISBURSED' | 'FAILED';
  disbursedAt?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface StaffAttendance {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: HrDepartment;
  date: string; // YYYY-MM-DD
  timeIn?: string;
  timeOut?: string;
  status: AttendanceStatus;
  shiftType: 'STANDARD_DAY' | 'AUCTION_EVENT_DUTY' | 'WEEKEND_DUTY';
  hoursWorked: number;
  linkedShiftId?: string; // if tied to a front-desk cash till shift
  recordedBy: string;
  notes?: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: HrDepartment;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDaysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string;
  actionDate?: string;
  comments?: string;
  createdAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export const HR_DEPARTMENT_LABELS: Record<HrDepartment, string> = {
  AUCTION_OPERATIONS: 'Auction Operations',
  DEALERSHIP_SHOWROOM: 'Car Dealership Showroom',
  LAND_DESK: 'Land Desk',
  PROPERTY_DESK: 'Property Desk',
  FINANCE_ACCOUNTS: 'Finance & Accounts',
  LEGAL_ADMIN: 'Legal & Front Desk Admin',
  SECURITY_LOGISTICS: 'Yard Security & Logistics',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  EXECUTIVE: 'Executive Management',
  FULL_TIME_SALARIED: 'Full-Time Salaried',
  PROBATION_SALARIED: 'Probation Salaried',
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Annual Leave (15 Working Days)',
  SICK: 'Medical / Sick Leave',
  MATERNITY: 'Maternity Leave (12 Weeks)',
  PATERNITY: 'Paternity Leave',
  COMPASSIONATE: 'Compassionate / Bereavement',
  STUDY: 'Professional / GAA Study Leave',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present on Duty',
  FIELD_AUCTION_DUTY: 'Live Auction Field Duty',
  HALF_DAY: 'Half Day',
  ON_LEAVE: 'On Approved Leave',
  ABSENT: 'Absent',
};

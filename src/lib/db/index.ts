import Dexie, { type Table } from 'dexie';
import type {
  Account,
  AccountingClass,
  AccountingItem,
  AccountingLocation,
  AuctionLot,
  BankDeposit,
  CashShift,
  Customer,
  DealershipVehicle,
  Employee,
  Expense,
  InventoryItem,
  Invoice,
  JournalEntry,
  LandParcel,
  LeaveRequest,
  MediaAttachment,
  PaymentPlan,
  PayrollRun,
  PayrollSlip,
  PropertyUnit,
  Receipt,
  SaleTransferDoc,
  StaffAttendance,
  StockMovement,
  SyncOutboxItem,
  Waybill,
} from '@/lib/types';
import {
  initialAccountingClasses,
  initialAccountingItems,
  initialAccountingLocations,
  initialAccounts,
  initialBankDeposits,
  initialCustomers,
  initialEmployees,
  initialExpenses,
  initialInvoices,
  initialJournalEntries,
  initialLeaveRequests,
  initialLots,
  initialVehicles,
  initialLandParcels,
  initialProperties,
  initialInventoryItems,
  initialStockMovements,
  initialPaymentPlans,
  initialPayrollRuns,
  initialPayrollSlips,
  initialReceipts,
  initialWaybills,
  initialSaleTransferDocs,
  initialStaffAttendance,
  initialCashShifts,
} from './seed';
import {
  getActiveDbName,
  getActiveEnvironmentMode,
  getActiveTenantId,
  SYSTEM_TENANTS,
  type EnvironmentMode,
  type TenantId,
} from './env';

export * from './env';

export class AmenDeskDB extends Dexie {
  public readonly tenantId: TenantId;
  public readonly dbMode: EnvironmentMode;

  customers!: Table<Customer, string>;
  auctionLots!: Table<AuctionLot, string>;
  paymentPlans!: Table<PaymentPlan, string>;
  receipts!: Table<Receipt, string>;
  waybills!: Table<Waybill, string>;
  saleTransferDocs!: Table<SaleTransferDoc, string>;
  dealershipVehicles!: Table<DealershipVehicle, string>;
  landParcels!: Table<LandParcel, string>;
  propertyUnits!: Table<PropertyUnit, string>;
  mediaAttachments!: Table<MediaAttachment, string>;
  inventoryItems!: Table<InventoryItem, string>;
  stockMovements!: Table<StockMovement, string>;
  syncOutbox!: Table<SyncOutboxItem, string>;

  // Accounting & Financial Management
  accounts!: Table<Account, string>;
  journalEntries!: Table<JournalEntry, string>;
  expenses!: Table<Expense, string>;
  invoices!: Table<Invoice, string>;
  cashShifts!: Table<CashShift, string>;
  accountingItems!: Table<AccountingItem, string>;
  accountingClasses!: Table<AccountingClass, string>;
  accountingLocations!: Table<AccountingLocation, string>;
  bankDeposits!: Table<BankDeposit, string>;

  // HR & Payroll Module (Salaried Staff)
  employees!: Table<Employee, string>;
  payrollRuns!: Table<PayrollRun, string>;
  payrollSlips!: Table<PayrollSlip, string>;
  staffAttendance!: Table<StaffAttendance, string>;
  leaveRequests!: Table<LeaveRequest, string>;

  constructor(databaseName = getActiveDbName(), mode = getActiveEnvironmentMode()) {
    super(databaseName);
    this.tenantId = getActiveTenantId();
    this.dbMode = mode;

    this.version(2).stores({
      customers: 'id, fullName, phone, ghanaCardNumber, kycVerified, customerType',
      auctionLots: 'id, eventId, lotNumber, category, assetType, status, balanceDueDate, winningBidderId, currentBidGhs',
      paymentPlans: 'id, referenceType, referenceId, customerId, status, currentDueDate',
      receipts: 'id, receiptNumber, paymentPlanId, customerId, printedAt, syncStatus',
      waybills: 'id, waybillNumber, lotId, buyerName, releasedAt',
      saleTransferDocs: 'id, docNumber, lotId, parcelReference, executedDate',
      dealershipVehicles: 'id, vin, make, model, fuelType, status, askingPriceGhs',
      landParcels: 'id, siteRef, location, status, priceGhs',
      propertyUnits: 'id, unitRef, propertyType, status, priceGhs',
      inventoryItems: 'id, sku, name, location, category, condition',
      stockMovements: 'id, itemId, timestamp, fromLocation, toLocation',
      syncOutbox: 'id, entity, status, timestamp',
      accounts: 'id, code, type, category, isSystem',
      journalEntries: 'id, entryNumber, date, reference, status',
      expenses: 'id, expenseNumber, category, status, date',
      invoices: 'id, invoiceNumber, customerId, status, dueDate',
      cashShifts: 'id, shiftNumber, cashierName, status, shiftDate',
    });

    this.version(3).stores({
      receipts: 'id, receiptNumber, paymentPlanId, customerId, printedAt, syncStatus, depositStatus, bankDepositId',
      accountingItems: 'id, sku, name, type, category, incomeAccountId, isActive',
      accountingClasses: 'id, code, name, businessLine, isActive',
      accountingLocations: 'id, code, name, facilityType, isActive',
      bankDeposits: 'id, depositNumber, depositDate, targetBankAccountId, syncStatus',
    });

    this.version(4).stores({
      mediaAttachments: 'id, entityType, entityId, isPrimary, syncStatus, createdAt',
    });

    this.version(5).stores({
      employees: 'id, employeeCode, fullName, phone, ghanaCardNumber, ssnitNumber, tinNumber, department, employmentType, status, isCashier, locationId',
      payrollRuns: 'id, runNumber, period, status, totalGrossGhs, totalNetGhs, createdAt, journalEntryId',
      payrollSlips: 'id, slipNumber, runId, period, employeeId, grossSalaryGhs, netPayGhs, paymentMethod, hubtelTransactionId, status, disbursedAt',
      staffAttendance: 'id, employeeId, date, status, shiftType, linkedShiftId',
      leaveRequests: 'id, employeeId, leaveType, startDate, endDate, status, approvedBy',
    });
  }

  async populateIfEmpty(): Promise<void> {
    // 1. Mandatory Core Accounting System Setup (always seeded if empty in both LIVE & SANDBOX)
    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      await this.accounts.bulkAdd(initialAccounts);
      await this.accountingClasses.bulkAdd(initialAccountingClasses);
      await this.accountingLocations.bulkAdd(initialAccountingLocations);
      await this.accountingItems.bulkAdd(initialAccountingItems);
    } else {
      // Ensure new statutory payroll system accounts exist on upgraded v4 -> v5 databases
      const existingPayeAcc = await this.accounts.get('acc-2150');
      if (!existingPayeAcc) {
        const payrollSystemAccountIds = ['acc-2150', 'acc-2160', 'acc-2170', 'acc-2180', 'acc-6080', 'acc-6085'];
        const payrollAccounts = initialAccounts.filter((a) => payrollSystemAccountIds.includes(a.id));
        await this.accounts.bulkPut(payrollAccounts);
      }
    }

    // 2. Mock Operational Seed Data:
    // STRICTLY POPULATED IN SANDBOX (Amen Mart Demo Yard tenant) ONLY.
    // Live Amen Mart database will NEVER be populated with dummy lots, vehicles, or test clients.
    if (this.tenantId === 'amen-mart-sandbox') {
      const customerCount = await this.customers.count();
      if (customerCount === 0) {
        await this.customers.bulkAdd(initialCustomers);
        await this.auctionLots.bulkAdd(initialLots);
        await this.paymentPlans.bulkAdd(initialPaymentPlans);
        await this.receipts.bulkAdd(initialReceipts);
        await this.waybills.bulkAdd(initialWaybills);
        await this.saleTransferDocs.bulkAdd(initialSaleTransferDocs);
        await this.dealershipVehicles.bulkAdd(initialVehicles);
        await this.landParcels.bulkAdd(initialLandParcels);
        await this.propertyUnits.bulkAdd(initialProperties);
        await this.inventoryItems.bulkAdd(initialInventoryItems);
        await this.stockMovements.bulkAdd(initialStockMovements);
        await this.journalEntries.bulkAdd(initialJournalEntries);
        await this.expenses.bulkAdd(initialExpenses);
        await this.invoices.bulkAdd(initialInvoices);
        await this.cashShifts.bulkAdd(initialCashShifts);
        await this.bankDeposits.bulkAdd(initialBankDeposits);
      }

      const employeeCount = await this.employees.count();
      if (employeeCount === 0) {
        await this.employees.bulkAdd(initialEmployees);
        await this.payrollRuns.bulkAdd(initialPayrollRuns);
        await this.payrollSlips.bulkAdd(initialPayrollSlips);
        await this.staffAttendance.bulkAdd(initialStaffAttendance);
        await this.leaveRequests.bulkAdd(initialLeaveRequests);
      }
    }
  }

  async resetToSeedData(): Promise<void> {
    if (this.tenantId === 'amen-mart-live' || !SYSTEM_TENANTS[this.tenantId]?.isSandbox) {
      throw new Error(
        'Safety Violation: Database reset is strictly prohibited in Amen Mart Live mode. Switch to Demo Yard to test reset operations.'
      );
    }

    await this.customers.clear();
    await this.auctionLots.clear();
    await this.paymentPlans.clear();
    await this.receipts.clear();
    await this.waybills.clear();
    await this.saleTransferDocs.clear();
    await this.dealershipVehicles.clear();
    await this.landParcels.clear();
    await this.propertyUnits.clear();
    await this.mediaAttachments.clear();
    await this.inventoryItems.clear();
    await this.stockMovements.clear();
    await this.syncOutbox.clear();
    await this.accounts.clear();
    await this.journalEntries.clear();
    await this.expenses.clear();
    await this.invoices.clear();
    await this.cashShifts.clear();
    await this.accountingItems.clear();
    await this.accountingClasses.clear();
    await this.accountingLocations.clear();
    await this.bankDeposits.clear();
    await this.employees.clear();
    await this.payrollRuns.clear();
    await this.payrollSlips.clear();
    await this.staffAttendance.clear();
    await this.leaveRequests.clear();
    await this.populateIfEmpty();
  }
}

export const db = new AmenDeskDB();

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
  CommunicationRecord,
} from '@/lib/types';
import {
  initialAccountingClasses,
  initialAccountingItems,
  initialAccountingLocations,
  initialAccounts,
  initialSandboxAccounts,
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
  initialCommunications,
} from './seed';
import {
  LIVE_DB_NAME,
  SANDBOX_DB_NAME,
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

  // Communication Hub
  communications!: Table<CommunicationRecord, string>;

  constructor(databaseName = getActiveDbName(), mode = getActiveEnvironmentMode()) {
    super(databaseName);
    if (databaseName === LIVE_DB_NAME || databaseName === 'AmenDeskDB_live') {
      this.tenantId = 'amen-mart-live';
      this.dbMode = 'LIVE';
    } else if (databaseName === SANDBOX_DB_NAME || databaseName === 'AmenDeskDB_sandbox') {
      this.tenantId = 'amen-mart-sandbox';
      this.dbMode = 'SANDBOX';
    } else {
      this.tenantId = getActiveTenantId();
      this.dbMode = mode;
    }

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

    this.version(6).stores({
      communications: 'id, customerId, direction, channel, status, createdAt, businessLine',
    });
  }

  async populateIfEmpty(): Promise<void> {
    const isSandboxDb = this.tenantId === 'amen-mart-sandbox' || this.name === SANDBOX_DB_NAME;

    // 1. Mandatory Core Accounting System Setup (Chart of Accounts & Categories)
    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      if (isSandboxDb) {
        await this.accounts.bulkAdd(initialSandboxAccounts);
      } else {
        await this.accounts.bulkAdd(initialAccounts); // 100% clean GH₵ 0.00 balances
      }
      await this.accountingClasses.bulkAdd(initialAccountingClasses);
      await this.accountingLocations.bulkAdd(initialAccountingLocations);
      await this.accountingItems.bulkAdd(initialAccountingItems);
    } else {
      // Ensure new statutory payroll system accounts exist on upgraded v4 -> v5 databases
      const existingPayeAcc = await this.accounts.get('acc-2150');
      if (!existingPayeAcc) {
        const payrollSystemAccountIds = ['acc-2150', 'acc-2160', 'acc-2170', 'acc-2180', 'acc-6080', 'acc-6085'];
        const payrollAccounts = (isSandboxDb ? initialSandboxAccounts : initialAccounts).filter((a) =>
          payrollSystemAccountIds.includes(a.id)
        );
        await this.accounts.bulkPut(payrollAccounts);
      }
    }

    // 2. Operational Data Population
    if (isSandboxDb) {
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

      const commCount = await this.communications.count();
      if (commCount === 0) {
        await this.communications.bulkAdd(initialCommunications);
      }
    } else {
      // LIVE PRODUCTION: Ensure Live Database is a 100% pristine clean slate for client handover
      await this.ensureLiveCleanSlate();
    }
  }

  /**
   * Sanitizes the Live database to ensure a 100% clean slate state upon software handover.
   * - Purges all mock/seed records from operational tables.
   * - Resets all Chart of Accounts balances to GH₵ 0.00 if no real journal entries exist.
   * - Preserves genuine customer inquiries submitted from website forms.
   */
  async ensureLiveCleanSlate(): Promise<void> {
    if (this.tenantId !== 'amen-mart-live' && this.name !== LIVE_DB_NAME) return;

    try {
      // 1. Purge seed journal entries and reconcile account balances
      const allJournalEntries = await this.journalEntries.toArray();
      const seedJeIds = new Set(initialJournalEntries.map((je) => je.id));
      const seedJournalEntries = allJournalEntries.filter(
        (je) => seedJeIds.has(je.id) || je.id.startsWith('je-00')
      );
      if (seedJournalEntries.length > 0) {
        await this.journalEntries.bulkDelete(seedJournalEntries.map((je) => je.id));
      }

      const remainingJournalEntries = await this.journalEntries.toArray();
      if (remainingJournalEntries.length === 0) {
        // No real journal entries exist: all accounts in Chart of Accounts MUST have balanceGhs = 0
        const allAccounts = await this.accounts.toArray();
        const nonZeroAccounts = allAccounts.filter((a) => a.balanceGhs !== 0);
        for (const acc of nonZeroAccounts) {
          await this.accounts.update(acc.id, { balanceGhs: 0 });
        }
      }

      // 2. Purge seed auction lots
      const seedLotIds = new Set(initialLots.map((l) => l.id));
      const lots = await this.auctionLots.toArray();
      const seedLotsToDelete = lots.filter(
        (l) => seedLotIds.has(l.id) || l.id.startsWith('lot-') || l.id.startsWith('LOT-')
      );
      if (seedLotsToDelete.length > 0) {
        await this.auctionLots.bulkDelete(seedLotsToDelete.map((l) => l.id));
      }

      // 3. Purge seed dealership vehicles
      const seedVehIds = new Set(initialVehicles.map((v) => v.id));
      const vehicles = await this.dealershipVehicles.toArray();
      const seedVehiclesToDelete = vehicles.filter(
        (v) => seedVehIds.has(v.id) || v.id.startsWith('veh-')
      );
      if (seedVehiclesToDelete.length > 0) {
        await this.dealershipVehicles.bulkDelete(seedVehiclesToDelete.map((v) => v.id));
      }

      // 4. Purge seed land parcels
      const seedLandIds = new Set(initialLandParcels.map((p) => p.id));
      const parcels = await this.landParcels.toArray();
      const seedParcelsToDelete = parcels.filter(
        (p) => seedLandIds.has(p.id) || p.id.startsWith('lnd-')
      );
      if (seedParcelsToDelete.length > 0) {
        await this.landParcels.bulkDelete(seedParcelsToDelete.map((p) => p.id));
      }

      // 5. Purge seed property units
      const seedPropIds = new Set(initialProperties.map((p) => p.id));
      const properties = await this.propertyUnits.toArray();
      const seedPropsToDelete = properties.filter(
        (p) => seedPropIds.has(p.id) || p.id.startsWith('prop-')
      );
      if (seedPropsToDelete.length > 0) {
        await this.propertyUnits.bulkDelete(seedPropsToDelete.map((p) => p.id));
      }

      // 6. Purge seed payment plans
      const seedPlanIds = new Set(initialPaymentPlans.map((p) => p.id));
      const plans = await this.paymentPlans.toArray();
      const seedPlansToDelete = plans.filter(
        (p) => seedPlanIds.has(p.id) || p.id.startsWith('plan-')
      );
      if (seedPlansToDelete.length > 0) {
        await this.paymentPlans.bulkDelete(seedPlansToDelete.map((p) => p.id));
      }

      // 7. Purge seed receipts
      const seedReceiptIds = new Set(initialReceipts.map((r) => r.id));
      const receipts = await this.receipts.toArray();
      const seedReceiptsToDelete = receipts.filter(
        (r) => seedReceiptIds.has(r.id) || r.id.startsWith('rcp-') || r.id.startsWith('AM-RCP-2026-00')
      );
      if (seedReceiptsToDelete.length > 0) {
        await this.receipts.bulkDelete(seedReceiptsToDelete.map((r) => r.id));
      }

      // 8. Purge seed waybills
      const seedWaybillIds = new Set(initialWaybills.map((w) => w.id));
      const waybills = await this.waybills.toArray();
      const seedWaybillsToDelete = waybills.filter(
        (w) => seedWaybillIds.has(w.id) || w.id.startsWith('wb-') || w.id.startsWith('AM-WB-2026-00')
      );
      if (seedWaybillsToDelete.length > 0) {
        await this.waybills.bulkDelete(seedWaybillsToDelete.map((w) => w.id));
      }

      // 9. Purge seed sale transfer deeds
      const seedDocIds = new Set(initialSaleTransferDocs.map((d) => d.id));
      const docs = await this.saleTransferDocs.toArray();
      const seedDocsToDelete = docs.filter(
        (d) => seedDocIds.has(d.id) || d.id.startsWith('doc-') || d.id.startsWith('AM-TRF-2026-00')
      );
      if (seedDocsToDelete.length > 0) {
        await this.saleTransferDocs.bulkDelete(seedDocsToDelete.map((d) => d.id));
      }

      // 10. Purge seed inventory items & stock movements
      const seedInvIds = new Set(initialInventoryItems.map((i) => i.id));
      const invItems = await this.inventoryItems.toArray();
      const seedInvToDelete = invItems.filter(
        (i) => seedInvIds.has(i.id) || i.id.startsWith('inv-')
      );
      if (seedInvToDelete.length > 0) {
        await this.inventoryItems.bulkDelete(seedInvToDelete.map((i) => i.id));
      }

      const seedMovIds = new Set(initialStockMovements.map((m) => m.id));
      const movs = await this.stockMovements.toArray();
      const seedMovsToDelete = movs.filter(
        (m) => seedMovIds.has(m.id) || m.id.startsWith('mov-')
      );
      if (seedMovsToDelete.length > 0) {
        await this.stockMovements.bulkDelete(seedMovsToDelete.map((m) => m.id));
      }

      // 11. Purge seed expenses, invoices, cash shifts, bank deposits
      const seedExpIds = new Set(initialExpenses.map((e) => e.id));
      const expenses = await this.expenses.toArray();
      const seedExpToDelete = expenses.filter(
        (e) => seedExpIds.has(e.id) || e.id.startsWith('exp-')
      );
      if (seedExpToDelete.length > 0) {
        await this.expenses.bulkDelete(seedExpToDelete.map((e) => e.id));
      }

      const seedInvcIds = new Set(initialInvoices.map((i) => i.id));
      const invoices = await this.invoices.toArray();
      const seedInvoicesToDelete = invoices.filter(
        (i) => seedInvcIds.has(i.id) || i.id.startsWith('invc-')
      );
      if (seedInvoicesToDelete.length > 0) {
        await this.invoices.bulkDelete(seedInvoicesToDelete.map((i) => i.id));
      }

      const seedShiftIds = new Set(initialCashShifts.map((s) => s.id));
      const shifts = await this.cashShifts.toArray();
      const seedShiftsToDelete = shifts.filter(
        (s) => seedShiftIds.has(s.id) || s.id.startsWith('shf-')
      );
      if (seedShiftsToDelete.length > 0) {
        await this.cashShifts.bulkDelete(seedShiftsToDelete.map((s) => s.id));
      }

      const seedDepositIds = new Set(initialBankDeposits.map((d) => d.id));
      const deposits = await this.bankDeposits.toArray();
      const seedDepositsToDelete = deposits.filter(
        (d) => seedDepositIds.has(d.id) || d.id.startsWith('dep-')
      );
      if (seedDepositsToDelete.length > 0) {
        await this.bankDeposits.bulkDelete(seedDepositsToDelete.map((d) => d.id));
      }

      // 12. Purge seed HR & Payroll records (payrollRuns, payrollSlips, staffAttendance, leaveRequests)
      const seedRunIds = new Set(initialPayrollRuns.map((r) => r.id));
      const pRuns = await this.payrollRuns.toArray();
      const seedRunsToDelete = pRuns.filter(
        (r) => seedRunIds.has(r.id) || r.id.startsWith('prun-')
      );
      if (seedRunsToDelete.length > 0) {
        await this.payrollRuns.bulkDelete(seedRunsToDelete.map((r) => r.id));
      }

      const seedSlipIds = new Set(initialPayrollSlips.map((s) => s.id));
      const pSlips = await this.payrollSlips.toArray();
      const seedSlipsToDelete = pSlips.filter(
        (s) => seedSlipIds.has(s.id) || s.id.startsWith('pslip-')
      );
      if (seedSlipsToDelete.length > 0) {
        await this.payrollSlips.bulkDelete(seedSlipsToDelete.map((s) => s.id));
      }

      const seedAttIds = new Set(initialStaffAttendance.map((a) => a.id));
      const atts = await this.staffAttendance.toArray();
      const seedAttsToDelete = atts.filter(
        (a) => seedAttIds.has(a.id) || a.id.startsWith('att-')
      );
      if (seedAttsToDelete.length > 0) {
        await this.staffAttendance.bulkDelete(seedAttsToDelete.map((a) => a.id));
      }

      const seedLvrIds = new Set(initialLeaveRequests.map((l) => l.id));
      const lvrs = await this.leaveRequests.toArray();
      const seedLvrsToDelete = lvrs.filter(
        (l) => seedLvrIds.has(l.id) || l.id.startsWith('lvr-')
      );
      if (seedLvrsToDelete.length > 0) {
        await this.leaveRequests.bulkDelete(seedLvrsToDelete.map((l) => l.id));
      }

      // 13. Purge seed employees with fake salaries (emp-001 through emp-005)
      const seedEmpIds = new Set(initialEmployees.map((e) => e.id));
      const emps = await this.employees.toArray();
      const seedEmpsToDelete = emps.filter(
        (e) => seedEmpIds.has(e.id) || e.id.startsWith('emp-00')
      );
      if (seedEmpsToDelete.length > 0) {
        await this.employees.bulkDelete(seedEmpsToDelete.map((e) => e.id));
      }

      // 14. Purge mock customers (cust-001 through cust-006) while preserving real incoming web leads
      const seedCustIds = new Set(initialCustomers.map((c) => c.id));
      const customers = await this.customers.toArray();
      const seedCustsToDelete = customers.filter(
        (c) => seedCustIds.has(c.id) || c.id.startsWith('cust-00')
      );
      if (seedCustsToDelete.length > 0) {
        await this.customers.bulkDelete(seedCustsToDelete.map((c) => c.id));
      }

      // 15. Purge seed communications while preserving genuine inbound customer interactions
      const comms = await this.communications.toArray();
      const seedCommsToDelete = comms.filter((c) => c.id.startsWith('comm-seed-'));
      if (seedCommsToDelete.length > 0) {
        await this.communications.bulkDelete(seedCommsToDelete.map((c) => c.id));
      }
    } catch (err) {
      console.error('Failed to ensure live clean slate:', err);
    }
  }

  /**
   * Complete clean slate reset for Amen Mart Live handover.
   * Completely wipes all operational tables and resets all account balances to GH₵ 0.00.
   */
  async resetToCleanSlate(): Promise<void> {
    if (this.tenantId !== 'amen-mart-live' && this.name !== LIVE_DB_NAME) {
      throw new Error('Clean Slate reset is strictly designated for Amen Mart Live mode.');
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
    await this.journalEntries.clear();
    await this.expenses.clear();
    await this.invoices.clear();
    await this.cashShifts.clear();
    await this.bankDeposits.clear();
    await this.employees.clear();
    await this.payrollRuns.clear();
    await this.payrollSlips.clear();
    await this.staffAttendance.clear();
    await this.leaveRequests.clear();
    await this.communications.clear();

    // Reset all account balances to 0
    const accounts = await this.accounts.toArray();
    for (const acc of accounts) {
      await this.accounts.update(acc.id, { balanceGhs: 0 });
    }

    // Ensure core accounting master data exists
    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      await this.accounts.bulkAdd(initialAccounts);
      await this.accountingClasses.bulkAdd(initialAccountingClasses);
      await this.accountingLocations.bulkAdd(initialAccountingLocations);
      await this.accountingItems.bulkAdd(initialAccountingItems);
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

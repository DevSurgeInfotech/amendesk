import Dexie, { type Table } from 'dexie';
import type {
  Account,
  AuctionLot,
  CashShift,
  Customer,
  DealershipVehicle,
  Expense,
  InventoryItem,
  Invoice,
  JournalEntry,
  LandParcel,
  PaymentPlan,
  PropertyUnit,
  Receipt,
  SaleTransferDoc,
  StockMovement,
  SyncOutboxItem,
  Waybill,
} from '@/lib/types';
import {
  initialAccounts,
  initialCustomers,
  initialExpenses,
  initialInvoices,
  initialJournalEntries,
  initialLots,
  initialVehicles,
  initialLandParcels,
  initialProperties,
  initialInventoryItems,
  initialStockMovements,
  initialPaymentPlans,
  initialReceipts,
  initialWaybills,
  initialSaleTransferDocs,
  initialCashShifts,
} from './seed';

export class AmenDeskDB extends Dexie {
  customers!: Table<Customer, string>;
  auctionLots!: Table<AuctionLot, string>;
  paymentPlans!: Table<PaymentPlan, string>;
  receipts!: Table<Receipt, string>;
  waybills!: Table<Waybill, string>;
  saleTransferDocs!: Table<SaleTransferDoc, string>;
  dealershipVehicles!: Table<DealershipVehicle, string>;
  landParcels!: Table<LandParcel, string>;
  propertyUnits!: Table<PropertyUnit, string>;
  inventoryItems!: Table<InventoryItem, string>;
  stockMovements!: Table<StockMovement, string>;
  syncOutbox!: Table<SyncOutboxItem, string>;

  // Accounting & Financial Management
  accounts!: Table<Account, string>;
  journalEntries!: Table<JournalEntry, string>;
  expenses!: Table<Expense, string>;
  invoices!: Table<Invoice, string>;
  cashShifts!: Table<CashShift, string>;

  constructor() {
    super('AmenDeskLocalDB');
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
  }

  async populateIfEmpty(): Promise<void> {
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
    }

    const accountCount = await this.accounts.count();
    if (accountCount === 0) {
      await this.accounts.bulkAdd(initialAccounts);
      await this.journalEntries.bulkAdd(initialJournalEntries);
      await this.expenses.bulkAdd(initialExpenses);
      await this.invoices.bulkAdd(initialInvoices);
      await this.cashShifts.bulkAdd(initialCashShifts);
    }
  }

  async resetToSeedData(): Promise<void> {
    await this.customers.clear();
    await this.auctionLots.clear();
    await this.paymentPlans.clear();
    await this.receipts.clear();
    await this.waybills.clear();
    await this.saleTransferDocs.clear();
    await this.dealershipVehicles.clear();
    await this.landParcels.clear();
    await this.propertyUnits.clear();
    await this.inventoryItems.clear();
    await this.stockMovements.clear();
    await this.syncOutbox.clear();
    await this.accounts.clear();
    await this.journalEntries.clear();
    await this.expenses.clear();
    await this.invoices.clear();
    await this.cashShifts.clear();
    await this.populateIfEmpty();
  }
}

export const db = new AmenDeskDB();


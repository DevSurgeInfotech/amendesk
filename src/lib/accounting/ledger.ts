import { db } from '@/lib/db';
import type {
  JournalEntry,
  JournalEntryLine,
  PaymentMethod,
  MoMoNetwork,
  PaymentSplit,
  Invoice,
} from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';

/**
 * Validates and posts a Journal Entry, adjusting balances of affected Chart of Accounts.
 * Follows standard double-entry accounting rules:
 * - Assets & Expenses: Debit increases balance, Credit decreases balance.
 * - Liabilities, Equity & Revenue: Credit increases balance, Debit decreases balance.
 */
export async function postJournalEntry(
  entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'syncStatus'>
): Promise<JournalEntry> {
  const totalDebits = entryData.lines.reduce((acc, l) => acc + l.debitGhs, 0);
  const totalCredits = entryData.lines.reduce((acc, l) => acc + l.creditGhs, 0);

  // Accounting balance validation: round to 2 decimals for precision
  const diff = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);
  if (diff > 0.05) {
    throw new Error(
      `Journal entry is out of balance! Total Debits: GH₵ ${totalDebits.toFixed(
        2
      )}, Total Credits: GH₵ ${totalCredits.toFixed(2)}`
    );
  }

  const entry: JournalEntry = {
    ...entryData,
    id: `je-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    totalAmountGhs: Math.round(totalDebits * 100) / 100,
    createdAt: new Date().toISOString(),
    syncStatus: syncEngine.getIsOnline() ? 'SYNCED' : 'PENDING',
  };

  await db.journalEntries.add(entry);

  // Update account balances
  for (const line of entry.lines) {
    const account = await db.accounts.get(line.accountId);
    if (!account) continue;

    let balanceDelta = 0;
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      balanceDelta = line.debitGhs - line.creditGhs;
    } else {
      // LIABILITY, EQUITY, REVENUE
      balanceDelta = line.creditGhs - line.debitGhs;
    }

    const newBalance = Math.round((account.balanceGhs + balanceDelta) * 100) / 100;
    await db.accounts.update(account.id, { balanceGhs: newBalance });
    await syncEngine.queueMutation('accounts', account.id, 'UPDATE', { balanceGhs: newBalance });
  }

  await syncEngine.queueMutation('journalEntries', entry.id, 'CREATE', entry);

  return entry;
}

/**
 * Maps payment method & facility to the corresponding Asset GL Account ID.
 * Follows QuickBooks Undeposited Funds clearance pattern for Cash and MoMo counter collections.
 */
export async function getPaymentAssetAccount(
  method: PaymentMethod,
  momoNetwork?: MoMoNetwork,
  bankName?: string,
  preferClearance = true
): Promise<{ id: string; code: string; name: string }> {
  const accounts = await db.accounts.toArray();

  if (method === 'MOMO') {
    if (preferClearance) {
      const clearingAcc = accounts.find((a) => a.code === '1035');
      if (clearingAcc) return { id: clearingAcc.id, code: clearingAcc.code, name: clearingAcc.name };
    }
    if (momoNetwork === 'VODAFONE') {
      const acc = accounts.find((a) => a.code === '1040');
      if (acc) return { id: acc.id, code: acc.code, name: acc.name };
    }
    const acc = accounts.find((a) => a.code === '1030');
    if (acc) return { id: acc.id, code: acc.code, name: acc.name };
  } else if (method === 'CASH') {
    if (preferClearance) {
      const clearingAcc = accounts.find((a) => a.code === '1015');
      if (clearingAcc) return { id: clearingAcc.id, code: clearingAcc.code, name: clearingAcc.name };
    }
    const acc = accounts.find((a) => a.code === '1010');
    if (acc) return { id: acc.id, code: acc.code, name: acc.name };
  } else if (method === 'BANK_TRANSFER') {
    if (bankName?.toLowerCase().includes('stanbic')) {
      const acc = accounts.find((a) => a.code === '1060');
      if (acc) return { id: acc.id, code: acc.code, name: acc.name };
    }
    if (bankName?.toLowerCase().includes('eco')) {
      const acc = accounts.find((a) => a.code === '1070');
      if (acc) return { id: acc.id, code: acc.code, name: acc.name };
    }
    const acc = accounts.find((a) => a.code === '1050');
    if (acc) return { id: acc.id, code: acc.code, name: acc.name };
  } else if (method === 'CARD_PAYSTACK') {
    const acc = accounts.find((a) => a.code === '1080');
    if (acc) return { id: acc.id, code: acc.code, name: acc.name };
  }

  // Fallback to Cash Clearance or Cash Till
  const fallback =
    accounts.find((a) => a.code === '1015') || accounts.find((a) => a.code === '1010') || accounts[0];
  return { id: fallback.id, code: fallback.code, name: fallback.name };
}

/**
 * Automatically creates and posts the double-entry journal entry for a logged receipt.
 * Supports both single-method payments and multi-channel split payments.
 * Tags entries with QuickBooks dimensional Class and Location metadata.
 */
export async function postPaymentReceiptLedger(
  receiptNumber: string,
  customerName: string,
  referenceTitle: string,
  referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL',
  amountGhs: number,
  paymentMethod: PaymentMethod,
  cashierName: string,
  momoNetwork?: MoMoNetwork,
  bankName?: string,
  splitPayments?: PaymentSplit[],
  locationName?: string
): Promise<JournalEntry> {
  const accounts = await db.accounts.toArray();
  const lines: JournalEntryLine[] = [];

  // Dimensional Class resolution
  const classCodeMap: Record<string, string> = {
    AUCTION: 'AUC_PRIV',
    DEALERSHIP: 'DEALERSHIP',
    LAND: 'LAND',
    PROPERTY: 'PROPERTY',
    GENERAL: 'ADMIN',
  };
  const targetClassCode = classCodeMap[referenceType] || 'ADMIN';
  const matchingClass = await db.accountingClasses.where('code').equals(targetClassCode).first();
  const classId = matchingClass?.id;
  const className = matchingClass?.name;

  if (splitPayments && splitPayments.length > 0) {
    let idx = 1;
    for (const split of splitPayments) {
      if (split.amountGhs <= 0) continue;
      const splitDebitAcc = await getPaymentAssetAccount(
        split.method,
        split.momoNetwork,
        split.bankName
      );
      lines.push({
        id: `line-${Date.now()}-${idx++}`,
        accountId: splitDebitAcc.id,
        accountCode: splitDebitAcc.code,
        accountName: splitDebitAcc.name,
        debitGhs: split.amountGhs,
        creditGhs: 0,
        classId,
        className,
        locationName,
        memo: `Receipt ${receiptNumber} Split — ${customerName} (${split.method}${
          split.momoNetwork ? ` ${split.momoNetwork}` : ''
        })`,
      });
    }
  } else {
    const debitAccount = await getPaymentAssetAccount(paymentMethod, momoNetwork, bankName);
    lines.push({
      id: `line-${Date.now()}-1`,
      accountId: debitAccount.id,
      accountCode: debitAccount.code,
      accountName: debitAccount.name,
      debitGhs: amountGhs,
      creditGhs: 0,
      classId,
      className,
      locationName,
      memo: `Receipt ${receiptNumber} — ${customerName} (${paymentMethod})`,
    });
  }

  // Credit Account: By default reduces Accounts Receivable (1200) for ongoing settlements,
  // or records direct revenue if miscellaneous/general
  let creditAccountId = '';
  let creditAccountCode = '1200';
  let creditAccountName = 'Accounts Receivable (14-Day Hammer Debtors)';

  if (referenceType === 'GENERAL') {
    const feeAcc = accounts.find((a) => a.code === '4060');
    if (feeAcc) {
      creditAccountId = feeAcc.id;
      creditAccountCode = feeAcc.code;
      creditAccountName = feeAcc.name;
    }
  } else {
    const arAcc = accounts.find((a) => a.code === '1200');
    if (arAcc) {
      creditAccountId = arAcc.id;
      creditAccountCode = arAcc.code;
      creditAccountName = arAcc.name;
    }
  }

  const fallbackAccountId = lines[0]?.accountId || accounts[0]?.id || 'acc-1200';

  lines.push({
    id: `line-${Date.now()}-${lines.length + 1}`,
    accountId: creditAccountId || fallbackAccountId,
    accountCode: creditAccountCode,
    accountName: creditAccountName,
    debitGhs: 0,
    creditGhs: amountGhs,
    classId,
    className,
    locationName,
    memo: `Settlement for ${referenceTitle}`,
  });

  return postJournalEntry({
    entryNumber: `JE-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    reference: receiptNumber,
    description: `Payment Receipt ${receiptNumber}: ${referenceTitle} — Paid by ${customerName}`,
    lines,
    totalAmountGhs: amountGhs,
    createdBy: cashierName,
    status: 'POSTED',
  });
}

/**
 * Automatically posts an Accounts Receivable / Revenue / GRA Tax Payable journal entry
 * when a Commercial/Tax Invoice is issued.
 */
export async function postInvoiceIssuedLedger(
  invoice: Invoice,
  createdBy = 'Accounts Office'
): Promise<JournalEntry> {
  const accounts = await db.accounts.toArray();
  const arAcc = accounts.find((a) => a.code === '1200') || accounts[0];

  const revenueCodeMap: Record<Invoice['referenceType'], string> = {
    AUCTION: '4010',
    DEALERSHIP: '4030', // Dealership Vehicle Direct Sales Revenue
    LAND: '4040',
    PROPERTY: '4050',
    GENERAL: '4060',
  };
  const revCode = revenueCodeMap[invoice.referenceType] || '4060';
  const revAcc =
    accounts.find((a) => a.code === revCode) ||
    accounts.find((a) => a.type === 'REVENUE') ||
    arAcc;

  // Resolve Class
  const classCodeMap: Record<string, string> = {
    AUCTION: 'AUC_PRIV',
    DEALERSHIP: 'DEALERSHIP',
    LAND: 'LAND',
    PROPERTY: 'PROPERTY',
    GENERAL: 'ADMIN',
  };
  const targetClassCode = classCodeMap[invoice.referenceType] || 'ADMIN';
  const matchingClass = await db.accountingClasses.where('code').equals(targetClassCode).first();
  const classId = matchingClass?.id;
  const className = matchingClass?.name;

  const lines: JournalEntryLine[] = [
    {
      id: `line-${Date.now()}-1`,
      accountId: arAcc.id,
      accountCode: arAcc.code,
      accountName: arAcc.name,
      debitGhs: invoice.totalAmountGhs,
      creditGhs: 0,
      classId,
      className,
      memo: `Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`,
    },
    {
      id: `line-${Date.now()}-2`,
      accountId: revAcc.id,
      accountCode: revAcc.code,
      accountName: revAcc.name,
      debitGhs: 0,
      creditGhs: invoice.subtotalGhs,
      classId,
      className,
      memo: `Net Revenue: ${invoice.referenceTitle || invoice.invoiceNumber}`,
    },
  ];

  const taxEntries: Array<{ code: string; fallbackName: string; amount: number }> = [
    { code: '2100', fallbackName: 'GRA VAT Payable (15%)', amount: invoice.vatGhs },
    { code: '2110', fallbackName: 'NHIL Levy Payable (2.5%)', amount: invoice.nhilGhs },
    { code: '2120', fallbackName: 'GETFund Levy Payable (2.5%)', amount: invoice.getfundGhs },
    { code: '2130', fallbackName: 'COVID-19 Health Recovery Levy (1%)', amount: invoice.covidGhs },
  ];

  let idx = 3;
  for (const tax of taxEntries) {
    if (tax.amount > 0) {
      const taxAcc = accounts.find((a) => a.code === tax.code);
      lines.push({
        id: `line-${Date.now()}-${idx++}`,
        accountId: taxAcc?.id || revAcc.id,
        accountCode: taxAcc?.code || tax.code,
        accountName: taxAcc?.name || tax.fallbackName,
        debitGhs: 0,
        creditGhs: tax.amount,
        classId,
        className,
        memo: `${tax.fallbackName} on ${invoice.invoiceNumber}`,
      });
    }
  }

  return postJournalEntry({
    entryNumber: `JE-${Date.now().toString().slice(-6)}`,
    date: invoice.issueDate || new Date().toISOString(),
    reference: invoice.invoiceNumber,
    description: `Commercial Invoice ${invoice.invoiceNumber}: ${
      invoice.referenceTitle || invoice.customerName
    }`,
    lines,
    totalAmountGhs: invoice.totalAmountGhs,
    createdBy,
    status: 'POSTED',
  });
}

/**
 * QuickBooks Perpetual Inventory COGS Posting Engine
 * Automatically debits Cost of Goods Sold (5010) and credits Vehicle Inventory (1300)
 * at landed cost when a dealership vehicle is sold.
 */
export async function postVehicleSaleCOGS(params: {
  vehicleVin: string;
  stockNumber: string;
  landedCostGhs: number;
  salePriceGhs: number;
  customerName: string;
  createdBy: string;
  locationName?: string;
}): Promise<JournalEntry> {
  const accounts = await db.accounts.toArray();
  const cogsAccount =
    accounts.find((a) => a.code === '5010') ||
    accounts.find((a) => a.category === 'COST_OF_SALES') ||
    accounts[0];
  const inventoryAccount =
    accounts.find((a) => a.code === '1300') ||
    accounts.find((a) => a.code.startsWith('13')) ||
    accounts[0];

  const dealerClass = await db.accountingClasses.where('code').equals('DEALERSHIP').first();

  const lines: JournalEntryLine[] = [
    {
      id: `line-${Date.now()}-1`,
      accountId: cogsAccount.id,
      accountCode: cogsAccount.code,
      accountName: cogsAccount.name,
      debitGhs: params.landedCostGhs,
      creditGhs: 0,
      classId: dealerClass?.id,
      className: dealerClass?.name,
      locationName: params.locationName,
      memo: `COGS: Landed cost of Vin ${params.vehicleVin} (Stock ${params.stockNumber})`,
    },
    {
      id: `line-${Date.now()}-2`,
      accountId: inventoryAccount.id,
      accountCode: inventoryAccount.code,
      accountName: inventoryAccount.name,
      debitGhs: 0,
      creditGhs: params.landedCostGhs,
      classId: dealerClass?.id,
      className: dealerClass?.name,
      locationName: params.locationName,
      memo: `Inventory reduction for Vin ${params.vehicleVin} sold to ${params.customerName}`,
    },
  ];

  return postJournalEntry({
    entryNumber: `JE-COGS-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    reference: `VIN-${params.vehicleVin.slice(-6)}`,
    description: `Vehicle Disposal COGS: Stock ${params.stockNumber} (VIN ${params.vehicleVin}) sold to ${params.customerName}`,
    lines,
    totalAmountGhs: params.landedCostGhs,
    createdBy: params.createdBy,
    status: 'POSTED',
  });
}

/**
 * QuickBooks Fiduciary Trust Accounting: Judicial High Court Remittance
 * Records remittance to High Court Registrar from ring-fenced escrow account (1070/2030).
 */
export async function postJudicialCourtRemittance(params: {
  remittanceAmountGhs: number;
  courtCaseNumber: string;
  sheriffInstructionRef: string;
  approvedBy: string;
}): Promise<JournalEntry> {
  const accounts = await db.accounts.toArray();
  const escrowPayable = accounts.find((a) => a.code === '2030') || accounts[0];
  const escrowBank = accounts.find((a) => a.code === '1070') || accounts[0];

  const judClass = await db.accountingClasses.where('code').equals('AUC_JUD').first();

  const lines: JournalEntryLine[] = [
    {
      id: `line-${Date.now()}-1`,
      accountId: escrowPayable.id,
      accountCode: escrowPayable.code,
      accountName: escrowPayable.name,
      debitGhs: params.remittanceAmountGhs,
      creditGhs: 0,
      classId: judClass?.id,
      className: judClass?.name,
      memo: `Remittance to Court Registrar — Case: ${params.courtCaseNumber}`,
    },
    {
      id: `line-${Date.now()}-2`,
      accountId: escrowBank.id,
      accountCode: escrowBank.code,
      accountName: escrowBank.name,
      debitGhs: 0,
      creditGhs: params.remittanceAmountGhs,
      classId: judClass?.id,
      className: judClass?.name,
      memo: `Disbursement from Ecobank Judicial Escrow — Writ: ${params.sheriffInstructionRef}`,
    },
  ];

  return postJournalEntry({
    entryNumber: `JE-JUD-REMIT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    reference: params.courtCaseNumber,
    description: `Judicial High Court Remittance: Case ${params.courtCaseNumber} (Ref: ${params.sheriffInstructionRef})`,
    lines,
    totalAmountGhs: params.remittanceAmountGhs,
    createdBy: params.approvedBy,
    status: 'POSTED',
  });
}

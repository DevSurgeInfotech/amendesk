import { db } from '@/lib/db';
import type { JournalEntry, JournalEntryLine, PaymentMethod, MoMoNetwork } from '@/lib/types';
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
    totalAmountGhs: totalDebits,
    createdAt: new Date().toISOString(),
    syncStatus: 'SYNCED',
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

    const newBalance = account.balanceGhs + balanceDelta;
    await db.accounts.update(account.id, { balanceGhs: newBalance });
    await syncEngine.queueMutation('accounts', account.id, 'UPDATE', { balanceGhs: newBalance });
  }

  await syncEngine.queueMutation('journalEntries', entry.id, 'CREATE', entry);

  return entry;
}

/**
 * Maps payment method & facility to the corresponding Asset GL Account ID
 */
export async function getPaymentAssetAccount(
  method: PaymentMethod,
  momoNetwork?: MoMoNetwork,
  bankName?: string
): Promise<{ id: string; code: string; name: string }> {
  const accounts = await db.accounts.toArray();

  if (method === 'MOMO') {
    if (momoNetwork === 'VODAFONE') {
      const acc = accounts.find((a) => a.code === '1040');
      if (acc) return { id: acc.id, code: acc.code, name: acc.name };
    }
    const acc = accounts.find((a) => a.code === '1030');
    if (acc) return { id: acc.id, code: acc.code, name: acc.name };
  } else if (method === 'CASH') {
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

  // Fallback to Cash Till
  const fallback = accounts.find((a) => a.code === '1010') || accounts[0];
  return { id: fallback.id, code: fallback.code, name: fallback.name };
}

/**
 * Automatically creates and posts the double-entry journal entry for a logged receipt
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
  bankName?: string
): Promise<JournalEntry> {
  const debitAccount = await getPaymentAssetAccount(paymentMethod, momoNetwork, bankName);
  const accounts = await db.accounts.toArray();

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

  const lines: JournalEntryLine[] = [
    {
      id: `line-${Date.now()}-1`,
      accountId: debitAccount.id,
      accountCode: debitAccount.code,
      accountName: debitAccount.name,
      debitGhs: amountGhs,
      creditGhs: 0,
      memo: `Receipt ${receiptNumber} — ${customerName} (${paymentMethod})`,
    },
    {
      id: `line-${Date.now()}-2`,
      accountId: creditAccountId || debitAccount.id,
      accountCode: creditAccountCode,
      accountName: creditAccountName,
      debitGhs: 0,
      creditGhs: amountGhs,
      memo: `Settlement for ${referenceTitle}`,
    },
  ];

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

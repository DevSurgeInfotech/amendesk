import { db } from '@/lib/db';
import type { BankDeposit, Receipt } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';
import { postJournalEntry } from './ledger';

/**
 * QuickBooks Undeposited Funds & Banking Clearance Engine
 * Handles batching front-desk cash till collections & MoMo receipts into single bank deposits
 * matching real-world GCB/Stanbic bank statements.
 *
 * NOTE: Strictly restricted to ACCOUNTANT or ADMIN roles as confirmed by user rules.
 */

export async function getUndepositedReceipts(): Promise<Receipt[]> {
  const receipts = await db.receipts.toArray();
  return receipts.filter((r) => {
    // Receipts eligible for banking: Cash, MoMo, or Card that haven't been deposited yet
    return (
      r.depositStatus !== 'DEPOSITED' &&
      (r.paymentMethod === 'CASH' || r.paymentMethod === 'MOMO' || r.paymentMethod === 'CARD_PAYSTACK')
    );
  });
}

export async function postBankDeposit(params: {
  targetBankAccountId: string;
  clearedReceiptIds: string[];
  bankSlipReference?: string;
  depositorName: string;
  depositedByRole: 'ACCOUNTANT' | 'OWNER' | 'ADMIN';
  depositDate?: string;
  notes?: string;
}): Promise<BankDeposit> {
  // 1. Role enforcement: Strictly Accountant or Owner/Admin
  if (
    params.depositedByRole !== 'ACCOUNTANT' &&
    params.depositedByRole !== 'OWNER' &&
    params.depositedByRole !== 'ADMIN'
  ) {
    throw new Error('Unauthorized: Bank Deposits can strictly only be posted by an Accountant or Owner.');
  }

  if (params.clearedReceiptIds.length === 0) {
    throw new Error('At least one receipt must be selected to prepare a bank deposit.');
  }

  // 2. Fetch target bank account
  const targetAccount = await db.accounts.get(params.targetBankAccountId);
  if (!targetAccount) {
    throw new Error(`Target bank account with ID "${params.targetBankAccountId}" not found.`);
  }

  // 3. Fetch all receipts to be cleared
  const receiptsToClear: Receipt[] = [];
  let cashTotal = 0;
  let momoTotal = 0;
  let cardTotal = 0;

  for (const receiptId of params.clearedReceiptIds) {
    const r = await db.receipts.get(receiptId);
    if (!r) continue;
    if (r.depositStatus === 'DEPOSITED') {
      throw new Error(`Receipt ${r.receiptNumber} has already been cleared into another deposit.`);
    }
    receiptsToClear.push(r);

    if (r.paymentMethod === 'CASH') {
      cashTotal += r.amountPaidGhs;
    } else if (r.paymentMethod === 'MOMO') {
      momoTotal += r.amountPaidGhs;
    } else if (r.paymentMethod === 'CARD_PAYSTACK') {
      cardTotal += r.amountPaidGhs;
    }
  }

  const grandTotal = Math.round((cashTotal + momoTotal + cardTotal) * 100) / 100;
  if (grandTotal <= 0) {
    throw new Error('Total deposit amount must be greater than GH₵ 0.00.');
  }

  // 4. Generate BankDeposit record
  const depositDate = params.depositDate || new Date().toISOString().split('T')[0];
  const depositNumber = `DEP-${Date.now().toString().slice(-6)}`;
  const depositId = `dep-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  let sourceAccountType: BankDeposit['sourceAccountType'] = 'CASH_CLEARING';
  if (cashTotal > 0 && momoTotal > 0) sourceAccountType = 'MIXED';
  else if (momoTotal > 0) sourceAccountType = 'MOMO_CLEARING';

  const deposit: BankDeposit = {
    id: depositId,
    depositNumber,
    depositDate,
    targetBankAccountId: targetAccount.id,
    targetBankAccountName: targetAccount.name,
    totalAmountGhs: grandTotal,
    sourceAccountType,
    clearedReceiptIds: params.clearedReceiptIds,
    bankSlipReference: params.bankSlipReference,
    depositorName: params.depositorName,
    depositedByRole: params.depositedByRole,
    notes: params.notes,
    syncStatus: syncEngine.getIsOnline() ? 'SYNCED' : 'PENDING',
    createdAt: new Date().toISOString(),
  };

  // 5. Update each cleared receipt
  for (const receipt of receiptsToClear) {
    await db.receipts.update(receipt.id, {
      depositStatus: 'DEPOSITED',
      bankDepositId: deposit.id,
    });
    await syncEngine.queueMutation('receipts', receipt.id, 'UPDATE', {
      depositStatus: 'DEPOSITED',
      bankDepositId: deposit.id,
    });
  }

  // 6. Save deposit
  await db.bankDeposits.add(deposit);
  await syncEngine.queueMutation('bankDeposits', deposit.id, 'CREATE', deposit);

  // 7. Post the double-entry GL splits (QuickBooks Deposit transaction)
  // Debit: Target Bank Account (GCB / Stanbic)
  // Credit: Undeposited Cash (1015) & MoMo Clearing (1035) / Cash Till (1010)
  const accounts = await db.accounts.toArray();
  const undepositedCashAcc =
    accounts.find((a) => a.code === '1015') || accounts.find((a) => a.code === '1010') || targetAccount;
  const momoClearingAcc =
    accounts.find((a) => a.code === '1035') || accounts.find((a) => a.code === '1030') || targetAccount;
  const cardClearingAcc = accounts.find((a) => a.code === '1080') || targetAccount;

  const lines = [
    {
      id: `line-${Date.now()}-1`,
      accountId: targetAccount.id,
      accountCode: targetAccount.code,
      accountName: targetAccount.name,
      debitGhs: grandTotal,
      creditGhs: 0,
      memo: `Bank Deposit ${depositNumber} to ${targetAccount.name}${
        params.bankSlipReference ? ` (Slip Ref: ${params.bankSlipReference})` : ''
      }`,
    },
  ];

  let lineIdx = 2;
  if (cashTotal > 0) {
    lines.push({
      id: `line-${Date.now()}-${lineIdx++}`,
      accountId: undepositedCashAcc.id,
      accountCode: undepositedCashAcc.code,
      accountName: undepositedCashAcc.name,
      debitGhs: 0,
      creditGhs: Math.round(cashTotal * 100) / 100,
      memo: `Cleared Undeposited Till Cash into Deposit ${depositNumber}`,
    });
  }

  if (momoTotal > 0) {
    lines.push({
      id: `line-${Date.now()}-${lineIdx++}`,
      accountId: momoClearingAcc.id,
      accountCode: momoClearingAcc.code,
      accountName: momoClearingAcc.name,
      debitGhs: 0,
      creditGhs: Math.round(momoTotal * 100) / 100,
      memo: `Cleared MoMo Float Collections into Deposit ${depositNumber}`,
    });
  }

  if (cardTotal > 0) {
    lines.push({
      id: `line-${Date.now()}-${lineIdx++}`,
      accountId: cardClearingAcc.id,
      accountCode: cardClearingAcc.code,
      accountName: cardClearingAcc.name,
      debitGhs: 0,
      creditGhs: Math.round(cardTotal * 100) / 100,
      memo: `Cleared Card Settlements into Deposit ${depositNumber}`,
    });
  }

  await postJournalEntry({
    entryNumber: `JE-DEP-${depositNumber.slice(-6)}`,
    date: new Date(depositDate).toISOString(),
    reference: depositNumber,
    description: `Bank Deposit ${depositNumber}: Cleared ${receiptsToClear.length} collections into ${targetAccount.name}`,
    lines,
    totalAmountGhs: grandTotal,
    createdBy: params.depositorName,
    status: 'POSTED',
  });

  return deposit;
}

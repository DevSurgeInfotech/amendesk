import { db } from '@/lib/db';
import type { AccountingItem, ItemType } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';

/**
 * QuickBooks Two-Sided Item Master Engine
 * Decouples domain operational forms from raw Chart of Accounts codes.
 */

export async function getAllAccountingItems(onlyActive = true): Promise<AccountingItem[]> {
  const items = await db.accountingItems.toArray();
  if (onlyActive) {
    return items.filter((i) => i.isActive);
  }
  return items;
}

export async function getAccountingItemById(id: string): Promise<AccountingItem | undefined> {
  return db.accountingItems.get(id);
}

export async function getAccountingItemBySku(sku: string): Promise<AccountingItem | undefined> {
  return db.accountingItems.where('sku').equals(sku).first();
}

export async function resolveItemGlAccounts(itemId: string): Promise<{
  item: AccountingItem;
  incomeAccount?: { id: string; code: string; name: string };
  expenseAccount?: { id: string; code: string; name: string };
  assetAccount?: { id: string; code: string; name: string };
}> {
  const item = await db.accountingItems.get(itemId);
  if (!item) {
    throw new Error(`Accounting item with ID "${itemId}" not found in master catalog.`);
  }

  const incomeAcc = item.incomeAccountId ? await db.accounts.get(item.incomeAccountId) : undefined;
  const expenseAcc = item.expenseAccountId ? await db.accounts.get(item.expenseAccountId) : undefined;
  const assetAcc = item.assetAccountId ? await db.accounts.get(item.assetAccountId) : undefined;

  return {
    item,
    incomeAccount: incomeAcc ? { id: incomeAcc.id, code: incomeAcc.code, name: incomeAcc.name } : undefined,
    expenseAccount: expenseAcc ? { id: expenseAcc.id, code: expenseAcc.code, name: expenseAcc.name } : undefined,
    assetAccount: assetAcc ? { id: assetAcc.id, code: assetAcc.code, name: assetAcc.name } : undefined,
  };
}

export async function createAccountingItem(data: {
  name: string;
  sku: string;
  type: ItemType;
  description: string;
  incomeAccountId: string;
  expenseAccountId?: string;
  assetAccountId?: string;
  defaultUnitPriceGhs?: number;
  isTaxable?: boolean;
  category: AccountingItem['category'];
}): Promise<AccountingItem> {
  const now = new Date().toISOString();
  const id = `item-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const newItem: AccountingItem = {
    id,
    name: data.name,
    sku: data.sku,
    type: data.type,
    description: data.description,
    incomeAccountId: data.incomeAccountId,
    expenseAccountId: data.expenseAccountId,
    assetAccountId: data.assetAccountId,
    defaultUnitPriceGhs: data.defaultUnitPriceGhs || 0,
    isTaxable: data.isTaxable ?? false,
    category: data.category,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.accountingItems.add(newItem);
  await syncEngine.queueMutation('accountingItems', newItem.id, 'CREATE', newItem);

  return newItem;
}

export async function updateAccountingItem(
  id: string,
  updates: Partial<Omit<AccountingItem, 'id' | 'createdAt'>>
): Promise<AccountingItem> {
  const existing = await db.accountingItems.get(id);
  if (!existing) {
    throw new Error(`Accounting item "${id}" does not exist.`);
  }

  const updated: AccountingItem = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.accountingItems.put(updated);
  await syncEngine.queueMutation('accountingItems', id, 'UPDATE', updated);

  return updated;
}

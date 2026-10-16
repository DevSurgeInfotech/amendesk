import { db } from '@/lib/db';
import type { AccountingClass, AccountingLocation, AuctionCategory } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';

/**
 * QuickBooks Dimensional Accounting: Classes & Locations
 * Enables multi-dimensional P&L reporting across business lines & yards without multiplying COA accounts.
 */

export async function getAllAccountingClasses(onlyActive = true): Promise<AccountingClass[]> {
  const classes = await db.accountingClasses.toArray();
  if (onlyActive) {
    return classes.filter((c) => c.isActive);
  }
  return classes;
}

export async function getAllAccountingLocations(onlyActive = true): Promise<AccountingLocation[]> {
  const locations = await db.accountingLocations.toArray();
  if (onlyActive) {
    return locations.filter((l) => l.isActive);
  }
  return locations;
}

export async function getClassByCode(code: string): Promise<AccountingClass | undefined> {
  return db.accountingClasses.where('code').equals(code).first();
}

export async function getLocationByCode(code: string): Promise<AccountingLocation | undefined> {
  return db.accountingLocations.where('code').equals(code).first();
}

/**
 * Maps an auction category to its standard Accounting Class
 */
export async function resolveAuctionClass(category: AuctionCategory): Promise<AccountingClass | undefined> {
  const codeMap: Record<AuctionCategory, string> = {
    PRIVATE: 'AUC_PRIV',
    GOVERNMENT: 'AUC_GOV',
    JUDICIAL: 'AUC_JUD',
  };
  const targetCode = codeMap[category] || 'AUC_PRIV';
  return getClassByCode(targetCode);
}

/**
 * Maps a direct business line reference type to its standard Accounting Class
 */
export async function resolveReferenceClass(
  refType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL',
  auctionCategory?: AuctionCategory
): Promise<AccountingClass | undefined> {
  if (refType === 'AUCTION') {
    return resolveAuctionClass(auctionCategory || 'PRIVATE');
  }
  const codeMap: Record<string, string> = {
    DEALERSHIP: 'DEALERSHIP',
    LAND: 'LAND',
    PROPERTY: 'PROPERTY',
    GENERAL: 'ADMIN',
  };
  const targetCode = codeMap[refType] || 'ADMIN';
  return getClassByCode(targetCode);
}

export async function createAccountingClass(data: {
  code: string;
  name: string;
  businessLine: AccountingClass['businessLine'];
  description?: string;
}): Promise<AccountingClass> {
  const existing = await getClassByCode(data.code);
  if (existing) {
    throw new Error(`Accounting class with code "${data.code}" already exists.`);
  }

  const newClass: AccountingClass = {
    id: `cls-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    code: data.code,
    name: data.name,
    businessLine: data.businessLine,
    description: data.description,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await db.accountingClasses.add(newClass);
  await syncEngine.queueMutation('accountingClasses', newClass.id, 'CREATE', newClass);
  return newClass;
}

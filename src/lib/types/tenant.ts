export type TenantId = 'amen-mart-sandbox' | 'amen-mart-live';

export interface Tenant {
  id: TenantId;
  name: string;
  shortName: string;
  code: string;
  isSandbox: boolean;
  badgeLabel: string;
  description: string;
}

export const SYSTEM_TENANTS: Record<TenantId, Tenant> = {
  'amen-mart-sandbox': {
    id: 'amen-mart-sandbox',
    name: 'AmenDesk (Demo Yard)',
    shortName: 'Demo Yard',
    code: 'DEMO',
    isSandbox: true,
    badgeLabel: 'SANDBOX DEMO',
    description: 'Dev Surge client demonstration & feature testing workspace with seeded Ghanaian dataset.',
  },
  'amen-mart-live': {
    id: 'amen-mart-live',
    name: 'Amen Mart Ghana',
    shortName: 'Amen Mart',
    code: 'LIVE',
    isSandbox: false,
    badgeLabel: 'LIVE PRODUCTION',
    description: 'Commercial live operations & real financial general ledger for Amen Mart staff.',
  },
};

export const TENANT_STORAGE_KEY = 'amendesk_active_tenant_id';

/**
 * Checks whether the app is running in a live client production deployment.
 */
export function isProductionDeployment(): boolean {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.NEXT_PUBLIC_APP_ENV === 'test') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * Returns the active Tenant ID.
 * Supports URL parameters (?tenant=demo or ?tenant=live), saved localStorage,
 * and smart environment defaults (Live for production, Demo for local/staging).
 */
export function getActiveTenantId(): TenantId {
  if (typeof window === 'undefined') {
    return isProductionDeployment() ? 'amen-mart-live' : 'amen-mart-sandbox';
  }

  // 1. Check URL parameters for explicit tenant or demo flags
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant') || urlParams.get('workspace');
    if (tenantParam) {
      const normalized = tenantParam.toLowerCase().trim();
      if (normalized === 'demo' || normalized === 'sandbox' || normalized === 'amen-mart-sandbox') {
        localStorage.setItem(TENANT_STORAGE_KEY, 'amen-mart-sandbox');
        return 'amen-mart-sandbox';
      }
      if (
        normalized === 'live' ||
        normalized === 'prod' ||
        normalized === 'amen-mart-live' ||
        normalized === 'amen-mart'
      ) {
        localStorage.setItem(TENANT_STORAGE_KEY, 'amen-mart-live');
        return 'amen-mart-live';
      }
    }
    if (urlParams.get('demo') === '1' || urlParams.get('demo') === 'true') {
      localStorage.setItem(TENANT_STORAGE_KEY, 'amen-mart-sandbox');
      return 'amen-mart-sandbox';
    }
  } catch {
    // Ignore URL parsing errors
  }

  // 2. Check saved localStorage selection
  try {
    const saved = localStorage.getItem(TENANT_STORAGE_KEY) as TenantId | null;
    if (saved && (saved === 'amen-mart-sandbox' || saved === 'amen-mart-live')) {
      return saved;
    }
  } catch {
    // LocalStorage inaccessible
  }

  // 3. Environment default: In production, default to 'amen-mart-live' so Amen Mart gets their clean workspace
  // In development, default to 'amen-mart-sandbox'
  return isProductionDeployment() ? 'amen-mart-live' : 'amen-mart-sandbox';
}

/**
 * Switches the active tenant and reloads the application cleanly.
 */
export function setActiveTenantId(tenantId: TenantId): void {
  if (typeof window === 'undefined') return;

  if (tenantId !== 'amen-mart-sandbox' && tenantId !== 'amen-mart-live') {
    throw new Error(`Action blocked: Unknown tenant "${tenantId}".`);
  }

  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);

  // Clean URL tenant query params if present so reload stays on chosen tenant
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('tenant') || url.searchParams.has('workspace') || url.searchParams.has('demo')) {
      url.searchParams.delete('tenant');
      url.searchParams.delete('workspace');
      url.searchParams.delete('demo');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Ignore URL manipulation error
  }

  window.location.reload();
}


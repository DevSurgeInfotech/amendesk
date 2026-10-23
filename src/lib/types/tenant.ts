export type TenantId = 'amen-mart-sandbox' | 'amen-mart-live';

export interface Tenant {
  id: TenantId;
  name: string;
  code: string;
  isSandbox: boolean;
  description: string;
}

export const SYSTEM_TENANTS: Record<TenantId, Tenant> = {
  'amen-mart-sandbox': {
    id: 'amen-mart-sandbox',
    name: 'Amen Mart (Demo Yard)',
    code: 'SANDBOX',
    isSandbox: true,
    description: 'Dev Surge Staging & Feature Testing Sandbox (Seeded Dataset)',
  },
  'amen-mart-live': {
    id: 'amen-mart-live',
    name: 'Amen Mart Ghana',
    code: 'LIVE',
    isSandbox: false,
    description: 'Commercial Live Operations & Financial General Ledger',
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
 * - In client production deployments: 100% hardcoded to 'amen-mart-live'.
 * - In development & staging: defaults to 'amen-mart-sandbox' (Demo Yard) unless switched.
 */
export function getActiveTenantId(): TenantId {
  if (isProductionDeployment()) {
    return 'amen-mart-live';
  }

  if (typeof window === 'undefined') {
    return 'amen-mart-sandbox';
  }

  try {
    const saved = localStorage.getItem(TENANT_STORAGE_KEY) as TenantId | null;
    if (saved && (saved === 'amen-mart-sandbox' || saved === 'amen-mart-live')) {
      return saved;
    }
  } catch {
    // Fall back to default
  }

  return 'amen-mart-sandbox';
}

/**
 * Switches the active tenant and reloads the application cleanly.
 */
export function setActiveTenantId(tenantId: TenantId): void {
  if (isProductionDeployment() && tenantId !== 'amen-mart-live') {
    throw new Error('Action blocked: Sandbox tenant is disabled in production.');
  }

  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
  window.location.reload();
}

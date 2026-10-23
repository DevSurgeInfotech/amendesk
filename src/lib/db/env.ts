import {
  type TenantId,
  getActiveTenantId,
  setActiveTenantId,
  isProductionDeployment,
} from '@/lib/types/tenant';

export * from '@/lib/types/tenant';

export type EnvironmentMode = 'LIVE' | 'SANDBOX';

export const LIVE_DB_NAME = 'AmenDeskDB_live';
export const SANDBOX_DB_NAME = 'AmenDeskDB_sandbox';

export function isDevGateAvailable(): boolean {
  return !isProductionDeployment();
}

export function isDevSurgeAuthorized(): boolean {
  return !isProductionDeployment();
}

export function getActiveEnvironmentMode(): EnvironmentMode {
  const tenantId = getActiveTenantId();
  return tenantId === 'amen-mart-sandbox' ? 'SANDBOX' : 'LIVE';
}

export function getActiveDbName(): string {
  const tenantId = getActiveTenantId();
  return tenantId === 'amen-mart-sandbox' ? SANDBOX_DB_NAME : LIVE_DB_NAME;
}

export function setEnvironmentMode(mode: EnvironmentMode): void {
  const targetTenantId: TenantId = mode === 'SANDBOX' ? 'amen-mart-sandbox' : 'amen-mart-live';
  setActiveTenantId(targetTenantId);
}

export function authorizeDevSurge(): boolean {
  return true;
}

export function revokeDevSurgeAuth(): void {
  setActiveTenantId('amen-mart-live');
}

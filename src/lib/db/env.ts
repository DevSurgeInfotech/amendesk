export type EnvironmentMode = 'LIVE' | 'SANDBOX';

export const ENV_MODE_KEY = 'amendesk_environment_mode';
export const DEV_SURGE_AUTH_KEY = 'amendesk_dev_surge_authorized';

// Authorized engineer passcodes for Dev Surge Infotech staging environments
export const DEV_SURGE_PASSCODES = ['surge@amen2026', 'devsurge2026'];

export const LIVE_DB_NAME = 'AmenDesk_Live';
export const SANDBOX_DB_NAME = 'AmenDesk_Sandbox';

/**
 * Strict Environment Isolation Gate.
 * Determines whether the application is running in a client production deployment.
 *
 * In production:
 * - The system is HARD-LOCKED to AmenDesk_Live.
 * - All Dev Surge diagnostic backdoors, shortcuts, and passcodes are completely disabled.
 * - Dev Surge engineers CANNOT access, toggle, or browse Amen Mart's live data.
 * - Access is governed strictly by accounts provisioned by Amen Mart administrators.
 */
export function isProductionDeployment(): boolean {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.NEXT_PUBLIC_APP_ENV === 'test') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * Determines whether Dev Surge staging/diagnostic gates are allowed.
 * Strictly false in client production deployments.
 */
export function isDevGateAvailable(): boolean {
  return !isProductionDeployment();
}

/**
 * Checks whether Dev Surge staging authorization is active on this device.
 * Always returns false in client production deployments.
 */
export function isDevSurgeAuthorized(): boolean {
  if (isProductionDeployment()) return false;
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEV_SURGE_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Returns the active environment mode.
 *
 * In Production: ALWAYS returns 'LIVE'.
 * In Dev Surge Staging / Local Dev: Defaults to 'SANDBOX' (The Dummy Yard).
 */
export function getActiveEnvironmentMode(): EnvironmentMode {
  // In production client deployments: 100% hard-locked to LIVE
  if (isProductionDeployment()) {
    return 'LIVE';
  }

  // In internal development / staging environments: default to the Dummy Yard (SANDBOX)
  if (typeof window === 'undefined') return 'SANDBOX';
  try {
    const mode = localStorage.getItem(ENV_MODE_KEY);
    return mode === 'LIVE' ? 'LIVE' : 'SANDBOX';
  } catch {
    return 'SANDBOX';
  }
}

/**
 * Returns the active Dexie database name.
 */
export function getActiveDbName(): string {
  const mode = getActiveEnvironmentMode();
  return mode === 'SANDBOX' ? SANDBOX_DB_NAME : LIVE_DB_NAME;
}

/**
 * Switches the environment mode in development / staging.
 * Strictly blocked in production.
 */
export function setEnvironmentMode(mode: EnvironmentMode): void {
  if (isProductionDeployment()) {
    throw new Error('Access Denied: Environment switching is permanently disabled in production.');
  }
  if (typeof window === 'undefined') return;
  localStorage.setItem(ENV_MODE_KEY, mode);
  window.location.reload();
}

/**
 * Validates a Dev Surge engineer passcode in staging/dev.
 * Strictly blocked in production.
 */
export function authorizeDevSurge(passcode: string): boolean {
  if (isProductionDeployment()) return false;
  if (typeof window === 'undefined') return false;
  const normalized = passcode.trim().toLowerCase();
  const isValid = DEV_SURGE_PASSCODES.some((code) => code.toLowerCase() === normalized);
  if (isValid) {
    localStorage.setItem(DEV_SURGE_AUTH_KEY, 'true');
    return true;
  }
  return false;
}

/**
 * Revokes staging authorization.
 */
export function revokeDevSurgeAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEV_SURGE_AUTH_KEY);
  localStorage.removeItem(ENV_MODE_KEY);
  window.location.reload();
}

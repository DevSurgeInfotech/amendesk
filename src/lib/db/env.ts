export type EnvironmentMode = 'LIVE' | 'SANDBOX';

export const ENV_MODE_KEY = 'amendesk_environment_mode';
export const DEV_SURGE_AUTH_KEY = 'amendesk_dev_surge_authorized';

// Authorized engineer passcodes for Dev Surge Infotech
export const DEV_SURGE_PASSCODES = ['surge@amen2026', 'devsurge2026'];

export const LIVE_DB_NAME = 'AmenDesk_Live';
export const SANDBOX_DB_NAME = 'AmenDesk_Sandbox';

/**
 * Checks whether the current device/browser is authorized by Dev Surge Infotech.
 * On Amen Mart terminals/tablets, this will always be false by default.
 */
export function isDevSurgeAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEV_SURGE_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Returns the active environment mode.
 * Crucial security guarantee: If the device is not authorized by Dev Surge,
 * this function ALWAYS returns 'LIVE', completely cloaking the Sandbox.
 */
export function getActiveEnvironmentMode(): EnvironmentMode {
  if (typeof window === 'undefined') return 'LIVE';
  try {
    if (!isDevSurgeAuthorized()) return 'LIVE';
    const mode = localStorage.getItem(ENV_MODE_KEY);
    return mode === 'SANDBOX' ? 'SANDBOX' : 'LIVE';
  } catch {
    return 'LIVE';
  }
}

/**
 * Returns the active Dexie database name.
 * 'AmenDesk_Sandbox' is ONLY ever returned if Dev Surge has authorized this device
 * and explicitly activated Sandbox mode. Otherwise, 'AmenDesk_Live' is used.
 */
export function getActiveDbName(): string {
  const mode = getActiveEnvironmentMode();
  return mode === 'SANDBOX' ? SANDBOX_DB_NAME : LIVE_DB_NAME;
}

/**
 * Switches the environment mode and cleanly reloads the application.
 * Reloading ensures all Dexie database connections, sync listeners, and React
 * caches cleanly re-bind to the target database instance.
 */
export function setEnvironmentMode(mode: EnvironmentMode): void {
  if (typeof window === 'undefined') return;
  if (mode === 'SANDBOX' && !isDevSurgeAuthorized()) {
    throw new Error('Unauthorized: Dev Surge engineer authorization required to switch to Sandbox mode.');
  }
  localStorage.setItem(ENV_MODE_KEY, mode);
  window.location.reload();
}

/**
 * Validates a Dev Surge engineer passcode and persists authorization.
 */
export function authorizeDevSurge(passcode: string): boolean {
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
 * Revokes Dev Surge authorization and forces the terminal back to pure Amen Mart LIVE mode.
 * Essential when handing a tablet or workstation back to the client.
 */
export function revokeDevSurgeAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEV_SURGE_AUTH_KEY);
  localStorage.setItem(ENV_MODE_KEY, 'LIVE');
  window.location.reload();
}

import type {
  AppRole,
  AuthSession,
  TenantRecord,
  UserAccount,
} from '@/lib/types/auth';
import type {
  WorkspaceSettings,
  StaffInvitation,
} from '@/lib/types/workspaceSettings';
import { DEFAULT_WORKSPACE_SETTINGS } from '@/lib/types/workspaceSettings';
import { TENANT_STORAGE_KEY } from '@/lib/types/tenant';

export const SESSION_STORAGE_KEY = 'amendesk_auth_session';
export const TENANTS_STORAGE_KEY = 'amendesk_platform_tenants';
export const USERS_STORAGE_KEY = 'amendesk_platform_users';
export const INVITATIONS_STORAGE_KEY = 'amendesk_staff_invitations';
export const SETTINGS_STORAGE_PREFIX = 'amendesk_workspace_settings_';
export const AUTH_CHANGE_EVENT = 'amendesk-auth-change';

export const DEFAULT_TENANTS: TenantRecord[] = [
  {
    id: 'amen-mart-live',
    code: 'AMEN-MART',
    name: 'Amen Mart Ghana',
    shortName: 'Amen Mart',
    environment: 'LIVE',
    status: 'ACTIVE',
    contactEmail: 'amenmart2291@gmail.com',
    phone: '0548517277 / 0558314744',
    address: 'Gbawe, Flower Junction, Accra — Ghana',
    createdAt: '2026-01-01T00:00:00Z',
    description: 'Commercial live operations & real financial general ledger for Amen Mart.',
  },
  {
    id: 'amen-mart-sandbox',
    code: 'DEMO',
    name: 'Amen Mart Demo Yard',
    shortName: 'Amen Mart Demo',
    environment: 'SANDBOX',
    status: 'ACTIVE',
    contactEmail: 'devsurgeinfotech@gmail.com',
    phone: '0548517277',
    address: 'Dev Surge Sandbox Yard, Accra — Ghana',
    createdAt: '2026-01-01T00:00:00Z',
    description: 'Dev Surge client demonstration & feature testing workspace with seeded Ghanaian dataset.',
  },
];

export const DEFAULT_USERS: UserAccount[] = [
  // Amen Mart Live Provisioned Accounts (Zero mock records, real live operational staff)
  {
    id: 'usr-am-live-account',
    tenantId: 'amen-mart-live',
    username: 'amenmart.live',
    email: 'live@amenmart.com',
    fullName: 'Amen Mart Live Account',
    role: 'OWNER',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-live-alias',
    tenantId: 'amen-mart-live',
    username: 'amenmart',
    email: 'amenmart@amenmart.com',
    fullName: 'Amen Mart Executive',
    role: 'OWNER',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-owner-1',
    tenantId: 'amen-mart-live',
    username: 'francis.yeboah',
    email: 'dr.yeboah@amenmart.com',
    fullName: 'Dr. Francis Kwaku Yeboah',
    role: 'OWNER',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-owner-2',
    tenantId: 'amen-mart-live',
    username: 'kwesi.boateng',
    email: 'k.boateng@amenmart.com',
    fullName: 'Kwesi Boateng',
    role: 'OWNER',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-accountant',
    tenantId: 'amen-mart-live',
    username: 'esi.mansa',
    email: 'e.mansa@amenmart.com',
    fullName: 'Esi Mansa',
    role: 'ACCOUNTANT',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-secretary',
    tenantId: 'amen-mart-live',
    username: 'kofi.asante',
    email: 'k.asante@amenmart.com',
    fullName: 'Kofi Asante',
    role: 'SECRETARY',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-staff',
    tenantId: 'amen-mart-live',
    username: 'mary.afriyie',
    email: 'm.afriyie@amenmart.com',
    fullName: 'Mary Afriyie',
    role: 'STAFF',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-am-google-admin',
    tenantId: 'amen-mart-live',
    username: 'amenmart.admin',
    email: 'amenmart2291@gmail.com',
    fullName: 'Amen Mart Executive Administrator',
    role: 'OWNER',
    password: 'amen@2026',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },

  // Demo Yard Provisioned Accounts (Dev Surge client showcase & feature previewing)
  {
    id: 'usr-am-demo-account',
    tenantId: 'amen-mart-sandbox',
    username: 'amenmart.demo',
    email: 'demo@amenmart.com',
    fullName: 'Amen Mart Demo Account',
    role: 'OWNER',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-generic',
    tenantId: 'amen-mart-sandbox',
    username: 'demo',
    email: 'demo@devsurge.io',
    fullName: 'Amen Mart Demo Director',
    role: 'OWNER',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-owner',
    tenantId: 'amen-mart-sandbox',
    username: 'demo.owner',
    email: 'demo.owner@devsurge.io',
    fullName: 'Dev Surge Demo Director',
    role: 'OWNER',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-accountant',
    tenantId: 'amen-mart-sandbox',
    username: 'demo.accountant',
    email: 'demo.accountant@devsurge.io',
    fullName: 'Demo Chief Accountant',
    role: 'ACCOUNTANT',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-secretary',
    tenantId: 'amen-mart-sandbox',
    username: 'demo.secretary',
    email: 'demo.secretary@devsurge.io',
    fullName: 'Demo Auction Secretary',
    role: 'SECRETARY',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-staff',
    tenantId: 'amen-mart-sandbox',
    username: 'demo.staff',
    email: 'demo.staff@devsurge.io',
    fullName: 'Demo Yard Supervisor',
    role: 'STAFF',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-demo-google-admin',
    tenantId: 'amen-mart-sandbox',
    username: 'devsurge.admin',
    email: 'devsurgeinfotech@gmail.com',
    fullName: 'Dev Surge Platform Director',
    role: 'OWNER',
    password: 'demo123',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

class AuthService {
  private static instance: AuthService;
  private cachedSessionRaw: string | null = null;
  private cachedSession: AuthSession | null = null;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private ensureInitialized(): void {
    if (typeof window === 'undefined') return;

    try {
      // 1. Ensure tenants are initialized and merge any missing default tenants (e.g. Demo Yard)
      const existingTenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (!existingTenantsJson) {
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(DEFAULT_TENANTS));
      } else {
        const currentTenants = JSON.parse(existingTenantsJson) as TenantRecord[];
        let tenantsUpdated = false;
        for (const defTenant of DEFAULT_TENANTS) {
          if (!currentTenants.some((t) => t.id === defTenant.id || t.code === defTenant.code)) {
            currentTenants.push(defTenant);
            tenantsUpdated = true;
          }
        }
        if (tenantsUpdated) {
          localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(currentTenants));
        }
      }

      // 2. Ensure users are initialized and merge any missing default users (e.g. demo users)
      const existingUsersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (!existingUsersJson) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      } else {
        const currentUsers = JSON.parse(existingUsersJson) as UserAccount[];
        let usersUpdated = false;
        for (const defUser of DEFAULT_USERS) {
          if (!currentUsers.some((u) => u.username.toLowerCase() === defUser.username.toLowerCase() || u.email.toLowerCase() === defUser.email.toLowerCase())) {
            currentUsers.push(defUser);
            usersUpdated = true;
          }
        }
        if (usersUpdated) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsers));
        }
      }
    } catch (err) {
      console.warn('Failed to initialize auth storage:', err);
    }
  }

  public getTenants(): TenantRecord[] {
    this.ensureInitialized();
    if (typeof window === 'undefined') return DEFAULT_TENANTS;

    try {
      const data = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (data) return JSON.parse(data) as TenantRecord[];
    } catch {
      // Fall back to defaults
    }
    return DEFAULT_TENANTS;
  }

  public getTenantByIdOrCode(idOrCode: string): TenantRecord | undefined {
    const list = this.getTenants();
    const query = idOrCode.trim().toLowerCase();
    return list.find(
      (t) => t.id.toLowerCase() === query || t.code.toLowerCase() === query
    );
  }

  public provisionTenant(data: Omit<TenantRecord, 'createdAt'>): TenantRecord {
    const tenants = this.getTenants();
    const existing = tenants.find(
      (t) => t.id.toLowerCase() === data.id.toLowerCase() || t.code.toLowerCase() === data.code.toLowerCase()
    );

    if (existing) {
      throw new Error(`Tenant with ID "${data.id}" or Code "${data.code}" already exists.`);
    }

    const newTenant: TenantRecord = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    tenants.push(newTenant);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return newTenant;
  }

  public updateTenant(id: string, updates: Partial<TenantRecord>): TenantRecord {
    const tenants = this.getTenants();
    const index = tenants.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Tenant not found: ${id}`);
    }

    tenants[index] = { ...tenants[index], ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return tenants[index];
  }

  public getUsers(tenantId?: string): UserAccount[] {
    this.ensureInitialized();
    if (typeof window === 'undefined') return DEFAULT_USERS;

    let users = DEFAULT_USERS;
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) users = JSON.parse(data) as UserAccount[];
    } catch {
      // Fall back
    }

    if (tenantId) {
      return users.filter((u) => u.tenantId === tenantId);
    }
    return users;
  }

  public provisionUser(data: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const users = this.getUsers();
    const normalizedUsername = data.username.trim().toLowerCase();
    const existing = users.find(
      (u) => u.tenantId === data.tenantId && u.username.toLowerCase() === normalizedUsername
    );

    if (existing) {
      throw new Error(`Username "${data.username}" already exists in this tenant.`);
    }

    const newUser: UserAccount = {
      ...data,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User not found: ${id}`);
    }

    users[index] = { ...users[index], ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return users[index];
  }

  public deleteUser(id: string): void {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
  }

  public login(usernameOrEmail: string, password: string, rememberMe?: boolean): AuthSession;
  public login(tenantCodeOrId: string, usernameOrEmail: string, password: string, rememberMe?: boolean): AuthSession;
  public login(
    arg1: string,
    arg2: string,
    arg3?: string | boolean,
    arg4?: boolean
  ): AuthSession {
    let tenantCodeOrId: string | undefined;
    let usernameOrEmail: string;
    let password: string;
    let rememberMe = false;

    if (typeof arg3 === 'string') {
      tenantCodeOrId = arg1;
      usernameOrEmail = arg2;
      password = arg3;
      rememberMe = Boolean(arg4);
    } else {
      usernameOrEmail = arg1;
      password = arg2;
      rememberMe = Boolean(arg3);
    }

    const normalizedIdentity = usernameOrEmail.trim().toLowerCase();
    const allUsers = this.getUsers();
    const allTenants = this.getTenants();

    let user: UserAccount | undefined;
    let tenant: TenantRecord | undefined;

    if (tenantCodeOrId) {
      tenant = this.getTenantByIdOrCode(tenantCodeOrId);
      if (!tenant) {
        throw new Error(`Invalid Workspace / Tenant code: "${tenantCodeOrId}".`);
      }
      user = allUsers.find(
        (u) =>
          u.tenantId === tenant!.id &&
          (u.username.toLowerCase() === normalizedIdentity || u.email.toLowerCase() === normalizedIdentity) &&
          u.isActive
      );
    } else {
      // Universal lookup across all active tenants
      const matchingUsers = allUsers.filter(
        (u) =>
          (u.username.toLowerCase() === normalizedIdentity || u.email.toLowerCase() === normalizedIdentity) &&
          u.isActive
      );

      if (matchingUsers.length === 0) {
        throw new Error('Invalid credentials: No active account matches this username or email.');
      }

      if (matchingUsers.length === 1) {
        user = matchingUsers[0];
        tenant = allTenants.find((t) => t.id === user!.tenantId);
      } else {
        // Multiple matches across tenants - check password match
        const passwordMatch = matchingUsers.find((u) => u.password === password);
        if (passwordMatch) {
          user = passwordMatch;
          tenant = allTenants.find((t) => t.id === user!.tenantId);
        } else {
          user = matchingUsers[0];
          tenant = allTenants.find((t) => t.id === user!.tenantId);
        }
      }
    }

    if (!user) {
      throw new Error('Invalid credentials: No account found matching this identity.');
    }

    if (!tenant) {
      throw new Error('Associated tenant workspace not found.');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new Error(`Workspace "${tenant.name}" is currently suspended. Please contact platform administrators.`);
    }

    const isDemoPassword =
      (tenant.environment === 'SANDBOX' || user.tenantId === 'amen-mart-sandbox') &&
      (password === 'demo123' || password === 'amen@2026');
    if (user.password !== password && !isDemoPassword) {
      throw new Error('Incorrect password or passcode. Please try again.');
    }

    // Update last login timestamp
    this.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const sessionDuration = rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7;

    const session: AuthSession = {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
      },
      tenant,
      token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + sessionDuration,
    };

    this.cachedSession = session;
    this.cachedSessionRaw = JSON.stringify(session);

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(TENANT_STORAGE_KEY, tenant.id);
      localStorage.setItem('amendesk_staff_role', user.role);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      window.dispatchEvent(new Event('amendesk-tenant-change'));
    }

    return session;
  }

  public loginAsDemoDirector(): AuthSession {
    return this.login('amen-mart-sandbox', 'amenmart.demo', 'demo123', true);
  }

  public loginAsLiveOwner(): AuthSession {
    return this.login('amen-mart-live', 'amenmart.live', 'amen@2026', true);
  }

  public verifyPassword(userIdOrUsername: string, password: string): boolean {
    this.ensureInitialized();
    const users = this.getUsers();
    const normalized = userIdOrUsername.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.id === userIdOrUsername ||
        u.username.toLowerCase() === normalized ||
        u.email.toLowerCase() === normalized
    );
    if (!user || !user.isActive) return false;

    const tenants = this.getTenants();
    const tenant = tenants.find((t) => t.id === user.tenantId);

    const isDemoPassword =
      (tenant?.environment === 'SANDBOX' || user.tenantId === 'amen-mart-sandbox') &&
      (password === 'demo123' || password === 'amen@2026');

    return user.password === password || Boolean(isDemoPassword);
  }

  public unlockWorkspace(password: string): boolean {
    const session = this.getSession();
    if (!session?.user?.id) return false;
    return this.verifyPassword(session.user.id, password);
  }

  public resetToDefaultAccounts(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(DEFAULT_TENANTS));
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  public loginWithGoogleEmail(googleEmail: string): AuthSession {
    this.ensureInitialized();
    const normalizedEmail = googleEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Please specify a valid Google account email.');
    }

    const allUsers = this.getUsers();
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.isActive
    );

    if (!user) {
      throw new Error(
        `Access Denied: The Google account "${googleEmail}" is not authorized on this AmenDesk terminal. Only pre-provisioned staff accounts are permitted.`
      );
    }

    const tenant = this.getTenants().find((t) => t.id === user.tenantId);
    if (!tenant) {
      throw new Error(`Associated organization workspace not found for ${user.fullName}.`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new Error(`Workspace "${tenant.name}" is currently suspended. Please contact platform administrators.`);
    }

    // Update last login timestamp
    this.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const session: AuthSession = {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
      },
      tenant,
      token: `tok-google-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30-day Google session
    };

    this.cachedSession = session;
    this.cachedSessionRaw = JSON.stringify(session);

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(TENANT_STORAGE_KEY, tenant.id);
      localStorage.setItem('amendesk_staff_role', user.role);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      window.dispatchEvent(new Event('amendesk-tenant-change'));
    }

    return session;
  }

  public logout(): void {
    this.cachedSession = null;
    this.cachedSessionRaw = null;
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) {
        this.cachedSession = null;
        this.cachedSessionRaw = null;
        return null;
      }
      if (data === this.cachedSessionRaw && this.cachedSession) {
        if (this.cachedSession.expiresAt > Date.now()) {
          return this.cachedSession;
        }
        this.logout();
        return null;
      }

      const session = JSON.parse(data) as AuthSession;
      if (session && session.expiresAt > Date.now()) {
        this.cachedSessionRaw = data;
        this.cachedSession = session;
        return session;
      }
      // Expired
      this.cachedSession = null;
      this.cachedSessionRaw = null;
      this.logout();
      return null;
    } catch {
      this.cachedSession = null;
      this.cachedSessionRaw = null;
      return null;
    }
  }

  public getWorkspaceSettings(tenantId: string): WorkspaceSettings {
    const fallback = DEFAULT_WORKSPACE_SETTINGS[tenantId] || DEFAULT_WORKSPACE_SETTINGS['amen-mart-live'];
    if (typeof window === 'undefined') return fallback;

    try {
      const data = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${tenantId}`);
      if (data) {
        return { ...fallback, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return fallback;
  }

  public updateWorkspaceSettings(tenantId: string, updates: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getWorkspaceSettings(tenantId);
    const updated: WorkspaceSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${tenantId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('amendesk-workspace-settings-change'));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return updated;
  }

  public getInvitations(tenantId?: string): StaffInvitation[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      if (data) {
        const list = JSON.parse(data) as StaffInvitation[];
        if (tenantId) {
          return list.filter((inv) => inv.tenantId === tenantId);
        }
        return list;
      }
    } catch {
      // Ignore
    }
    return [];
  }

  public inviteStaff(data: {
    tenantId: string;
    email: string;
    fullName: string;
    role: AppRole;
    phone: string;
    invitedBy: string;
    password?: string;
  }): { invitation: StaffInvitation; user: UserAccount } {
    const invitations = this.getInvitations();
    const cleanEmail = data.email.trim().toLowerCase();
    const generatedUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
    const inviteCode = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newInvitation: StaffInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: data.tenantId,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      role: data.role,
      phone: data.phone.trim(),
      invitedBy: data.invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'PENDING',
      inviteCode,
    };

    // Auto-provision user so staff can immediately log in
    const user = this.provisionUser({
      tenantId: data.tenantId,
      username: generatedUsername,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      role: data.role,
      password: data.password || 'amen@2026',
      isActive: true,
    });

    invitations.unshift(newInvitation);
    if (typeof window !== 'undefined') {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }

    return { invitation: newInvitation, user };
  }

  public revokeInvitation(invitationId: string): void {
    const invitations = this.getInvitations();
    const index = invitations.findIndex((i) => i.id === invitationId);
    if (index !== -1) {
      invitations[index] = { ...invitations[index], status: 'REVOKED' };
      if (typeof window !== 'undefined') {
        localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      }
    }
  }

  public resendInvitation(invitationId: string): StaffInvitation {
    const invitations = this.getInvitations();
    const index = invitations.findIndex((i) => i.id === invitationId);
    if (index === -1) {
      throw new Error('Invitation record not found.');
    }
    const updated: StaffInvitation = {
      ...invitations[index],
      status: 'PENDING',
      invitedAt: new Date().toISOString(),
      inviteCode: `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
    invitations[index] = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
    return updated;
  }

  public subscribeAuth(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('storage', callback);
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener('storage', callback);
      window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
  }
}

export const authService = AuthService.getInstance();

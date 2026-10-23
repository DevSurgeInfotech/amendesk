import type {
  AuthSession,
  TenantRecord,
  UserAccount,
} from '@/lib/types/auth';
import { TENANT_STORAGE_KEY } from '@/lib/types/tenant';

export const SESSION_STORAGE_KEY = 'amendesk_auth_session';
export const TENANTS_STORAGE_KEY = 'amendesk_platform_tenants';
export const USERS_STORAGE_KEY = 'amendesk_platform_users';
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
    name: 'AmenDesk Demo Yard',
    shortName: 'Demo Yard',
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

  // Demo Yard Provisioned Accounts (Dev Surge client showcase & feature previewing)
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
];

class AuthService {
  private static instance: AuthService;

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
      if (!localStorage.getItem(TENANTS_STORAGE_KEY)) {
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(DEFAULT_TENANTS));
      }
      if (!localStorage.getItem(USERS_STORAGE_KEY)) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
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

  public login(tenantCodeOrId: string, usernameOrEmail: string, password: string): AuthSession {
    const tenant = this.getTenantByIdOrCode(tenantCodeOrId);
    if (!tenant) {
      throw new Error(`Invalid Workspace / Tenant code: "${tenantCodeOrId}".`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new Error(`Workspace "${tenant.name}" is currently suspended. Please contact platform administrators.`);
    }

    const users = this.getUsers(tenant.id);
    const normalizedIdentity = usernameOrEmail.trim().toLowerCase();

    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === normalizedIdentity || u.email.toLowerCase() === normalizedIdentity) &&
        u.isActive
    );

    if (!user) {
      throw new Error('Invalid username or account not provisioned for this workspace.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password or PIN for this staff account.');
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
      token: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7-day session
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(TENANT_STORAGE_KEY, tenant.id);
      localStorage.setItem('amendesk_staff_role', user.role);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }

    return session;
  }

  public logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  public getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      const session = JSON.parse(data) as AuthSession;
      if (session && session.expiresAt > Date.now()) {
        return session;
      }
      // Expired
      this.logout();
      return null;
    } catch {
      return null;
    }
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

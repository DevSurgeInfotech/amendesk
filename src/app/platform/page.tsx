'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import type {
  AppRole,
  TenantEnvironment,
  TenantRecord,
  UserAccount,
} from '@/lib/types/auth';
import { ROLE_DESCRIPTIONS } from '@/lib/types/auth';
import { GhanaFlag } from '@/components/ui/GhanaFlag';
import {
  Server,
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Key,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Database,
  ArrowLeft,
  X,
  Search,
  FlaskConical,
  ExternalLink,
  RefreshCw,
  LogIn,
  Sparkles,
  Lock,
  Globe,
  Rocket,
  Sliders,
  Cpu,
  Radio,
} from 'lucide-react';

const MASTER_KEYS = ['devsurge2026', 'surge@amen2026', 'amen@master2026'];

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'BETA' | 'DISABLED';
  channel: 'PRODUCTION' | 'STAGING';
}

const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'ff-multi-tenant',
    name: 'Encore Physical Multi-Tenant DB Segregation',
    description: 'Enforces complete zero-bleed isolation between AmenDeskDB_live and AmenDeskDB_sandbox.',
    status: 'ACTIVE',
    channel: 'PRODUCTION',
  },
  {
    id: 'ff-cdn-sync',
    name: 'Cloudflare Edge CDN Showroom Sync',
    description: 'Automatically triggers instant cache purge on https://amenmartgh.com when inventory is marked sold.',
    status: 'ACTIVE',
    channel: 'PRODUCTION',
  },
  {
    id: 'ff-hubtel-momo',
    name: 'Hubtel Mobile Money Instant Webhooks',
    description: 'Listens for instant payment callbacks from MTN, Telecel, and AT Ghana MoMo wallets.',
    status: 'ACTIVE',
    channel: 'PRODUCTION',
  },
  {
    id: 'ff-paystack',
    name: 'Paystack Live Debit/Credit Checkout',
    description: 'Enables direct card receipting via Ghana 3D-Secure Visa & Mastercard authorization.',
    status: 'ACTIVE',
    channel: 'PRODUCTION',
  },
  {
    id: 'ff-deeds',
    name: 'Judicial Transfer Deed PDF Generator',
    description: 'Generates GAA-compliant court auction transfer deed certificates for auction lot buyers.',
    status: 'ACTIVE',
    channel: 'PRODUCTION',
  },
  {
    id: 'ff-ai-valuation',
    name: 'AI Vehicle Valuation & Intake Scanner',
    description: 'Computer vision assisted chassis inspection and reserve price recommendation.',
    status: 'BETA',
    channel: 'STAGING',
  },
];

interface ManagedWebsite {
  id: string;
  name: string;
  url: string;
  environment: 'PRODUCTION' | 'STAGING';
  status: 'ONLINE' | 'MAINTENANCE';
  connectedTenant: string;
  framework: string;
  lastDeployed: string;
  sslStatus: string;
}

const MANAGED_WEBSITES: ManagedWebsite[] = [
  {
    id: 'site-amenmart-live',
    name: 'Amen Mart Official Public Showroom',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://amenmartgh.com',
    environment: 'PRODUCTION',
    status: 'ONLINE',
    connectedTenant: 'amen-mart-live (Amen Mart Ghana)',
    framework: 'Next.js 16 App Router (Tailwind v4)',
    lastDeployed: '24 Oct 2026 • Production v1.2.4',
    sslStatus: 'Cloudflare Edge SSL (Active)',
  },
  {
    id: 'site-demo-yard',
    name: 'AmenDesk Client Demonstration Showroom',
    url: 'https://demo.amenmartgh.com',
    environment: 'STAGING',
    status: 'ONLINE',
    connectedTenant: 'amen-mart-sandbox (Demo Yard)',
    framework: 'Next.js 16 App Router (Staging)',
    lastDeployed: '24 Oct 2026 • Staging Build',
    sslStatus: 'Cloudflare Edge SSL (Active)',
  },
];

export default function PlatformPage() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const session = authService.getSession();
    return session?.user?.role === 'OWNER';
  });
  const [masterPasscode, setMasterPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'UPDATES' | 'WEBSITES' | 'TENANTS' | 'STORAGE'>('UPDATES');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(DEFAULT_FEATURE_FLAGS);
  const [websites, setWebsites] = useState<ManagedWebsite[]>(MANAGED_WEBSITES);

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTenantId, setNewTenantId] = useState('amen-mart-live');
  const [newRole, setNewRole] = useState<AppRole>('STAFF');
  const [newPassword, setNewPassword] = useState('amen@2026');

  // New Tenant Form State
  const [newTenId, setNewTenId] = useState('');
  const [newTenCode, setNewTenCode] = useState('');
  const [newTenName, setNewTenName] = useState('');
  const [newTenShortName, setNewTenShortName] = useState('');
  const [newTenEnv, setNewTenEnv] = useState<TenantEnvironment>('LIVE');
  const [newTenEmail, setNewTenEmail] = useState('');
  const [newTenPhone, setNewTenPhone] = useState('');
  const [newTenAddress, setNewTenAddress] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Reactive state for users & tenants
  const [tenants, setTenants] = useState<TenantRecord[]>(() => authService.getTenants());
  const [users, setUsers] = useState<UserAccount[]>(() => authService.getUsers());

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribeAuth(() => {
      setTenants(authService.getTenants());
      setUsers(authService.getUsers());
      const session = authService.getSession();
      if (session?.user?.role === 'OWNER') {
        setIsUnlocked(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    if (MASTER_KEYS.includes(masterPasscode.trim().toLowerCase())) {
      setIsUnlocked(true);
      setFeedbackMsg({ type: 'SUCCESS', text: 'Dev Surge Platform engineering console unlocked successfully.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setPasscodeError('Invalid platform administrator passcode.');
    }
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (selectedTenantFilter !== 'ALL') {
      list = list.filter((u) => u.tenantId === selectedTenantFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, selectedTenantFilter, searchQuery]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      authService.provisionUser({
        tenantId: newTenantId,
        username: newUsername.trim(),
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        role: newRole,
        password: newPassword,
        isActive: true,
      });

      setFeedbackMsg({
        type: 'SUCCESS',
        text: `User account "${newUsername}" provisioned successfully for ${newTenantId}.`,
      });
      setIsNewUserModalOpen(false);
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('amen@2026');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to provision user.',
      });
    }
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      authService.provisionTenant({
        id: newTenId.trim().toLowerCase(),
        code: newTenCode.trim().toUpperCase(),
        name: newTenName.trim(),
        shortName: newTenShortName.trim() || newTenName.trim(),
        environment: newTenEnv,
        status: 'ACTIVE',
        contactEmail: newTenEmail.trim(),
        phone: newTenPhone.trim(),
        address: newTenAddress.trim(),
        description: `${newTenName} operational workspace provisioned on AmenDesk platform.`,
      });

      setFeedbackMsg({
        type: 'SUCCESS',
        text: `Tenant organization "${newTenName}" (${newTenCode}) provisioned successfully.`,
      });
      setIsNewTenantModalOpen(false);
      setNewTenId('');
      setNewTenCode('');
      setNewTenName('');
      setNewTenShortName('');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to provision tenant.',
      });
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    try {
      authService.updateUser(userId, { isActive: !currentStatus });
      setFeedbackMsg({
        type: 'SUCCESS',
        text: `User account status updated to ${!currentStatus ? 'ACTIVE' : 'SUSPENDED'}.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Action failed.',
      });
    }
  };

  const handleOpenResetPassword = (user: UserAccount) => {
    setSelectedUserForReset(user);
    setNewPasswordValue('');
    setIsResetPasswordModalOpen(true);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordValue.trim()) return;

    try {
      authService.updateUser(selectedUserForReset.id, { password: newPasswordValue.trim() });
      setFeedbackMsg({
        type: 'SUCCESS',
        text: `Password for "${selectedUserForReset.username}" reset successfully.`,
      });
      setIsResetPasswordModalOpen(false);
      setSelectedUserForReset(null);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to reset password.',
      });
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (!confirm(`Are you sure you want to permanently delete account "${user.fullName}" (${user.username})?`)) {
      return;
    }
    try {
      authService.deleteUser(user.id);
      setFeedbackMsg({
        type: 'SUCCESS',
        text: `User account "${user.username}" deleted successfully.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to delete user.',
      });
    }
  };

  const handleLaunchDemoYard = () => {
    try {
      authService.loginAsDemoDirector();
      router.push('/desk');
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to launch Demo Yard testing environment.',
      });
    }
  };

  const handleLaunchLive = () => {
    try {
      authService.loginAsLiveOwner();
      router.push('/desk');
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to launch Amen Mart Live.',
      });
    }
  };

  const handleLoginAsUser = (user: UserAccount) => {
    try {
      authService.login(user.tenantId, user.username, user.password, true);
      router.push('/desk');
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to sign in as user.',
      });
    }
  };

  const handleResetDefaultAccounts = () => {
    try {
      authService.resetToDefaultAccounts();
      setFeedbackMsg({
        type: 'SUCCESS',
        text: 'Amen Mart Live and Demo accounts synchronized and refreshed successfully.',
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to restore default accounts.',
      });
    }
  };

  const handleLaunchTenant = (tenant: TenantRecord) => {
    try {
      const tenantUsers = authService.getUsers(tenant.id);
      const ownerOrFirstUser = tenantUsers.find((u) => u.role === 'OWNER') || tenantUsers[0];
      if (!ownerOrFirstUser) {
        throw new Error(`No staff users provisioned for ${tenant.name}. Please provision a user first.`);
      }
      authService.login(tenant.id, ownerOrFirstUser.username, ownerOrFirstUser.password);
      router.push('/desk');
    } catch (err) {
      setFeedbackMsg({
        type: 'ERROR',
        text: err instanceof Error ? err.message : 'Failed to launch workspace.',
      });
    }
  };

  const handleToggleFeatureFlag = (flagId: string) => {
    setFeatureFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          const nextStatus = f.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
    setFeedbackMsg({
      type: 'SUCCESS',
      text: 'Feature flag status updated successfully across client environments.',
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handlePurgeWebsiteCache = (siteName: string) => {
    setFeedbackMsg({
      type: 'SUCCESS',
      text: `Cloudflare Edge cache purged for ${siteName}. Fresh build propagated globally.`,
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleToggleMaintenance = (siteId: string) => {
    setWebsites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const nextStatus = s.status === 'ONLINE' ? 'MAINTENANCE' : 'ONLINE';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    setFeedbackMsg({
      type: 'SUCCESS',
      text: 'Website availability mode updated.',
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/desk"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to AmenDesk ERP"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Dev Surge Platform Console
                </h1>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Fleet &amp; Updates Management
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage AmenDesk software releases, public showrooms &amp; client websites, and multi-tenant deployments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isUnlocked && (
              <>
                <button
                  type="button"
                  onClick={handleLaunchLive}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Launch live production environment for Amen Mart Ghana"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Launch Live</span>
                </button>
                <button
                  type="button"
                  onClick={handleLaunchDemoYard}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Switch immediately into the Demo Yard tenant to test features before deploying to production"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  <span>Test in Demo Yard</span>
                </button>
              </>
            )}
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Login Portal
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <GhanaFlag className="h-3 w-4.5" />
              <span>Dev Surge Infotech</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Passcode Unlock Barrier (if not already unlocked) */}
        {!isUnlocked ? (
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 text-center">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Key className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">
              Dev Surge Platform Authorization
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              This console is dedicated to Dev Surge engineering to roll out AmenDesk software updates, manage client websites, and supervise tenant deployments.
            </p>

            {passcodeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  required
                  value={masterPasscode}
                  onChange={(e) => setMasterPasscode(e.target.value)}
                  placeholder="Master passcode (e.g. devsurge2026)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Unlock Platform Console
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] text-left">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-0.5">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Dev Surge Master Keys:</span>
              </div>
              <p className="font-mono text-[10px] text-slate-500">
                <code className="text-indigo-600 font-bold">devsurge2026</code> &bull;{' '}
                <code className="text-indigo-600 font-bold">amen@master2026</code>
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Feedback Message */}
            {feedbackMsg && (
              <div
                className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-xs ${
                  feedbackMsg.type === 'SUCCESS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feedbackMsg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackMsg(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200/90 pb-4 mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('UPDATES')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'UPDATES'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Rocket className="h-4 w-4" />
                  <span>Software Releases &amp; Features</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('WEBSITES')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'WEBSITES'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span>Showrooms &amp; Websites ({websites.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('TENANTS')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'TENANTS'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Client Tenancies ({tenants.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('STORAGE')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'STORAGE'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>Storage &amp; Physical Isolation</span>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetDefaultAccounts}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Synchronize and ensure Amen Mart Demo and Live accounts are fully restored"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Re-sync Defaults</span>
                </button>

                {activeTab === 'TENANTS' && (
                  <button
                    type="button"
                    onClick={() => setIsNewTenantModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Provision New Tenant</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: SOFTWARE RELEASES & FEATURE ENGINE */}
            {activeTab === 'UPDATES' && (
              <div className="space-y-6">
                {/* Release Status Banner */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900">AmenDesk ERP Production Build</h2>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          v1.2.4 Live
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Current core release powered by Next.js 16 App Router, Tailwind v4, and Dexie offline IndexedDB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackMsg({
                          type: 'SUCCESS',
                          text: 'AmenDesk v1.2.4 integrity check passed: All client nodes synchronized.',
                        });
                        setTimeout(() => setFeedbackMsg(null), 3000);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 cursor-pointer"
                    >
                      Verify Release Nodes
                    </button>
                  </div>
                </div>

                {/* Feature Flags Engine */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-indigo-600" />
                        <span>Platform Feature Flags &amp; Staged Rollouts</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Remotely toggle system capabilities and preview features across client workspaces
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {featureFlags.filter((f) => f.status === 'ACTIVE').length} / {featureFlags.length} Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featureFlags.map((flag) => (
                      <div
                        key={flag.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-slate-900 font-bold">{flag.name}</strong>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                                flag.channel === 'PRODUCTION'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {flag.channel}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed mb-2">
                            {flag.description}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold ${
                              flag.status === 'ACTIVE'
                                ? 'text-emerald-700'
                                : flag.status === 'BETA'
                                ? 'text-amber-700'
                                : 'text-slate-400'
                            }`}
                          >
                            State: <strong>{flag.status}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatureFlag(flag.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] shrink-0 cursor-pointer transition-all shadow-xs ${
                            flag.status === 'ACTIVE'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {flag.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Release Changelog */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-600" />
                    <span>Recent Platform Updates &amp; Changelog</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">Release v1.2.4 &bull; Dev Surge Platform &amp; Workspace Settings</strong>
                        <span className="text-[10px] text-slate-400 font-mono">24 Oct 2026</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Introduced dedicated Workspace Settings in AmenDesk for owners to manage staff and invitations. Transformed Platform Console into Dev Surge&apos;s master fleet and website management portal. Memoized session snapshots to prevent re-render loops.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">Release v1.2.3 &bull; Physical Zero-Bleed Multi-Tenant DB</strong>
                        <span className="text-[10px] text-slate-400 font-mono">23 Oct 2026</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Enforced complete physical isolation between commercial live operations and testing sandboxes with Encore SMS architecture. Added universal multi-tenant authentication.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGED SHOWROOMS & CLIENT WEBSITES */}
            {activeTab === 'WEBSITES' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {websites.map((site) => (
                    <div
                      key={site.id}
                      className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                              <Globe className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900">{site.name}</h3>
                              <a
                                href={site.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-600 hover:underline font-mono flex items-center gap-1"
                              >
                                <span>{site.url}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              site.status === 'ONLINE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {site.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-mono bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <div>Target Workspace: <span className="text-slate-900 font-bold">{site.connectedTenant}</span></div>
                          <div>Architecture: <span className="text-slate-700">{site.framework}</span></div>
                          <div>SSL Security: <span className="text-emerald-700 font-bold">{site.sslStatus}</span></div>
                          <div>Rollout Status: <span className="text-slate-500">{site.lastDeployed}</span></div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePurgeWebsiteCache(site.name)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Purge CDN Cache
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleMaintenance(site.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            {site.status === 'ONLINE' ? 'Set Maintenance' : 'Set Live'}
                          </button>
                        </div>

                        <a
                          href={site.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <span>Visit Public Site</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CLIENT TENANCIES & WORKSPACES */}
            {activeTab === 'TENANTS' && (
              <div className="space-y-6">
                {/* PROVISIONED AMEN MART DEMO & LIVE ACCOUNTS HIGHLIGHT BANNER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amen Mart Live Account Card */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          <span>Amen Mart Live Production</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          Tenant: AMEN-MART
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mb-1">
                        Amen Mart Live Account
                      </h3>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        Dedicated live commercial production access. Real statutory ledgers, real clients, and audited Ghanaian auction bids.
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono text-slate-700">
                        <div>Username: <strong className="text-emerald-700">amenmart.live</strong> <span className="text-slate-400">or</span> <strong className="text-emerald-700">amenmart</strong></div>
                        <div>Password: <strong className="text-slate-900">amen@2026</strong></div>
                        <div>Role: <span className="text-purple-700 font-bold">OWNER (Managing Director)</span></div>
                        <div>Store: <span className="text-slate-500">AmenDeskDB_live</span></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Provisioned &amp; Ready</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleLaunchLive}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Sign in to Live →</span>
                      </button>
                    </div>
                  </div>

                  {/* Amen Mart Demo Account Card */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <FlaskConical className="h-3 w-3 text-amber-600" />
                          <span>Amen Mart Demo Sandbox</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          Tenant: DEMO
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mb-1">
                        Amen Mart Demo Account
                      </h3>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        Pre-seeded demonstration yard with test vehicles, land plots, mock clients, and safe simulated transactions.
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono text-slate-700">
                        <div>Username: <strong className="text-amber-800">amenmart.demo</strong> <span className="text-slate-400">or</span> <strong className="text-amber-800">demo</strong></div>
                        <div>Password: <strong className="text-slate-900">demo123</strong> <span className="text-slate-400">or</span> <strong className="text-slate-900">amen@2026</strong></div>
                        <div>Role: <span className="text-purple-700 font-bold">OWNER (Demo Director)</span></div>
                        <div>Store: <span className="text-slate-500">AmenDeskDB_sandbox</span></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Provisioned &amp; Ready</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleLaunchDemoYard}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                        <span>Sign in to Demo →</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tenant Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {tenants.map((t) => {
                    const tenantUserCount = users.filter((u) => u.tenantId === t.id).length;
                    const isLive = t.environment === 'LIVE';

                    return (
                      <div
                        key={t.id}
                        className={`p-6 rounded-3xl border-2 bg-white flex flex-col justify-between shadow-xs transition-all ${
                          isLive
                            ? 'border-emerald-300 hover:border-emerald-400'
                            : 'border-amber-300 hover:border-amber-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                                  isLive ? 'bg-emerald-600' : 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-black text-slate-900">{t.name}</h3>
                                <p className="text-xs text-slate-500 font-mono">Code: {t.code} &bull; ID: {t.id}</p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isLive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {t.environment}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed mb-4">
                            {t.description}
                          </p>

                          <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-mono bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div>Contact: <span className="text-slate-800 font-semibold">{t.contactEmail}</span></div>
                            <div>Phone: <span className="text-slate-800 font-semibold">{t.phone}</span></div>
                            <div>Physical DB: <span className="text-indigo-700 font-bold">{isLive ? 'AmenDeskDB_live' : 'AmenDeskDB_sandbox'}</span></div>
                            <div>Provisioned Staff: <span className="text-slate-900 font-bold">{tenantUserCount} Users</span></div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            <span>Status: <strong className="text-emerald-700">{t.status}</strong></span>
                            <span className="font-mono text-[11px] hidden sm:inline">Since {new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLaunchTenant(t)}
                            className={`px-3.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                              !isLive
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title={isLive ? 'Launch Live Production Workspace' : 'Launch Demo Yard to test all features before production'}
                          >
                            {!isLive ? <FlaskConical className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                            <span>{!isLive ? 'Test Features in Demo Yard →' : 'Launch Amen Mart Live →'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Master Staff Accounts Supervision Table */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span>Master Tenant Staff &amp; RBAC Directory</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Dev Surge platform oversight of provisioned accounts across all client workspaces
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewUserModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Provision Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and filter */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="relative w-full sm:w-72">
                      <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, role..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs font-bold text-slate-500">Filter Workspace:</span>
                      <select
                        value={selectedTenantFilter}
                        onChange={(e) => setSelectedTenantFilter(e.target.value)}
                        className="w-full sm:w-auto text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="ALL">All Workspaces ({users.length})</option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Staff Member</th>
                          <th className="py-2.5 px-3">Workspace</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => {
                          const userTenant = tenants.find((t) => t.id === u.tenantId);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{u.fullName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">@{u.username} &bull; {u.email}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800 block">{userTenant?.shortName || u.tenantId}</span>
                                <span className="text-[10px] text-slate-500 font-mono uppercase">{userTenant?.code}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                                    u.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {u.isActive ? 'Active' : 'Suspended'}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleLoginAsUser(u)}
                                    className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                                    title="Sign in directly as this staff user"
                                  >
                                    <LogIn className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResetPassword(u)}
                                    className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                    title="Reset Password"
                                  >
                                    <Key className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PHYSICAL MULTI-TENANT ISOLATION TELEMETRY */}
            {activeTab === 'STORAGE' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Physical Multi-Tenant Database Architecture</h3>
                      <p className="text-xs text-slate-500">Strict zero-bleed isolation between Amen Mart Live and Dev Surge Demo</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    AmenDesk utilizes isolated physical IndexedDB stores. Transactions executed in the Sandbox Demo never contaminate Amen Mart&apos;s live commercial general ledger.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-800 text-sm">Amen Mart Ghana (Live)</span>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">AMEN-MART</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Physical database name: <code className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">AmenDeskDB_live</code>
                      </p>
                      <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px] pt-1">
                        <li>Only statutory Chart of Accounts and categories seeded</li>
                        <li>Zero dummy lots, mock vehicles, or fake customers</li>
                        <li>Database reset command is strictly prohibited and blocked</li>
                        <li>Strict fiscal auditing and legal compliance under GAA rules</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-900 text-sm">Amen Mart Demo Yard (Sandbox)</span>
                        <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 font-bold">DEMO</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Physical database name: <code className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">AmenDeskDB_sandbox</code>
                      </p>
                      <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px] pt-1">
                        <li>Fully pre-seeded Ghanaian lots, vehicles, land plots, and test CRM</li>
                        <li>Isolated cloud sync simulation (never touches Amen Mart cloud)</li>
                        <li>Can be safely restored back to fresh seed values anytime</li>
                        <li>Safe training sandpit for newly onboarded yard cashiers and clerks</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: PROVISION NEW USER */}
      {isNewUserModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Provision New Staff Account</h3>
                  <p className="text-xs text-slate-500">Enforce RBAC role assignments per workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Workspace / Tenant</label>
                <select
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} — {t.environment})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Dr. Francis Kwaku Yeboah"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. francis.yeboah"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. dr.yeboah@amenmart.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">RBAC Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AppRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="OWNER">OWNER — Managing Director &amp; Full Approval Authority</option>
                  <option value="ACCOUNTANT">ACCOUNTANT — Chief Accountant &amp; General Ledger</option>
                  <option value="SECRETARY">SECRETARY — Auction Intake, CRM &amp; Waybills</option>
                  <option value="STAFF">STAFF — Yard Cashier &amp; Operations Officer</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{ROLE_DESCRIPTIONS[newRole]}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password / Passcode</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. amen@2026"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-white transition-colors shadow-xs cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROVISION NEW TENANT */}
      {isNewTenantModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Provision New Tenant Organization</h3>
                  <p className="text-xs text-slate-500">Create segregated commercial workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenant ID (Slug)</label>
                  <input
                    type="text"
                    required
                    value={newTenId}
                    onChange={(e) => setNewTenId(e.target.value.toLowerCase())}
                    placeholder="e.g. ghana-customs"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenant Code</label>
                  <input
                    type="text"
                    required
                    value={newTenCode}
                    onChange={(e) => setNewTenCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GRA-AUCTION"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization Full Name</label>
                <input
                  type="text"
                  required
                  value={newTenName}
                  onChange={(e) => setNewTenName(e.target.value)}
                  placeholder="e.g. Ghana Revenue Authority Disposals"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Short Display Name</label>
                  <input
                    type="text"
                    value={newTenShortName}
                    onChange={(e) => setNewTenShortName(e.target.value)}
                    placeholder="e.g. GRA Disposals"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Environment Type</label>
                  <select
                    value={newTenEnv}
                    onChange={(e) => setNewTenEnv(e.target.value as TenantEnvironment)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="LIVE">LIVE — Commercial Operations</option>
                    <option value="SANDBOX">SANDBOX — Staging &amp; Testing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={newTenEmail}
                    onChange={(e) => setNewTenEmail(e.target.value)}
                    placeholder="admin@gra.gov.gh"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newTenPhone}
                    onChange={(e) => setNewTenPhone(e.target.value)}
                    placeholder="0548517277"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Office / Yard Address</label>
                <input
                  type="text"
                  value={newTenAddress}
                  onChange={(e) => setNewTenAddress(e.target.value)}
                  placeholder="Accra, Ghana"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-white transition-colors shadow-xs cursor-pointer"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET USER PASSWORD */}
      {isResetPasswordModalOpen && selectedUserForReset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                <span>Reset Staff Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Set a new password for <strong className="text-slate-900">{selectedUserForReset.fullName}</strong> (@{selectedUserForReset.username}).
            </p>

            <form onSubmit={handleSaveResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password (e.g. amen@2026)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

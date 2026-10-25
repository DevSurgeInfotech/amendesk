'use client';

import {
  Suspense,
  useState,
  useMemo,
  useEffect,
  useTransition,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTerminal, ROLE_STAFF_NAMES } from '@/context/TerminalContext';
import { authService } from '@/lib/auth/authService';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { AppRole, UserAccount } from '@/lib/types/auth';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  RBAC_PERMISSIONS,
  normalizeAppRole,
} from '@/lib/types/auth';
import type {
  WorkspaceSettings,
  StaffInvitation,
} from '@/lib/types/workspaceSettings';
import {
  Users,
  Building2,
  Sliders,
  Shield,
  Plus,
  Mail,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Printer,
  Gavel,
  X,
  Search,
  UserCheck,
  Lock,
  Briefcase,
} from 'lucide-react';

function resolveSettingsTab(
  tabParam: string | null
): 'STAFF' | 'PROFILE' | 'RULES' | 'SECURITY' {
  const normalized = tabParam?.toLowerCase();
  if (normalized === 'profile') return 'PROFILE';
  if (normalized === 'rules') return 'RULES';
  if (normalized === 'security') return 'SECURITY';
  return 'STAFF';
}

function getRoleBadgeStyle(role: AppRole): string {
  switch (role) {
    case 'OWNER':
      return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    case 'ACCOUNTANT':
      return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    case 'HR_ADMIN':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
    case 'SECRETARY':
      return 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'AUCTION_MANAGER':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'CASHIER':
      return 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
    case 'SALES_OFFICER':
      return 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    case 'STAFF':
      return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
            <span className="h-5 w-36 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Terminal login access, RBAC role assignments, organization profile, and business rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/desk/hr"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Staff &amp; Payroll Directory</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <div className="h-9 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-9 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-9 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-9 w-40 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* Content Skeleton Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <div className="h-5 w-56 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-3.5 w-80 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-pulse" />
        </div>
        <div className="h-48 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse mt-4" />
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function WorkspaceSettingsContent() {
  const mounted = useIsMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeTenant, currentUser, role, setRole, cleanSlateDatabase } = useTerminal();
  const activeAppRole = normalizeAppRole(role);
  const [, startTransition] = useTransition();

  const tabParam = searchParams.get('tab');
  const targetTab = resolveSettingsTab(tabParam);
  const [activeTab, setActiveTab] = useState<
    'STAFF' | 'PROFILE' | 'RULES' | 'SECURITY'
  >(targetTab);
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    setActiveTab(targetTab);
  }

  const [feedback, setFeedback] = useState<{
    type: 'SUCCESS' | 'ERROR';
    message: string;
  } | null>(null);

  // Users & Invitations State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [selectedUserForReset, setSelectedUserForReset] =
    useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isCleanSlateConfirmOpen, setIsCleanSlateConfirmOpen] = useState(false);
  const [isCleanSlateLoading, setIsCleanSlateLoading] = useState(false);

  // New Invite Form State
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('STAFF');
  const [invitePassword, setInvitePassword] = useState('amen@2026');

  // Workspace Profile & Rules State
  const [settings, setSettings] = useState<WorkspaceSettings>(() =>
    authService.getWorkspaceSettings(activeTenant.id)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Sync data on load and on tenant change
  const refreshData = () => {
    setUsers(authService.getUsers(activeTenant.id));
    setInvitations(authService.getInvitations(activeTenant.id));
    setSettings(authService.getWorkspaceSettings(activeTenant.id));
  };

  useEffect(() => {
    startTransition(() => {
      refreshData();
    });
    const unsubscribe = authService.subscribeAuth(() => {
      refreshData();
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenant.id]);

  const showNotification = (type: 'SUCCESS' | 'ERROR', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!inviteFullName.trim() || !inviteEmail.trim()) {
        throw new Error(
          'Please provide the staff member&apos;s full name and email address.'
        );
      }

      const { invitation, user } = authService.inviteStaff({
        tenantId: activeTenant.id,
        fullName: inviteFullName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim(),
        role: inviteRole,
        invitedBy: currentUser?.fullName || 'Managing Director',
        password: invitePassword.trim() || 'amen@2026',
      });

      // Also sync basic staff record into Staff & Payroll directory (without salary)
      try {
        const existingEmps = await db.employees.toArray();
        const alreadyExists = existingEmps.some(
          (emp) =>
            emp.email?.toLowerCase() === inviteEmail.trim().toLowerCase() ||
            emp.fullName.toLowerCase() === inviteFullName.trim().toLowerCase()
        );
        if (!alreadyExists) {
          const nextCode = `AM-EMP-${String(existingEmps.length + 1).padStart(
            3,
            '0'
          )}`;
          const newEmp = {
            id: `emp-${Date.now()}`,
            employeeCode: nextCode,
            fullName: inviteFullName.trim(),
            phone: invitePhone.trim() || '0548517277',
            email: inviteEmail.trim().toLowerCase(),
            ghanaCardNumber: 'GHA-Pending',
            ssnitNumber: '',
            tinNumber: '',
            gender: 'MALE' as const,
            address: 'Accra',
            nextOfKinName: '',
            nextOfKinPhone: '',
            department:
              inviteRole === 'ACCOUNTANT'
                ? ('FINANCE_ACCOUNTS' as const)
                : inviteRole === 'SECRETARY' || inviteRole === 'HR_ADMIN'
                  ? ('LEGAL_ADMIN' as const)
                  : inviteRole === 'SALES_OFFICER'
                    ? ('DEALERSHIP_SHOWROOM' as const)
                    : ('AUCTION_OPERATIONS' as const),
            jobTitle: ROLE_LABELS[inviteRole],
            employmentType: 'FULL_TIME_SALARIED' as const,
            dateHired: new Date().toISOString().split('T')[0],
            locationId: 'loc-gbawe',
            status: 'ACTIVE' as const,
            isCashier: inviteRole === 'CASHIER',
            basicSalaryGhs: 0,
            transportAllowanceGhs: 0,
            housingAllowanceGhs: 0,
            lunchAllowanceGhs: 0,
            communicationAllowanceGhs: 0,
            personalTaxReliefGhs: 0,
            hasSsnitContribution: true,
            tier3VoluntaryPct: 0,
            paymentMethod: 'HUBTEL_MOMO_API' as const,
            momoNetwork: 'MTN' as const,
            momoPhoneNumber: invitePhone.trim(),
            momoAccountName: inviteFullName.trim(),
            createdAt: new Date().toISOString(),
          };
          await db.employees.put(newEmp);
          await syncEngine.queueMutation(
            'employees',
            newEmp.id,
            'CREATE',
            newEmp
          );
        }
      } catch {
        // Non-blocking sync to local employees store
      }

      showNotification(
        'SUCCESS',
        `Account @${user.username} provisioned for ${invitation.fullName} and synced to Staff & Payroll directory.`
      );

      setIsInviteModalOpen(false);
      setInviteFullName('');
      setInviteEmail('');
      setInvitePhone('');
      setInviteRole('STAFF');
      setInvitePassword('amen@2026');
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to send invitation.'
      );
    }
  };

  const handleChangeUserRole = (user: UserAccount, newRole: AppRole) => {
    try {
      authService.updateUser(user.id, { role: newRole });
      showNotification(
        'SUCCESS',
        `Updated RBAC role for ${user.fullName} to ${newRole} (${ROLE_LABELS[newRole]}).`
      );
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to update role.'
      );
    }
  };

  const handleToggleUserStatus = (user: UserAccount) => {
    try {
      authService.updateUser(user.id, { isActive: !user.isActive });
      showNotification(
        'SUCCESS',
        `Account for ${user.fullName} is now ${
          !user.isActive ? 'ACTIVE' : 'SUSPENDED'
        }.`
      );
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Action failed.'
      );
    }
  };

  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPasswordInput.trim()) return;
    try {
      authService.updateUser(selectedUserForReset.id, {
        password: newPasswordInput.trim(),
      });
      showNotification(
        'SUCCESS',
        `Password for @${selectedUserForReset.username} reset successfully.`
      );
      setIsResetPasswordModalOpen(false);
      setSelectedUserForReset(null);
      setNewPasswordInput('');
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to update password.'
      );
    }
  };

  const handleCleanSlateLive = async () => {
    setIsCleanSlateLoading(true);
    try {
      await cleanSlateDatabase();
      showNotification(
        'SUCCESS',
        'Live database successfully sanitized to clean slate. All seed/demo records purged, and Chart of Accounts set to GH₵ 0.00.'
      );
      setIsCleanSlateConfirmOpen(false);
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Clean slate operation failed.'
      );
    } finally {
      setIsCleanSlateLoading(false);
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own currently signed-in account.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to permanently remove staff account "${user.fullName}" (@${user.username})?`
      )
    ) {
      return;
    }
    try {
      authService.deleteUser(user.id);
      showNotification('SUCCESS', `Staff account @${user.username} deleted.`);
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to delete user.'
      );
    }
  };

  const handleRevokeInvitation = (invitationId: string) => {
    try {
      authService.revokeInvitation(invitationId);
      showNotification('SUCCESS', 'Invitation revoked successfully.');
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to revoke.'
      );
    }
  };

  const handleResendInvitation = (invitationId: string) => {
    try {
      authService.resendInvitation(invitationId);
      showNotification('SUCCESS', 'Fresh invitation code generated and resent.');
      refreshData();
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to resend.'
      );
    }
  };

  const handleCopyInviteLink = (invite: StaffInvitation) => {
    const inviteUrl = `${
      typeof window !== 'undefined' ? window.location.origin : ''
    }/login?invite=${invite.inviteCode}&email=${encodeURIComponent(
      invite.email
    )}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
    showNotification(
      'SUCCESS',
      'Invitation onboarding link copied to clipboard.'
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      authService.updateWorkspaceSettings(activeTenant.id, settings);
      showNotification(
        'SUCCESS',
        'Workspace settings and configuration saved successfully.'
      );
    } catch (err) {
      showNotification(
        'ERROR',
        err instanceof Error ? err.message : 'Failed to save settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabSelect = (tab: 'STAFF' | 'PROFILE' | 'RULES' | 'SECURITY') => {
    setActiveTab(tab);
    const tabMap: Record<'STAFF' | 'PROFILE' | 'RULES' | 'SECURITY', string> = {
      STAFF: 'users',
      PROFILE: 'profile',
      RULES: 'rules',
      SECURITY: 'security',
    };
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabMap[tab]);
    router.replace(`/desk/settings?${params.toString()}`, { scroll: false });
  };

  if (!mounted) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Top Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                activeTenant.isSandbox
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {activeTenant.name} ({activeTenant.code})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Terminal login access, RBAC role assignments, organization profile, and business rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/desk/hr"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Staff &amp; Payroll Directory</span>
          </Link>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-xs ${
            feedback.type === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'SUCCESS' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleTabSelect('STAFF')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'STAFF'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Terminal Accounts &amp; RBAC ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Workspace Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('RULES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'RULES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Auction &amp; POS Rules</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('SECURITY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>RBAC Matrix &amp; Security</span>
        </button>
      </div>

      {/* TAB 1: TERMINAL ACCOUNTS & RBAC */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          {/* Unified Staff Onboarding Guidance Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>
                  Unified Staff Onboarding &amp; Terminal Access
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Full staff onboarding (personal details, department, and Ghana Card / SSNIT / TIN) is done in{' '}
                <strong>Staff &amp; Payroll</strong> (accessible to Secretary &amp; HR without salary fields) and automatically provisions login access here. Use this tab to manage RBAC roles and passwords.
              </p>
            </div>
            <Link
              href="/desk/hr"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Add Staff in Staff &amp; Payroll</span>
            </Link>
          </div>

          {/* Action & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts by name, email, role..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Provision Login Account</span>
              </button>
            </div>
          </div>

          {/* Pending Invitations Tray (if any) */}
          {invitations.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    Provisioned Onboarding Invitations (
                    {invitations.filter((i) => i.status === 'PENDING').length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Staff can sign in using their invitation link or initial credentials
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {inv.fullName}
                        </strong>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            inv.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono">
                        {inv.email} &bull; {inv.phone || 'No phone'}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Role:{' '}
                        <strong className="text-indigo-700 dark:text-indigo-300">
                          {inv.role} ({ROLE_LABELS[inv.role]})
                        </strong>{' '}
                        &bull; Code:{' '}
                        <code className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {inv.inviteCode}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Copy Onboarding Invite Link"
                      >
                        {copiedInviteId === inv.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResendInvitation(inv.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Regenerate & Resend Code"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                      {inv.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                          title="Revoke Invitation"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Staff Directory Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Authorized Terminal Accounts ({filteredUsers.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Workspace: <strong>{activeTenant.name}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider text-[10px] whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Assigned RBAC Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-500"
                      >
                        No staff accounts found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {u.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            @{u.username} &bull; {u.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getRoleBadgeStyle(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleChangeUserRole(
                                  u,
                                  e.target.value as AppRole
                                )
                              }
                              aria-label={`Change role for ${u.fullName}`}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              {(Object.keys(ROLE_LABELS) as AppRole[]).map(
                                (r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer transition-colors ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString('en-GB')
                            : 'Never'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForReset(u);
                                setNewPasswordInput('');
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Remove Staff Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE PROFILE */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Auction House Legal &amp; Commercial Identity
                </h3>
                <p className="text-[11px] text-slate-500">
                  Appears on official GAA waybills, judicial auction deeds, invoices, and POS receipts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.organizationName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Trade Display Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.shortName}
                  onChange={(e) =>
                    setSettings({ ...settings, shortName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Commercial Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) =>
                  setSettings({ ...settings, tagline: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={settings.contactEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Phone Lines
                </label>
                <input
                  type="text"
                  required
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Physical Auction Yard &amp; Cash Office Address
              </label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghana Auctioneers Association (GAA) License #
                </label>
                <input
                  type="text"
                  value={settings.gaaLicenseNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gaaLicenseNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  GRA Taxpayer Identification Number (TIN)
                </label>
                <input
                  type="text"
                  value={settings.tinNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, tinNumber: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Workspace Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: AUCTION & POS RULES */}
      {activeTab === 'RULES' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Gavel className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Statutory Auction, Settlement &amp; POS Receipt Rules
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enforce legal settlement windows, buyer registration fees, and receipt printer hardware settings (Operating Hours: 8:00 AM – 5:00 PM)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={settings.settlementDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      settlementDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Default is 14 days per GAA statutory rules
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Buyer Registration Fee (GH₵)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={settings.buyerRegistrationFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      buyerRegistrationFee: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Bidders pay to obtain paddle before auction
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Buyer&apos;s Premium (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  required
                  value={settings.defaultBuyersPremium}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultBuyersPremium: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Auction house fee calculated atop hammer price
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-indigo-600" />
                <span>POS Receipt Slip Output Width</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: '80mm',
                    label: '80mm POS Thermal (Standard)',
                    desc: 'Standard desktop till thermal printer',
                  },
                  {
                    id: '58mm',
                    label: '58mm Mobile Thermal',
                    desc: 'Compact handheld mobile Bluetooth printer',
                  },
                  {
                    id: 'A4',
                    label: 'A4 Full Page Invoice',
                    desc: 'Standard office laser or inkjet sheet',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        receiptPrinterWidth: p.id as '80mm' | '58mm' | 'A4',
                      })
                    }
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      settings.receiptPrinterWidth === p.id
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPrintReceipt}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoPrintReceipt: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    Automatically trigger print receipt dialog on payment intake
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Immediately opens print preview when a cashier logs cash, MoMo, or bank transfer
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSmsReceiptAlerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableSmsReceiptAlerts: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    Dispatch instant SMS settlement receipt to buyer
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sends automated SMS receipt via Hubtel Gateway upon full or deposit payment
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving
                  ? 'Saving Changes...'
                  : 'Save Rules & Hardware Settings'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: RBAC MATRIX & SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Active Operator Session */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Active Operator Authentication &amp; Role Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Standard Operating Hours: 8:00 AM – 5:00 PM &bull; Switch active RBAC role below to test module and salary restrictions
                  </p>
                </div>
              </div>

              {activeTenant.isSandbox ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Role Simulator:
                  </span>
                  <select
                    value={activeAppRole}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    aria-label="Active RBAC Role Simulator"
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                  >
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                      <option key={r} value={r}>
                        {r} — {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Role:
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {activeAppRole} ({ROLE_LABELS[activeAppRole]})
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Authenticated Staff User
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {currentUser?.fullName || 'Kwesi Boateng'}
                </div>
                <div className="text-slate-500 font-mono text-xs">
                  @{currentUser?.username || 'kwesi.boateng'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Granted Role Assignment
                </span>
                <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                  {activeAppRole}
                </div>
                <div className="text-slate-500 text-xs">
                  {ROLE_STAFF_NAMES[activeAppRole] || ROLE_LABELS[activeAppRole]}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Assigned Workspace Tenant
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeTenant.name}
                </div>
                <div className="text-slate-500 font-mono text-xs">
                  ID: {activeTenant.id} ({activeTenant.code})
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Local Physical Store
                </span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  {activeTenant.isSandbox
                    ? 'AmenDeskDB_sandbox'
                    : 'AmenDeskDB_live'}
                </div>
                <div className="text-slate-500 text-xs">
                  Strict zero-bleed offline store
                </div>
              </div>
            </div>

            {!activeTenant.isSandbox && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Client Handover Clean Slate
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Zero Demo Bleed
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Live production database is configured with 0 opening balances and zero mock transactions for clean client handover.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCleanSlateConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Purge Seed &amp; Verify Clean Slate
                </button>
              </div>
            )}
          </div>

          {/* Comprehensive RBAC Permissions Matrix (Including Staff & Payroll Separation) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                AmenDesk Role-Based Access Control (RBAC) Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforces strict separation between Staff Onboarding (Secretary / HR) and Salary &amp; Payroll Administration (Owner / Accountant).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    <th className="py-3 px-4">RBAC Role</th>
                    <th className="py-3 px-3 text-center">
                      Add Staff (No Salary)
                    </th>
                    <th className="py-3 px-3 text-center">
                      Salaries &amp; Payroll
                    </th>
                    <th className="py-3 px-3 text-center">
                      GRA / SSNIT Filings
                    </th>
                    <th className="py-3 px-3 text-center">Approve Leave</th>
                    <th className="py-3 px-3 text-center">
                      Accounts &amp; Banking
                    </th>
                    <th className="py-3 px-3 text-center">
                      POS (8am – 5pm)
                    </th>
                    <th className="py-3 px-3 text-center">
                      Auctions &amp; Waybills
                    </th>
                    <th className="py-3 px-3 text-center">
                      Dealership / Land
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => {
                    const p = RBAC_PERMISSIONS[r];
                    const renderCheck = (allowed: boolean) =>
                      allowed ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600">
                          —
                        </span>
                      );
                    return (
                      <tr
                        key={r}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 whitespace-nowrap"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getRoleBadgeStyle(
                                r
                              )}`}
                            >
                              {r}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {ROLE_LABELS[r]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {ROLE_DESCRIPTIONS[r]}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canOnboardStaff)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canConfigureSalaryAndPayroll)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canConfigureSalaryAndPayroll)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canApproveLeaveAndStatus)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canManageAccountsAndDeposits)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canProcessPosPayments)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canManageAuctionsAndWaybills)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderCheck(p.canManageDirectSales)}
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

      {/* MODAL 1: PROVISION STAFF LOGIN ACCOUNT */}
      {isInviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Provision Staff Login Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Workspace: <strong>{activeTenant.name}</strong> (Synced with Staff &amp; Payroll)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Samuel K. Darko"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. s.darko@amenmart.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone (Ghana MoMo / Call)
                  </label>
                  <input
                    type="text"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="0548517277"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign RBAC Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AppRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                    <option key={r} value={r}>
                      {r} — {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password / Passcode
                </label>
                <input
                  type="text"
                  required
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="e.g. amen@2026"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The staff member can change their password anytime after signing in
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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

      {/* MODAL 2: RESET PASSWORD */}
      {isResetPasswordModalOpen && selectedUserForReset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>Reset Staff Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Set a new password for{' '}
              <strong className="text-slate-900 dark:text-white">
                {selectedUserForReset.fullName}
              </strong>{' '}
              (@{selectedUserForReset.username}).
            </p>

            <form
              onSubmit={handleSavePasswordReset}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (e.g. amen@2026)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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

      {/* MODAL 3: CONFIRM CLEAN SLATE HANDOVER RESET */}
      {isCleanSlateConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Apply Clean Slate Handover State
                  </h3>
                  <p className="text-xs text-slate-500">
                    Database: <strong className="font-mono">AmenDeskDB_live</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCleanSlateConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This operation will permanently purge all mock lots, test vehicles, demo land parcels, test clients, and simulated journal entries from the live database. All Chart of Accounts ledger balances will be reset to <strong className="text-slate-900 dark:text-white">GH₵ 0.00</strong> ready for client handover.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Real website inquiries submitted by prospective clients will be preserved.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCleanSlateConfirmOpen(false)}
                disabled={isCleanSlateLoading}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanSlateLive}
                disabled={isCleanSlateLoading}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isCleanSlateLoading ? 'Purging...' : 'Confirm Clean Slate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <WorkspaceSettingsContent />
    </Suspense>
  );
}

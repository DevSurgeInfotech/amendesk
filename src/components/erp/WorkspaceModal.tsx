'use client';

import { useState } from 'react';
import { useTerminal, type UserRole } from '@/context/TerminalContext';
import {
  Building2,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Users,
} from 'lucide-react';

interface StaffOption {
  role: UserRole;
  name: string;
  title: string;
}

const STAFF_MEMBERS: StaffOption[] = [
  { role: 'ADMIN', name: 'Kwesi Boateng', title: 'Managing Director' },
  { role: 'ACCOUNTANT', name: 'Esi Mansa', title: 'Chief Accountant' },
  { role: 'AUCTION_MANAGER', name: 'Kofi Asante', title: 'Chief Auctioneer' },
  { role: 'CASHIER', name: 'Mary Afriyie', title: 'Senior Cashier' },
  { role: 'DEALERSHIP_AGENT', name: 'Yaw Osei', title: 'Showroom Manager' },
  { role: 'INVENTORY_OFFICER', name: 'David Mensah', title: 'Yard Supervisor' },
];

export function WorkspaceModal() {
  const {
    tenantId,
    activeTenant,
    role,
    isWorkspaceModalOpen,
    closeWorkspaceModal,
    loginToTenant,
    resetDatabase,
  } = useTerminal();

  const [selectedLiveRole, setSelectedLiveRole] = useState<UserRole>(role);
  const [isResetting, setIsResetting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!isWorkspaceModalOpen) return null;

  const handleSelectLive = () => {
    setActionSuccessMsg('Activating Amen Mart Ghana live workspace...');
    setTimeout(() => {
      loginToTenant('amen-mart-live', selectedLiveRole);
    }, 150);
  };

  const handleSelectDemo = () => {
    setActionSuccessMsg('Activating AmenDesk Demo Yard sandbox...');
    setTimeout(() => {
      loginToTenant('amen-mart-sandbox');
    }, 150);
  };

  const handleResetDemoData = async () => {
    if (
      !confirm(
        'Are you sure you want to restore the Demo Yard back to fresh Ghanaian seed records? All sample test modifications will be reset.'
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      await resetDatabase();
      setActionSuccessMsg('Demo Yard successfully restored to fresh Ghanaian seed data.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Failed to reset: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWorkspaceModal();
      }}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="workspace-modal-title" className="text-base font-black tracking-tight text-white">
                  Multi-Tenant Workspace &amp; Staff Login
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Encore SMS Style
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Segregated operational environments: client demo presentations vs clean commercial ledger.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWorkspaceModal}
            className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {actionSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Current Active Workspace Indicator Strip */}
        <div className="px-6 pt-5 pb-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Active Workspace:</span>
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                {activeTenant.isSandbox ? (
                  <FlaskConical className="h-4 w-4 text-amber-500" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                )}
                {activeTenant.name}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  activeTenant.isSandbox
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {activeTenant.code}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              <span>Storage: {activeTenant.isSandbox ? 'AmenDeskDB_sandbox' : 'AmenDeskDB_live'}</span>
            </div>
          </div>
        </div>

        {/* Workspace Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Amen Mart Ghana (Live Production Workspace) */}
          <div
            className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
              tenantId === 'amen-mart-live'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400/60 dark:hover:border-emerald-600/50 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                      Amen Mart Ghana
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Live Commercial Production
                    </p>
                  </div>
                </div>
                {tenantId === 'amen-mart-live' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Official commercial ERP workspace for Amen Mart operations. Clean operational environment with zero mock
                records, real Ghana Card KYC verification, and statutory financial general ledger.
              </p>

              {/* Staff Member Sign-In Selector */}
              <div className="space-y-1.5 mb-4 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Select Staff Operator for Sign-In:</span>
                </label>
                <select
                  value={selectedLiveRole}
                  onChange={(e) => setSelectedLiveRole(e.target.value as UserRole)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {STAFF_MEMBERS.map((staff) => (
                    <option key={staff.role} value={staff.role}>
                      {staff.name} — {staff.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Database resets permanently blocked for safety</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Physical database: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">AmenDeskDB_live</code></span>
                </div>
              </div>
            </div>

            <div>
              {tenantId === 'amen-mart-live' ? (
                <button
                  type="button"
                  onClick={closeWorkspaceModal}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Currently Signed In to Live Workspace</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSelectLive}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Sign In to Amen Mart Live</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. AmenDesk Demo Yard (Sandbox & Testing Workspace) */}
          <div
            className={`rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
              tenantId === 'amen-mart-sandbox'
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-600/50 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                      AmenDesk (Demo Yard)
                    </h3>
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Sandbox &amp; Client Presentations
                    </p>
                  </div>
                </div>
                {tenantId === 'amen-mart-sandbox' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-2xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Pre-seeded testing sandbox for client demonstrations, training, and previewing future features without
                polluting real commercial records.
              </p>

              {/* Seed Dataset Highlights */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4 space-y-1.5 text-[11px]">
                <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pre-Seeded Ghanaian Dataset:</span>
                </p>
                <ul className="text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                  <li>Judicial &amp; government auction lots with 14-day balance tracking</li>
                  <li>Dealership inventory (Mercedes Benz, Toyota, Hyundai)</li>
                  <li>Titled land plots &amp; residential apartments in Accra</li>
                  <li>Verified KYC test buyers &amp; official sample receipts</li>
                </ul>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                  <span>Can be safely reset back to fresh seed data anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  <span>Physical database: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">AmenDeskDB_sandbox</code></span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {tenantId === 'amen-mart-sandbox' ? (
                <>
                  <button
                    type="button"
                    onClick={closeWorkspaceModal}
                    className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Currently Active in Demo Yard</span>
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleResetDemoData}
                    className="w-full py-2 px-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200/60 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>{isResetting ? 'Restoring Seed Data...' : 'Reset Demo Yard to Fresh Seed Records'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSelectDemo}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Launch Demo Yard Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Quick Tip */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Bleed Multi-Tenant Guarantee:</strong> Demo transactions will never contaminate Amen Mart live accounts.
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Direct link: <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">/desk?tenant=demo</code>
          </div>
        </div>
      </div>
    </div>
  );
}

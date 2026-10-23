'use client';

import { useState } from 'react';
import { useTerminal } from '@/context/TerminalContext';
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  Lock,
  Unlock,
  Key,
  RotateCcw,
  X,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DevSurgeGateModal() {
  const {
    isDevGateOpen,
    closeDevGate,
    isDevSurgeAuthorized,
    environmentMode,
    switchEnvironment,
    authorizePasscode,
    revokeDevSurge,
    resetDatabase,
  } = useTerminal();

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!isDevGateOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const ok = authorizePasscode(passcode);
    if (ok) {
      setSuccessMsg('Dev Surge engineer authorization verified successfully.');
      setPasscode('');
    } else {
      setErrorMsg('Invalid Dev Surge engineer passcode.');
    }
  };

  const handleResetSandbox = async () => {
    if (environmentMode !== 'SANDBOX') return;
    if (
      !confirm(
        'Reset the Sandbox database back to fresh Ghanaian seed records (lots, vehicles, customers, payment plans, ledgers)?'
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      await resetDatabase();
      setSuccessMsg('Sandbox database successfully reset to fresh seed dataset.');
    } catch (err) {
      setErrorMsg(`Failed to reset sandbox: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="devsurge-gate-title"
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDevGate();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 id="devsurge-gate-title" className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Dev Surge Engineering Gate
                {isDevSurgeAuthorized ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold">
                    UNLOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-bold">
                    LOCKED
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Internal staging, diagnostic &amp; sandbox environment controller
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDevGate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isDevSurgeAuthorized ? (
            /* Locked State: Prompt for Engineer Passcode */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-bold mb-0.5">Confidential Engineering Area</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                    This terminal is currently configured for pure Amen Mart operations. Enter your Dev Surge engineer passcode to access the isolated Sandbox and diagnostic tools.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dev Surge Engineer Passcode
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">Hint: surge@amen2026</span>
                <Button type="submit" variant="primary" icon={<Unlock className="h-4 w-4" />}>
                  Unlock Gate
                </Button>
              </div>
            </form>
          ) : (
            /* Unlocked State: Full Environment & Database Controller */
            <div className="space-y-5">
              {/* Environment Status Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Environment:</span>
                  {environmentMode === 'SANDBOX' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      🧪 SANDBOX (Dev Surge Dummy Yard)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      🟢 LIVE (Amen Mart Operations)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/50 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    IndexedDB Store:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {environmentMode === 'SANDBOX' ? 'AmenDesk_Sandbox' : 'AmenDesk_Live'}
                  </span>
                </div>
              </div>

              {/* Environment Switcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Switch Active Environment
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => switchEnvironment('LIVE')}
                    disabled={environmentMode === 'LIVE'}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      environmentMode === 'LIVE'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold">🟢 Live Operations</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Clean commercial database. Zero seed data. Real Amen Mart records only.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchEnvironment('SANDBOX')}
                    disabled={environmentMode === 'SANDBOX'}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      environmentMode === 'SANDBOX'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold">🧪 Sandbox Yard</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Pre-seeded test yard. Dummy lots, cars, land, mock bidders &amp; ledgers.
                    </p>
                  </button>
                </div>
              </div>

              {/* Sandbox Controls (Only active when in Sandbox) */}
              {environmentMode === 'SANDBOX' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-amber-900 dark:text-amber-200">Re-Seed Sandbox Yard</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300/80">
                      Reset only the Sandbox store to fresh Ghanaian test records.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />}
                    onClick={handleResetSandbox}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Resetting...' : 'Reset Seed'}
                  </Button>
                </div>
              )}

              {/* Handover & Revoke Security Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    Client Handover Lock
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Revokes engineer access and locks terminal permanently to Amen Mart Live.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={revokeDevSurge}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                >
                  Lock to Client
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Dev Surge Infotech Ltd • Internal Staging</span>
          <span>Press [Esc] to exit</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTerminal } from '@/context/TerminalContext';
import {
  ShieldCheck,
  Database,
  Unlock,
  Key,
  RotateCcw,
  X,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DevSurgeGateModal() {
  const {
    isDevGateAvailable,
    isDevGateOpen,
    closeDevGate,
    isDevSurgeAuthorized,
    environmentMode,
    authorizePasscode,
    revokeDevSurge,
    resetDatabase,
  } = useTerminal();

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // In production deployments, this modal is completely disabled and rendered inert
  if (!isDevGateAvailable || !isDevGateOpen) return null;

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
                Dev Surge Staging &amp; Sandbox Controller
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
                Internal staging environment (Amen Mart Dummy Yard sandbox)
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

          {/* Privacy & Segregation Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <p className="font-bold">Strict Client Data Segregation (Encore SMS Model)</p>
              <p className="text-indigo-700 dark:text-indigo-300">
                This staging workspace is isolated from Amen Mart&apos;s live production database. Live client records, personal Ghana Cards, and confidential cash ledgers are never loaded or accessible from this sandbox.
              </p>
            </div>
          </div>

          {!isDevSurgeAuthorized ? (
            /* Locked State: Prompt for Engineer Passcode */
            <form onSubmit={handleUnlock} className="space-y-4">
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
                <span className="text-[11px] text-slate-400 font-mono">Passcode: surge@amen2026</span>
                <Button type="submit" variant="primary" icon={<Unlock className="h-4 w-4" />}>
                  Unlock Staging Controls
                </Button>
              </div>
            </form>
          ) : (
            /* Unlocked State: Staging Environment Management */
            <div className="space-y-4">
              {/* Environment Status Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Environment:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <FlaskConical className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    🧪 Dummy Yard Sandbox ({environmentMode})
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/50 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    IndexedDB Store:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    AmenDesk_Sandbox
                  </span>
                </div>
              </div>

              {/* Re-seed Action */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-200">Re-Seed Ghanaian Dummy Yard</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                    Reset sample judicial lots, dealership cars, land parcels, and mock cashier shifts.
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

              {/* Lock Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Staging Lock
                </span>
                <button
                  type="button"
                  onClick={revokeDevSurge}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Lock Gate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Dev Surge Infotech Ltd • Staging Sandbox</span>
          <span>Press [Esc] to close</span>
        </div>
      </div>
    </div>
  );
}

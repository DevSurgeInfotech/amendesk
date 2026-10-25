'use client';

import { useState, useEffect, useRef, useTransition, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useIdleLock } from '@/context/IdleLockContext';
import { useTerminal } from '@/context/TerminalContext';
import { ROLE_LABELS } from '@/lib/types/auth';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Building2,
  FlaskConical,
  LogOut,
  ShieldCheck,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';

function IdleLockModalContent() {
  const router = useRouter();
  const { unlockTerminal, timeoutMinutes, lockReason } = useIdleLock();
  const {
    session,
    currentUser,
    activeTenant,
    currentStaffName,
    staffAvatarUrl,
    isOnline,
    logout,
  } = useTerminal();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [shake, setShake] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Live Accra Clock Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Autofocus password input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Identity Parsing
  const fullName = currentUser?.fullName || session?.user?.fullName || currentStaffName.replace(/\s*\(.*?\)/, '').trim() || 'Staff Operator';
  const roleCode = currentUser?.role || session?.user?.role || 'STAFF';
  const roleLabel = ROLE_LABELS[roleCode] || roleCode;
  const username = currentUser?.username || session?.user?.username || 'operator';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'AM';

  const formattedTime = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your staff password to resume your workspace.');
      passwordInputRef.current?.focus();
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      const result = unlockTerminal(password);
      if (result.success) {
        setPassword('');
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || 'Incorrect password. Please verify and try again.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      }
    });
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AmenDesk Enterprise Terminal Idle Lock Screen"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#e9eff5]/95 backdrop-blur-2xl text-slate-900 flex flex-col justify-between p-4 sm:p-8 select-none transition-all duration-300"
    >
      {/* Background Decorative Ambient Lighting (Light Theme) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-indigo-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-10 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-100/60 rounded-full blur-3xl" />
      </div>

      {/* Top Bar: AmenDesk Brand & Live Environment Pills (Light Theme) */}
      <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-xs">
            <Image
              src="/amenmart-icon-4k.png"
              alt="Amen Mart Logo"
              width={38}
              height={38}
              priority
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-black text-lg tracking-tight text-slate-950">
                AmenDesk
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Ministry of the Interior &bull; ARB Registered Auctioneer
            </p>
          </div>
        </div>

        {/* Ghana Flag Hairline Ribbon */}
        <div className="hidden md:flex flex-col items-center gap-1">
          <div className="flex items-center h-1.5 w-24 rounded-full overflow-hidden shadow-2xs">
            <span className="flex-1 h-full bg-[#CE1126]" />
            <span className="flex-1 h-full bg-[#FCD116]" />
            <span className="flex-1 h-full bg-[#006B3F]" />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
            Republic of Ghana
          </span>
        </div>

        {/* Status Indicators: Live/Sandbox & Local Sync */}
        <div className="flex items-center gap-2">
          {activeTenant.isSandbox ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
              <span>Sandbox Demo Yard</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Production Yard</span>
            </div>
          )}

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                <span>Online Terminal</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                <span>Offline Yard Mode</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Center Area: Clock + Staff Identification + Unlock Form (Light Theme) */}
      <main className="relative z-10 w-full max-w-lg mx-auto my-auto py-6">
        {/* Digital Time & Date */}
        <div className="text-center mb-6">
          {lockReason === 'MANUAL_VOLUNTARY' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 text-xs font-bold mb-3 shadow-xs">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Voluntary Terminal Lock &bull; Workspace Protected</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 text-xs font-bold mb-3 shadow-xs">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Terminal Idle Lock &bull; {timeoutMinutes}-Minute Protection</span>
            </div>
          )}

          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-950 tracking-tight drop-shadow-xs">
            {formattedTime}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
            {formattedDate} &bull; Accra, Ghana (GMT+0)
          </p>
        </div>

        {/* Staff Identity Card & Form (Light Theme) */}
        <div
          className={`relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl transition-transform ${
            shake ? 'translate-x-[-8px] duration-100 ease-in-out' : ''
          }`}
        >
          {/* Staff Avatar with Status Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="h-20 w-20 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 shadow-md">
                <div className="h-full w-full rounded-[14px] bg-slate-100 overflow-hidden flex items-center justify-center">
                  {staffAvatarUrl ? (
                    <Image
                      src={staffAvatarUrl}
                      alt={fullName}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white font-black text-2xl flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
                title="Workspace Session Suspended"
              >
                <Lock className="h-3 w-3" />
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
              {fullName}
            </h2>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {roleLabel}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                @{username}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1.5 font-medium">
              Enter your staff password to continue working in this AmenDesk session.
            </p>
          </div>

          {/* Error Feedback Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Password Unlock Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="idle-lock-password"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                Staff Account Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>

                <input
                  ref={passwordInputRef}
                  id="idle-lock-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  disabled={isPending}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 text-slate-950 placeholder-slate-400 text-sm font-semibold transition-all outline-none shadow-2xs"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-black tracking-wide shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Resume AmenDesk Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Sandbox Demo Quick Hint */}
          {activeTenant.isSandbox && (
            <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Demo Passcode: <strong className="font-mono text-amber-950">demo123</strong> or <strong className="font-mono text-amber-950">amen@2026</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setPassword('demo123')}
                className="px-2 py-0.5 rounded bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold text-[10px] uppercase transition-colors cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* Switch Account or Log Out */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Not <strong className="text-slate-800">{fullName}</strong>?
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Switch Account / Sign Out</span>
            </button>
          </div>
        </div>

        {/* Security & Offline Safety Affirmation */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Unsaved drafts, POS cash shifts &amp; offline Dexie records remain preserved.</span>
          </p>
        </div>
      </main>

      {/* Bottom Footer: Compliance & Statutory Details */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-200/80 pt-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Amen Mart &bull; Gbawe Head Office Yard &amp; Cash Office &bull; Accra, Ghana</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono font-bold text-slate-600">
            IDLE TIMEOUT: {timeoutMinutes}M
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>Dev Surge Infotech &bull; Terminal Security v2.6</span>
        </div>
      </footer>
    </div>
  );
}

export function IdleLockScreen() {
  const { isLocked } = useIdleLock();
  if (!isLocked) return null;
  return <IdleLockModalContent />;
}

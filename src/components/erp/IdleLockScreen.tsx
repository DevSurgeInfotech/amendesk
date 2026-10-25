'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useIdleLock } from '@/context/IdleLockContext';
import { useTerminal } from '@/context/TerminalContext';
import { ROLE_LABELS } from '@/lib/types/auth';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  FlaskConical,
  LogOut,
  ShieldCheck,
  Wifi,
  WifiOff,
  ArrowUp,
} from 'lucide-react';

function IdleLockModalContent() {
  const router = useRouter();
  const { unlockTerminal, timeoutMinutes, lockReason, lockedAt, clearLock } = useIdleLock();
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
  const [capsLockOn, setCapsLockOn] = useState(false);
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

  // Defensive display name parsing: NEVER show an email address on the lock screen
  const displayName = useMemo(() => {
    let name =
      currentUser?.fullName ||
      session?.user?.fullName ||
      currentStaffName.replace(/\s*\(.*?\)/, '').trim() ||
      'Staff Operator';

    // If name is or contains an email address, sanitize into human-readable name
    if (name.includes('@')) {
      const localPart = name.split('@')[0];
      name = localPart
        .split(/[._-]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return name;
  }, [currentUser?.fullName, session?.user?.fullName, currentStaffName]);

  const roleCode = currentUser?.role || session?.user?.role || 'STAFF';
  const roleLabel = ROLE_LABELS[roleCode] || roleCode;

  const initials = useMemo(() => {
    return (
      displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase() || 'AM'
    );
  }, [displayName]);

  // Clock Formatting
  const rawHours = currentTime.getHours();
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  const timeStr = `${String(hours12).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lockedTimeFormatted = useMemo(() => {
    if (!lockedAt) return null;
    const d = new Date(lockedAt);
    const hrs = d.getHours();
    const m = d.getMinutes();
    const p = hrs >= 12 ? 'PM' : 'AM';
    const h12 = hrs % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p} GMT`;
  }, [lockedAt]);

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

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
        setErrorMessage(result.error || 'Incorrect staff password. Please verify and try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      }
    });
  };

  const handleSignOut = () => {
    clearLock();
    logout();
    router.push('/login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AmenDesk Enterprise Terminal Idle Lock Screen"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#eef2f6]/95 backdrop-blur-2xl text-slate-900 flex flex-col justify-between p-4 sm:p-8 select-none transition-all duration-300"
    >
      {/* Architectural Mesh & Subtle Radial Grid Canvas */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.9) 0%, rgba(238,242,246,0.7) 55%, rgba(226,232,240,0.85) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Ambient Studio Lighting Highlights */}
      <div
        className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[840px] h-[400px] rounded-full bg-gradient-to-b from-[#D5AA40]/10 via-[#0B1F3A]/8 to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-[320px] rounded-full bg-slate-400/15 blur-3xl -z-10"
        aria-hidden="true"
      />

      {/* Top Bar: Amen Mart Executive Identity & Live Environment Badges */}
      <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-xs shrink-0">
            <Image
              src="/amenmart-icon-4k.png"
              alt="Amen Mart Logo"
              width={42}
              height={42}
              priority
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-black text-lg tracking-tight text-slate-950">
                AMEN MART
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                AmenDesk Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Ministry of the Interior &bull; ARB Registered Auctioneer (PNDCL 230)
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
              <span>Sandbox Demo Yard</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
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

      {/* Main Center Area: Chronometer + World-Standard Double-Bezel Pedestal Card */}
      <main className="relative z-10 w-full max-w-lg mx-auto my-auto py-4">
        {/* Digital Precision Chronometer */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/90 text-slate-700 text-xs font-bold mb-3 shadow-xs backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            {lockReason === 'MANUAL_VOLUNTARY' ? (
              <span>Voluntary Terminal Lock &bull; Workspace Protected</span>
            ) : (
              <span>Inactivity Terminal Lock &bull; {timeoutMinutes}-Minute Policy</span>
            )}
            {lockedTimeFormatted && (
              <span className="text-slate-400 font-mono font-normal">
                &bull; Locked {lockedTimeFormatted}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-center font-mono tracking-tight drop-shadow-xs">
            <span className="text-5xl sm:text-6xl font-black text-[#0B1F3A]">
              {timeStr}
            </span>
            <span className="text-sm font-black uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/80 ml-2">
              {ampm}
            </span>
            <span className="text-base font-bold font-mono text-slate-500 ml-1.5">
              :{secondsStr}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            {formattedDate} &bull; Accra, Ghana (GMT+0)
          </p>
        </div>

        {/* Outer Double-Bezel Pedestal Frame */}
        <div
          className={`w-full rounded-[28px] bg-white/75 p-2 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.14),0_10px_25px_-5px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.06)] transition-transform ${
            shake ? 'animate-lock-shake' : ''
          }`}
        >
          {/* Inner Pure White Surface Card */}
          <div className="w-full rounded-[22px] bg-white border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] p-7 sm:p-8 relative overflow-hidden">
            {/* Subtle Brand Top Hairline Accent (Amen Mart Gold & Navy) */}
            <div className="h-1 w-full bg-gradient-to-r from-[#D5AA40] via-[#0B1F3A] to-[#D5AA40] absolute top-0 left-0" />

            {/* Staff Identity Section (Strictly NO staff email and NO @username) */}
            <div className="flex flex-col items-center text-center mb-6 pt-1">
              <div className="relative mb-3.5">
                <div className="h-20 w-20 rounded-2xl p-0.5 bg-gradient-to-tr from-[#0B1F3A] via-[#1a3860] to-[#D5AA40] shadow-md">
                  <div className="h-full w-full rounded-[14px] bg-slate-100 overflow-hidden flex items-center justify-center">
                    {staffAvatarUrl ? (
                      <Image
                        src={staffAvatarUrl}
                        alt={displayName}
                        width={80}
                        height={80}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#0B1F3A] via-[#142e54] to-slate-900 text-amber-300 font-black text-2xl flex items-center justify-center">
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

              {/* Staff Full Name Only */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {displayName}
              </h2>

              {/* Role Badge and Station Description — Strictly NO email or @username */}
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#0B1F3A]/5 text-[#0B1F3A] border border-[#0B1F3A]/15 shadow-2xs">
                  {roleLabel}
                </span>
              </div>

              <p className="text-[11.5px] text-slate-500 mt-2 font-medium">
                Amen Mart Head Office Yard &bull; Gbawe Cash Office
              </p>
            </div>

            {/* Error Feedback Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 leading-relaxed"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Password Unlock Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="idle-lock-password"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Staff Account Password
                  </label>

                  {capsLockOn && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                      <ArrowUp className="h-2.5 w-2.5" />
                      Caps Lock ON
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>

                  <input
                    ref={passwordInputRef}
                    id="idle-lock-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder="Enter your account password..."
                    disabled={isPending}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-hidden focus:border-[#0B1F3A] focus:ring-4 focus:ring-[#0B1F3A]/10 transition-all shadow-2xs"
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

              {/* Unlock Primary CTA */}
              <button
                type="submit"
                disabled={isPending || !password}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132d52] active:scale-[0.99] text-white text-sm font-bold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-3px_rgba(11,31,58,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

            {/* Switch Account or Sign Out */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Not <strong className="text-slate-900 font-bold">{displayName}</strong>?
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

          {/* Pedestal Security Footnote */}
          <div className="px-4 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Active terminal state, draft receipts &amp; offline ledger records remain safely preserved.</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer: Compliance & Statutory Details */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-200/80 pt-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Amen Mart Auctioning Services &bull; Gbawe Head Office Yard &amp; Cash Office &bull; Accra, Ghana</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-slate-600">
            IDLE TIMEOUT: {timeoutMinutes}M
          </span>
          <span className="text-slate-300">&bull;</span>
          <span>Terminal Security v2.6</span>
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

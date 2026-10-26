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
  LogOut,
  Wifi,
  WifiOff,
  ArrowUp,
} from 'lucide-react';

function IdleLockModalContent() {
  const router = useRouter();
  const { unlockTerminal, timeoutMinutes, clearLock } = useIdleLock();
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

  // Clean clock formatting (e.g. 5:42 PM)
  const rawHours = currentTime.getHours();
  const ampm = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = rawHours % 12 || 12;
  const timeStr = `${hours12}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
    if (e.key === 'Escape') {
      setPassword('');
      setErrorMessage(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
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
        setErrorMessage(result.error || 'Incorrect password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 450);
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
      aria-label="Workspace Locked"
      className="fixed inset-0 z-[9999] h-screen h-[100dvh] max-h-screen overflow-hidden bg-[#eef2f6]/95 dark:bg-[#070e18]/95 backdrop-blur-2xl text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors duration-200"
    >
      {/* Architectural Ambient Canvas */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.92) 0%, rgba(238,242,246,0.8) 55%, rgba(226,232,240,0.9) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(15,23,42,0.85) 0%, rgba(7,14,24,0.92) 55%, rgba(4,8,15,0.98) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25] dark:opacity-[0.15] -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
        aria-hidden="true"
      />

      {/* Ambient Lighting Accents */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full bg-gradient-to-b from-[#D5AA40]/10 via-[#0B1F3A]/6 to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 flex items-center justify-center shadow-2xs shrink-0">
            <Image
              src="/amenmart-icon-4k.png"
              alt="Amen Mart"
              width={26}
              height={26}
              priority
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-sm tracking-tight text-slate-950 dark:text-white">
              AMEN MART
            </span>
            <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              AmenDesk
            </span>
          </div>
        </div>

        {/* Minimal Status Indicators */}
        <div className="flex items-center gap-2">
          {activeTenant.isSandbox ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Sandbox
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 text-xs font-medium backdrop-blur-xs">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </span>
        </div>
      </header>

      {/* Main Center Area: Clock + Unlock Card */}
      <main className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto my-auto flex-1 flex flex-col items-center justify-center py-2 min-h-0">
        {/* Crisp Modern Clock */}
        <div className="text-center mb-5 shrink-0">
          <div className="flex items-baseline justify-center font-sans tracking-tight">
            <span className="text-5xl sm:text-6xl font-light text-slate-900 dark:text-white tabular-nums">
              {timeStr}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1.5">
              {ampm}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1">
            {formattedDate}
          </p>
        </div>

        {/* Floating Unlock Card */}
        <div
          className={`w-full rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_50px_-12px_rgba(11,31,58,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-7 relative overflow-hidden transition-transform ${
            shake ? 'animate-lock-shake' : ''
          }`}
        >
          {/* Subtle Amen Mart Gold Hairline Accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#D5AA40] to-transparent absolute top-0 left-0" />

          {/* User Profile */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-3">
              <div className="h-16 w-16 rounded-full p-0.5 bg-gradient-to-tr from-[#0B1F3A] via-[#1a3860] to-[#D5AA40] shadow-sm">
                <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {staffAvatarUrl ? (
                    <Image
                      src={staffAvatarUrl}
                      alt={displayName}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#0B1F3A] text-amber-300 font-bold text-lg flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#D5AA40] border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-950 shadow-2xs"
                title="Locked"
              >
                <Lock className="h-2.5 w-2.5" />
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight">
              {displayName}
            </h2>

            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              {roleLabel}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Unlock Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="relative group">
                <input
                  ref={passwordInputRef}
                  id="idle-lock-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  placeholder="Enter password"
                  disabled={isPending}
                  autoComplete="current-password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-950 border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#0B1F3A] dark:focus:border-amber-400/80 focus:ring-2 focus:ring-[#0B1F3A]/10 dark:focus:ring-amber-400/10 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {capsLockOn && (
                <div className="mt-1.5 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                    <ArrowUp className="h-2.5 w-2.5" />
                    Caps Lock is on
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132d52] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Unlock</span>
                </>
              )}
            </button>
          </form>

          {/* Switch Account */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
        <span>Amen Mart Enterprise Terminal</span>
        <span>Timeout: {timeoutMinutes}m</span>
      </footer>
    </div>
  );
}

export function IdleLockScreen() {
  const { isLocked } = useIdleLock();
  if (!isLocked) return null;
  return <IdleLockModalContent />;
}

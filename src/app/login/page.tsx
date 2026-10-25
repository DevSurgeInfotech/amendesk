'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
} from 'lucide-react';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // If already logged in, redirect straight to /desk
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      router.push('/desk');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const cleanIdentity = identity.trim();
      if (!cleanIdentity) {
        throw new Error('Please enter your staff username or email address.');
      }
      if (!password) {
        throw new Error('Please enter your account password.');
      }

      authService.login(cleanIdentity, password, rememberMe);
      router.push('/desk');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleGoogleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const emailToVerify = googleEmailInput.trim();
      if (!emailToVerify) {
        throw new Error('Please enter your corporate Google account email address.');
      }

      authService.loginWithGoogleEmail(emailToVerify);
      setIsGoogleModalOpen(false);
      router.push('/desk');
    } catch (err) {
      setIsLoading(false);
      setIsGoogleModalOpen(false);
      setErrorMsg(err instanceof Error ? err.message : 'Google authentication rejected: Account not authorized.');
    }
  };

  return (
    <div className="light min-h-screen flex flex-col justify-between bg-[#eef2f6] text-slate-900 antialiased selection:bg-[#0B1F3A] selection:text-white relative overflow-hidden">
      {/* Architectural Mesh & Subtle Radial Grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #eef2f6 55%, #e2e8f0 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, #000 35%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Soft Ambient Studio Lighting */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full bg-gradient-to-b from-amber-400/12 via-sky-500/6 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[680px] h-[320px] rounded-full bg-slate-400/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Spacer */}
      <div className="w-full pt-6 z-10" />

      {/* Main Centered Login Pedestal */}
      <main className="flex items-center justify-center px-4 py-8 sm:px-6 z-10 my-auto w-full">
        {/* Outer Double-Bezel Pedestal Frame */}
        <div className="w-full max-w-[460px] rounded-[28px] bg-white/65 p-2 backdrop-blur-xl border border-white/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12),0_10px_25px_-5px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.06)]">
          {/* Inner Pure White Surface Card */}
          <div className="w-full rounded-[22px] bg-white border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.05)] p-7 sm:p-9 relative overflow-hidden">
            {/* Subtle Brand Top Hairline Accent */}
            <div className="h-1 w-full bg-gradient-to-r from-[#D5AA40] via-[#0B1F3A] to-[#D5AA40] absolute top-0 left-0" />

            {/* Brand Header Row */}
            <div className="flex items-center justify-between gap-4 mb-7 pt-1">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-2xl overflow-hidden shadow-xs border border-slate-200/90 bg-white shrink-0 p-1 flex items-center justify-center">
                  <Image
                    src="/amenmart-icon-4k.png"
                    alt="Amen Mart"
                    width={48}
                    height={48}
                    priority
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-sans font-black text-lg leading-tight tracking-tight text-slate-900">
                    AMEN MART
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    Auctioning Services
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AmenDesk
              </span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
                Welcome back
              </h1>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                Sign in with your credentials to access your workspace.
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs font-medium flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identity"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email or Username
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-identity"
                    type="text"
                    required
                    autoComplete="username"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="name@amenmart.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#0B1F3A] focus:ring-4 focus:ring-[#0B1F3A]/8 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#0B1F3A] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#0B1F3A] focus:ring-4 focus:ring-[#0B1F3A]/8 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label
                  htmlFor="remember-me"
                  className="inline-flex items-center gap-2.5 text-xs text-slate-600 font-medium select-none cursor-pointer"
                >
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]/20 cursor-pointer accent-[#0B1F3A]"
                  />
                  <span>Keep me signed in for 30 days</span>
                </label>
              </div>

              {/* Primary Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-3 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d52] active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-3px_rgba(11,31,58,0.28)] disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Signing in...' : 'Sign in to workspace'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-white px-3 font-semibold text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setIsGoogleModalOpen(true);
              }}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100/60 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)] cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Pedestal Security Footnote */}
          <div className="px-4 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Protected workspace &bull; Authorized personnel only</span>
          </div>
        </div>
      </main>

      {/* Statutory Minimal Footer */}
      <footer className="w-full py-5 px-6 text-center text-xs text-slate-500 z-10">
        <p className="font-medium">
          &copy; {new Date().getFullYear()} Amen Mart Auctioning Services &bull; Powered by Dev Surge Infotech
        </p>
      </footer>

      {/* Google Authentication Dialog */}
      {isGoogleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-[24px] bg-white/80 p-1.5 backdrop-blur-xl border border-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.25)]">
            <div className="w-full bg-white border border-slate-200/80 rounded-[18px] p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center">
                    <GoogleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Continue with Google</h3>
                    <p className="text-[11px] text-slate-500">AmenDesk Single Sign-On</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Enter your authorized corporate Google email address to sign in to your AmenDesk workspace.
              </p>

              <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="google-email-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Work Email Address
                  </label>
                  <input
                    id="google-email-input"
                    type="email"
                    required
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="name@amenmart.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200 hover:border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#0B1F3A] focus:ring-4 focus:ring-[#0B1F3A]/8 transition-all"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132d52] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-[24px] bg-white/80 p-1.5 backdrop-blur-xl border border-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.25)]">
            <div className="w-full bg-white border border-slate-200/80 rounded-[18px] p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Password Recovery</h3>
                    <p className="text-[11px] text-slate-500">Workspace Account Security</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed mb-6">
                <p>
                  To safeguard financial operations and statutory auction records, staff credentials are managed by your workspace administrator.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 font-medium">
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>amenmart2291@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>0548517277 / 0558314744</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132d52] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

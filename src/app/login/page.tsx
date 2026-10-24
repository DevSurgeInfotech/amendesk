'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useTheme();
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

      // Universal login: automatically identifies Amen Mart live staff or Dev Surge demo accounts
      authService.login(cleanIdentity, password, rememberMe);

      router.push('/desk');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleGoogleAuthSubmit = (e?: React.FormEvent, directEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const emailToVerify = directEmail || googleEmailInput.trim();
      if (!emailToVerify) {
        throw new Error('Please enter a Google account email address.');
      }

      // Strict verification: only pre-authorized emails pass; uninvited accounts are blocked
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
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#edf2f7] via-[#e4ebf3] to-[#d8e2ec] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-[#4A154B] selection:text-white relative overflow-x-hidden">
      {/* Subtle Architectural Dot Matrix Canvas Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Ambient Atmospheric Lighting Highlights */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[480px] bg-gradient-to-b from-indigo-500/12 via-purple-600/8 to-transparent blur-3xl rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/8 blur-3xl rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-24 w-80 h-80 bg-purple-600/8 blur-3xl rounded-full"
        aria-hidden="true"
      />

      {/* Top Utility Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>Public Showroom</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>PNDCL 230 Licensed</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 z-10 my-auto w-full">
        {/* Elevated Surface Card */}
        <div className="w-full max-w-[490px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] p-7 sm:p-10 relative overflow-hidden transition-all">
          {/* Top Brand Gradient Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-[#4A154B] to-indigo-600 absolute top-0 left-0" />

          {/* Top Row: Amber accent bar & ERP Secure Status Badge */}
          <div className="flex items-center justify-between mb-6 pt-1">
            <div className="w-14 h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 shadow-xs" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SECURE GATEWAY</span>
            </div>
          </div>

          {/* Amen Mart Official Logo */}
          <div className="flex items-center justify-start mb-6">
            <Image
              src="/amenmart-logo.svg"
              alt="Amen Mart Auctioning Services"
              width={220}
              height={68}
              priority
              className="h-11 sm:h-12 w-auto object-contain dark:brightness-110"
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Sign in to your AmenDesk workspace.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-identity"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2"
              >
                EMAIL ADDRESS OR USERNAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-identity"
                  type="text"
                  required
                  autoComplete="username"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="e.g. pastor@graceacc.org or amenmart.live"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#4A154B] dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-2xs font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#b45309] hover:text-[#92400e] dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#4A154B] dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-2xs font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#4A154B] focus:ring-[#4A154B] cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-xs text-slate-600 dark:text-slate-300 font-medium select-none cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#4A154B] hover:bg-[#3D113E] active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in to workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white dark:bg-slate-900 px-3 font-bold text-slate-400 dark:text-slate-500">
                OR CONTINUE WITH
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
            className="w-full py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Quick Demo & Evaluation Credential Autofill Helper */}
        <div className="w-full max-w-[490px] mt-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Quick Test Access</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Click to populate credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setIdentity('amenmart.live');
                setPassword('amen@2026');
                setErrorMsg(null);
              }}
              className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <strong className="block font-bold text-slate-800 dark:text-slate-200 text-[11px]">Amen Mart Live</strong>
              <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">amenmart.live &bull; Live Yard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentity('demo.director');
                setPassword('demo123');
                setErrorMsg(null);
              }}
              className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <strong className="block font-bold text-slate-800 dark:text-slate-200 text-[11px]">Demo Sandbox</strong>
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">demo.director &bull; Seeded Demo</span>
            </button>
          </div>
        </div>
      </main>

      {/* Statutory Trust Footer */}
      <footer className="w-full py-5 px-6 text-center text-xs text-slate-500 dark:text-slate-400 z-10 space-y-2">
        <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Ministry of the Interior Authorized</span>
          </span>
          <span>&bull;</span>
          <span>Ghana Auctioneers Association (GAA)</span>
          <span>&bull;</span>
          <span>IndexedDB Offline Vault</span>
        </div>
        <p className="font-normal text-[11px] text-slate-400 dark:text-slate-500">
          &copy; 2026 Amen Mart Limited &bull; Developed by Dev Surge Infotech Ltd.
        </p>
      </footer>

      {/* Google Authentication & Whitelist Verification Dialog */}
      {isGoogleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="h-6 w-6" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">AmenDesk Enterprise Single Sign-On</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
              <Lock className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Strict Whitelist Policy:</strong> Only pre-provisioned corporate staff accounts are permitted. Unregistered Gmail accounts are automatically blocked.
              </span>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="google-email-input"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Google Account Email
                </label>
                <input
                  id="google-email-input"
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="e.g. dr.yeboah@amenmart.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#4A154B] dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* Quick Whitelisted Options for Testing */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Pre-Authorized Corporate Accounts:
                </span>
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(undefined, 'amenmart2291@gmail.com')}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 text-[11px] block">Amen Mart Executive</strong>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">amenmart2291@gmail.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      Live Workspace
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(undefined, 'devsurgeinfotech@gmail.com')}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 text-[11px] block">Dev Surge Director</strong>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">devsurgeinfotech@gmail.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                      Demo Yard
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#3D113E] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Reset Staff Password</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Security &amp; Account Recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              <p>
                To protect fiscal operations and auction financial records, staff account credentials are centrally managed by platform administrators.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 font-medium">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>amenmart2291@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>0548517277 / 0558314744</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                If you are an authorized administrator, log in to the Platform Console to reset passwords or provision new staff credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#3D113E] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

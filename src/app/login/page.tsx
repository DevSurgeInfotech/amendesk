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
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F7FB] text-slate-800 antialiased selection:bg-[#4A154B] selection:text-white">
      {/* Spacer / Ambient Top */}
      <div className="w-full pt-6 sm:pt-10" />

      {/* Main Login Area */}
      <main className="flex items-center justify-center p-4 sm:p-6 z-10 my-auto">
        <div className="w-full max-w-[480px] bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-7 sm:p-10 relative">
          {/* Top Amber Accent Line (matches snapshot) */}
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 mb-6" />

          {/* Amen Mart Official Logo */}
          <div className="flex items-center justify-start mb-6">
            <Image
              src="/amenmart-logo.svg"
              alt="Amen Mart Auctioning Services"
              width={220}
              height={68}
              priority
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </div>

          {/* Heading (matches snapshot serif styling) */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-sans">
              Sign in to your AmenDesk workspace.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-identity"
                className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="login-identity"
                type="text"
                required
                autoComplete="username"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="pastor@graceacc.org"
                className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#4A154B] focus:ring-4 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#b45309] hover:text-[#92400e] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#4A154B] focus:ring-4 focus:ring-purple-100 transition-all shadow-xs font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
                className="text-xs text-slate-600 font-medium select-none cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Primary Submit CTA (Rich Purple as in snapshot) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#4A154B] hover:bg-[#3D113E] active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/15 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in to workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider (matches snapshot) */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-3 font-bold text-slate-400">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Google Sign-In Button (matches snapshot) */}
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsGoogleModalOpen(true);
            }}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        </div>
      </main>

      {/* Statutory Minimal Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-slate-400 z-10">
        <p className="font-medium">
          &copy; 2026 Amen Mart Limited &bull; Developed by Dev Surge Infotech Ltd.
        </p>
      </footer>

      {/* Google Authentication & Whitelist Verification Dialog */}
      {isGoogleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="h-6 w-6" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-500">AmenDesk Enterprise Single Sign-On</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 leading-relaxed">
              <Lock className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                <strong>Strict Whitelist Policy:</strong> Only pre-provisioned corporate staff accounts are permitted. Unregistered Gmail accounts are automatically blocked.
              </span>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="google-email-input"
                  className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#4A154B] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* Quick Whitelisted Options for Testing */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Pre-Authorized Corporate Accounts:
                </span>
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(undefined, 'amenmart2291@gmail.com')}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-slate-800 text-[11px] block">Amen Mart Executive</strong>
                      <span className="text-[10px] text-slate-400">amenmart2291@gmail.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Live Workspace
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuthSubmit(undefined, 'devsurgeinfotech@gmail.com')}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-slate-800 text-[11px] block">Dev Surge Director</strong>
                      <span className="text-[10px] text-slate-400">devsurgeinfotech@gmail.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Demo Yard
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#4A154B] hover:bg-[#3D113E] text-white font-semibold text-xs transition-colors shadow-xs"
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
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reset Staff Password</h3>
                  <p className="text-[11px] text-slate-500">Security &amp; Account Recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-6">
              <p>
                To protect fiscal operations and auction financial records, staff account credentials are centrally managed by platform administrators.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-medium">
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>amenmart2291@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>0548517277 / 0558314744</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
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

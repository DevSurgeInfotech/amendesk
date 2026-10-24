'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import { GhanaFlag } from '@/components/site/SiteHeader';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  X,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 antialiased selection:bg-[#4A154B] selection:text-white">
      {/* Top Header Strip */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Public Showroom</span>
          </Link>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <GhanaFlag className="h-3 w-4.5" />
            <span className="hidden sm:inline font-medium">Republic of Ghana Licensed Auctioneers</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">256-Bit SSL Encrypted Workspace</span>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-auto">
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
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
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

          {/* Divider */}
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

          {/* Showroom Navigation Button */}
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Building className="h-4 w-4 text-slate-500" />
            <span>Browse Public Showroom &amp; Live Auctions</span>
          </Link>
        </div>
      </main>

      {/* Statutory Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500 z-10 shadow-xs">
        <p className="font-medium text-slate-600">
          &copy; 2026 Amen Mart Limited &bull; Developed by Dev Surge Infotech Ltd.
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Republic of Ghana Licensed Auctioneers &bull; Gbawe, Flower Junction, Accra
        </p>
      </footer>

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

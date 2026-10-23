'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth/authService';
import { GhanaFlag } from '@/components/site/SiteHeader';
import {
  ShieldCheck,
  Building2,
  FlaskConical,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Server,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [selectedTenantCode, setSelectedTenantCode] = useState<'AMEN-MART' | 'DEMO' | 'CUSTOM'>('AMEN-MART');
  const [customTenantCode, setCustomTenantCode] = useState('');
  const [username, setUsername] = useState('francis.yeboah');
  const [password, setPassword] = useState('amen@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect straight to /desk
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      router.push('/desk');
    }
  }, [router]);

  const handleTenantSelect = (code: 'AMEN-MART' | 'DEMO' | 'CUSTOM') => {
    setSelectedTenantCode(code);
    setErrorMsg(null);
    if (code === 'AMEN-MART') {
      setUsername('francis.yeboah');
      setPassword('amen@2026');
    } else if (code === 'DEMO') {
      setUsername('demo.owner');
      setPassword('demo123');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const tenantCode = selectedTenantCode === 'CUSTOM' ? customTenantCode.trim() : selectedTenantCode;
      if (!tenantCode) {
        throw new Error('Please specify a valid Workspace / Tenant Code.');
      }

      authService.login(tenantCode, username, password);

      // Successfully logged in
      setTimeout(() => {
        router.push('/desk');
      }, 150);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    }
  };

  const handleAutofillDemo = () => {
    setSelectedTenantCode('DEMO');
    setUsername('demo.owner');
    setPassword('demo123');
    setErrorMsg(null);
  };

  const activeCode = selectedTenantCode === 'CUSTOM' ? customTenantCode : selectedTenantCode;
  const isDemo = activeCode.toUpperCase() === 'DEMO' || activeCode.toLowerCase().includes('sandbox');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/20 via-slate-900/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

      {/* Top Header Strip */}
      <header className="w-full border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Public Showroom</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <GhanaFlag className="h-3 w-4.5" />
            <span className="hidden sm:inline">Republic of Ghana Licensed Auctioneers</span>
          </div>
        </div>

        <Link
          href="/platform"
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
        >
          <Server className="h-3.5 w-3.5" />
          <span>Platform Admin</span>
        </Link>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-auto">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
          {/* Logo & Headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white font-black text-xl mb-3">
              AM
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AmenDesk ERP Terminal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Encore Multi-Tenant RBAC Authentication Portal
            </p>
          </div>

          {/* Workspace Switcher Tabs */}
          <div className="mb-5 p-1 rounded-2xl bg-slate-850 border border-slate-800 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleTenantSelect('AMEN-MART')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTenantCode === 'AMEN-MART'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Amen Mart Live</span>
            </button>

            <button
              type="button"
              onClick={() => handleTenantSelect('DEMO')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTenantCode === 'DEMO'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Demo Yard</span>
            </button>
          </div>

          {/* Selected Workspace Indicator Pill */}
          <div
            className={`mb-5 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isDemo
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDemo ? <FlaskConical className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{isDemo ? 'Dev Surge Sandbox Demo' : 'Amen Mart Ghana (Live Production)'}</span>
            </div>
            <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-900/80 border border-current">
              {activeCode}
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {selectedTenantCode === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tenant / Organization Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={customTenantCode}
                    onChange={(e) => setCustomTenantCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AMEN-MART or DEMO"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Staff Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. francis.yeboah"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password or Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isDemo
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              } disabled:opacity-50`}
            >
              <span>{isLoading ? 'Verifying Credentials...' : `Sign In to ${isDemo ? 'Demo Yard' : 'Amen Mart Live'}`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Helper for Dev Surge Sales Presentations */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Autofill Dev Surge Demo Account (demo.owner)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Statutory Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 z-10">
        <p>
          &copy; 2026 Amen Mart Limited &bull; Developed by Dev Surge Infotech Ltd.
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Strict Multi-Tenant Isolation: Amen Mart live production records are segregated from developer sandboxes.
        </p>
      </footer>
    </div>
  );
}

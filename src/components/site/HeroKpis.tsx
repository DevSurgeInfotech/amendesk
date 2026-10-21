'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, ShieldCheck, Globe2, Gavel, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroKpisProps {
  className?: string;
}

/**
 * AnimatedCounter component that smoothly animates a number from 0 to target
 * using an ease-out exponential easing function.
 */
function AnimatedCounter({
  target,
  duration = 1300,
  onComplete,
}: {
  target: number;
  duration?: number;
  onComplete?: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Exponential ease-out for snappy, natural deceleration
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.min(target, Math.round(ease * target));
      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, onComplete]);

  return <span className="tabular-nums">{count}</span>;
}

export function HeroKpis({ className }: HeroKpisProps) {
  const [animKey, setAnimKey] = useState(0);
  const [isCounterFinished, setIsCounterFinished] = useState(false);

  // Trigger animation replay on hover or initial mount
  const handleReplay = useCallback(() => {
    setIsCounterFinished(false);
    setAnimKey((prev) => prev + 1);
  }, []);

  const handleComplete = useCallback(() => {
    setIsCounterFinished(true);
  }, []);

  return (
    <div
      className={cn(
        'w-full relative rounded-3xl p-5 sm:p-7 lg:p-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50',
        className
      )}
    >
      {/* Institutional verification header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 mb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Official Performance &amp; Trust Matrix
          </span>
          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">&bull;</span>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
            Amen Mart Auctioning Services
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Regulated under the Laws of the Republic of Ghana</span>
        </div>
      </div>

      {/* Uniquely divided KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: 10+ Years (Amber / Gold Accent) */}
        <div
          onMouseEnter={handleReplay}
          className="group relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 dark:from-amber-950/25 dark:via-slate-900 dark:to-amber-950/10 border border-amber-200/70 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
          title="Hover to replay 10+ Years counter"
        >
          <div className="space-y-4">
            {/* Top row badge & pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold ring-1 ring-amber-300/40 shadow-xs group-hover:scale-105 transition-transform">
                <Award className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                Est. Track Record
              </span>
            </div>

            {/* Metric Value */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  <AnimatedCounter
                    key={animKey}
                    target={10}
                    duration={1300}
                    onComplete={handleComplete}
                  />
                </span>
                <span
                  className={cn(
                    'text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 transition-all duration-300 inline-block',
                    isCounterFinished ? 'scale-110' : 'scale-95'
                  )}
                >
                  +
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Years
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span>Proven Industry Reputation</span>
              </h3>
            </div>

            {/* Subtext */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Over a decade of continuous leadership and public asset disposals in Ghana.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-amber-200/40 dark:border-amber-900/30 flex items-center justify-between text-[11px] font-medium text-amber-700 dark:text-amber-400">
            <span>Decade-Long Trust</span>
            <Sparkles className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>

        {/* Metric 2: GAA Licensed (Indigo Accent) */}
        <div className="group relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-indigo-50/60 via-white to-indigo-50/20 dark:from-indigo-950/25 dark:via-slate-900 dark:to-indigo-950/10 border border-indigo-200/70 dark:border-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Top row badge & pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold ring-1 ring-indigo-300/40 shadow-xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/70 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                Official License
              </span>
            </div>

            {/* Metric Value */}
            <div>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  GAA
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  Licensed
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span>Ghana Auctioneers Association</span>
              </h3>
            </div>

            {/* Subtext */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Regulated by Auctioneers Registration Board &amp; Ministry of the Interior.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-indigo-200/40 dark:border-indigo-900/30 flex items-center justify-between text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
            <span>Accredited Member</span>
            <CheckCircle2 className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>

        {/* Metric 3: Accra • Online (Emerald Accent) */}
        <div className="group relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/20 dark:from-emerald-950/25 dark:via-slate-900 dark:to-emerald-950/10 border border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Top row badge & pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold ring-1 ring-emerald-300/40 shadow-xs group-hover:scale-105 transition-transform">
                <Globe2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Active
              </span>
            </div>

            {/* Metric Value */}
            <div>
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Accra
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">&bull;</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  Online
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span>Live Events &amp; Real-Time Bidding</span>
              </h3>
            </div>

            {/* Subtext */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Physical Accra floor auctions synchronized with instant nationwide digital bidding.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-emerald-200/40 dark:border-emerald-900/30 flex items-center justify-between text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span>Dual-Channel Access</span>
            <CheckCircle2 className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>

        {/* Metric 4: 100% Clear Title (Violet Accent) */}
        <div className="group relative rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-violet-50/60 via-white to-violet-50/20 dark:from-violet-950/25 dark:via-slate-900 dark:to-violet-950/10 border border-violet-200/70 dark:border-violet-900/40 hover:border-violet-400 dark:hover:border-violet-500 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Top row badge & pill */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold ring-1 ring-violet-300/40 shadow-xs group-hover:scale-105 transition-transform">
                <Gavel className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-100/70 dark:bg-violet-950/70 px-2.5 py-1 rounded-full border border-violet-200/60 dark:border-violet-800/60">
                100% Verified
              </span>
            </div>

            {/* Metric Value */}
            <div>
              <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  100
                </span>
                <span className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400">
                  %
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Clear
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                <span>Clear Title &amp; Court Certified</span>
              </h3>
            </div>

            {/* Subtext */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Constitutionally executed sales with verified ownership papers and court orders.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-violet-200/40 dark:border-violet-900/30 flex items-center justify-between text-[11px] font-medium text-violet-700 dark:text-violet-400">
            <span>Clean Legal Ownership</span>
            <CheckCircle2 className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroKpis;

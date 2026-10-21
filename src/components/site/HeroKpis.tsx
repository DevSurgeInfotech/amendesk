'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, ShieldCheck, Globe2, Gavel, CheckCircle2 } from 'lucide-react';

interface HeroKpisProps {
  className?: string;
}

/**
 * AnimatedCounter component that smoothly animates a number from 0 to target
 * using an ease-out exponential easing function.
 */
function AnimatedCounter({
  target,
  duration = 1400,
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
      // Exponential ease-out for a snappy deceleration
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

  return <span className="tabular-nums font-black">{count}</span>;
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
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* KPI 1: 10+ Years (Animated Counter + Shimmer & Pulse Accent) */}
        <div
          onMouseEnter={handleReplay}
          className="surface-card relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
          title="Hover to replay 10+ Years counter"
        >
          {/* Subtle decorative background gradient accent & light shimmer sweep */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 via-amber-500/10 to-transparent blur-xl pointer-events-none" />
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-500/10 dark:via-indigo-400/10 to-transparent pointer-events-none animate-kpi-shimmer" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/80 dark:border-amber-800/80 group-hover:scale-110 transition-transform shadow-2xs">
                <Award className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                Decade of Trust
              </span>
            </div>

            {/* Animated 10+ Years Metric Display */}
            <div className="flex items-baseline gap-1 mt-1 mb-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                <AnimatedCounter
                  key={animKey}
                  target={10}
                  duration={1300}
                  onComplete={handleComplete}
                />
              </span>
              <span
                className={`text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 transition-all duration-300 inline-block ${
                  isCounterFinished ? 'scale-110' : 'scale-95'
                }`}
              >
                +
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 ml-0.5">
                Years
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Proven Industry Reputation
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Over a decade of continuous leadership and public asset disposals in Ghana.
          </p>
        </div>

        {/* KPI 2: GAA Licensed */}
        <div className="surface-card relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/80 dark:border-indigo-800/80 group-hover:scale-110 transition-transform shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Accredited
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 mb-1.5 whitespace-nowrap">
              GAA <span className="text-indigo-600 dark:text-indigo-400">Licensed</span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Ghana Auctioneers Association
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Regulated by Auctioneers Registration Board &amp; Ministry of the Interior.
          </p>
        </div>

        {/* KPI 3: Accra • Online */}
        <div className="surface-card relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/60 dark:to-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/80 dark:border-sky-800/80 group-hover:scale-110 transition-transform shadow-2xs">
                <Globe2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Bidding
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 mb-1.5 whitespace-nowrap">
              Accra <span className="text-indigo-600 dark:text-indigo-400">&bull;</span> Online
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Live Events &amp; Real-Time Bidding
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Physical Accra floor auctions synchronized with instant nationwide digital bidding.
          </p>
        </div>

        {/* KPI 4: 100% Clear Title */}
        <div className="surface-card relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/60 dark:to-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-200/80 dark:border-violet-800/80 group-hover:scale-110 transition-transform shadow-2xs">
                <Gavel className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 shadow-2xs">
                <CheckCircle2 className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                Guaranteed
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 mb-1.5 whitespace-nowrap">
              100<span className="text-violet-600 dark:text-violet-400">%</span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Clear Title &amp; Court Certified
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Constitutionally executed sales with verified ownership papers and court orders.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HeroKpis;

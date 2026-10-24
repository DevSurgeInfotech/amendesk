'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, ShieldCheck, Globe2, Gavel, CheckCircle2 } from 'lucide-react';
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
  duration = 1200,
}: {
  target: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.min(target, Math.round(ease * target));
      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return <span className="tabular-nums">{count}</span>;
}

export function HeroKpis({ className }: HeroKpisProps) {
  const [animKey1, setAnimKey1] = useState(0);
  const [animKey4, setAnimKey4] = useState(0);

  const replayFirst = useCallback(() => {
    setAnimKey1((prev) => prev + 1);
  }, []);

  const replayFourth = useCallback(() => {
    setAnimKey4((prev) => prev + 1);
  }, []);

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Industry Track Record */}
        <div
          onMouseEnter={replayFirst}
          className="surface-card group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            {/* Row 1: Standard KPI Header (Eyebrow Label Left, Soft-Tinted Icon Badge Right) */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Industry Track Record
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  Proven Industry Reputation
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Award className="h-5 w-5" />
              </div>
            </div>

            {/* Row 2: Primary KPI Metric Figure + Status Pill */}
            <div className="mt-4 mb-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-none tabular-nums">
                  <AnimatedCounter key={animKey1} target={10} duration={1200} />+
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                  Years
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 shrink-0">
                <CheckCircle2 className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                Decade+
              </span>
            </div>
          </div>

          {/* Row 3: Standard KPI Benchmark Bar & Metadata Footer */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full rounded-full bg-amber-500 dark:bg-amber-400" />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                Public &amp; judicial disposals
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                100% Active
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Statutory Accreditation */}
        <div className="surface-card group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-all duration-200 flex flex-col justify-between">
          <div>
            {/* Row 1: Standard KPI Header (Eyebrow Label Left, Soft-Tinted Icon Badge Right) */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Statutory Mandate
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  Ghana Auctioneers Association
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            {/* Row 2: Primary KPI Metric Figure + Status Pill */}
            <div className="mt-4 mb-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  GAA
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                  Licensed
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shrink-0">
                <CheckCircle2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                Accredited
              </span>
            </div>
          </div>

          {/* Row 3: Standard KPI Benchmark Bar & Metadata Footer */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full rounded-full bg-indigo-600 dark:bg-indigo-400" />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                Auctioneers Board &amp; Min. of Interior
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Tier-1
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Dual-Channel Bidding Coverage */}
        <div className="surface-card group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-all duration-200 flex flex-col justify-between">
          <div>
            {/* Row 1: Standard KPI Header (Eyebrow Label Left, Soft-Tinted Icon Badge Right) */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Bidding Infrastructure
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  Live Events &amp; Real-Time Bidding
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Globe2 className="h-5 w-5" />
              </div>
            </div>

            {/* Row 2: Primary KPI Metric Figure + Status Pill */}
            <div className="mt-4 mb-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Accra
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                  &amp; Online
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Live Active
              </span>
            </div>
          </div>

          {/* Row 3: Standard KPI Benchmark Bar & Metadata Footer */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full rounded-full bg-emerald-600 dark:bg-emerald-400" />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                Physical floor &amp; digital portal
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                24/7 Sync
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Clear Title & Court Certification */}
        <div
          onMouseEnter={replayFourth}
          className="surface-card group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            {/* Row 1: Standard KPI Header (Eyebrow Label Left, Soft-Tinted Icon Badge Right) */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Title &amp; Deed Assurance
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  Clear Title &amp; Court Certified
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Gavel className="h-5 w-5" />
              </div>
            </div>

            {/* Row 2: Primary KPI Metric Figure + Status Pill */}
            <div className="mt-4 mb-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-none tabular-nums">
                  <AnimatedCounter key={animKey4} target={100} duration={1200} />%
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                  Clear
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-indigo-800/60 shrink-0">
                <CheckCircle2 className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
                Verified
              </span>
            </div>
          </div>

          {/* Row 3: Standard KPI Benchmark Bar & Metadata Footer */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full w-full rounded-full bg-sky-600 dark:bg-sky-400" />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                Court orders &amp; ownership deeds
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Guaranteed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroKpis;

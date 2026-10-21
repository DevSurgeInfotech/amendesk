'use client';

import { useState, useEffect, useCallback } from 'react';
import { Award, ShieldCheck, Globe2, Gavel } from 'lucide-react';
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
    <div
      className={cn(
        'w-full border-y border-slate-200/90 dark:border-slate-800/90 py-8 sm:py-10',
        className
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800 gap-8 sm:gap-0">
        {/* Metric 1: 10+ Years (Animated Counter) */}
        <div
          onMouseEnter={handleReplay}
          className="group cursor-pointer sm:px-6 lg:px-8 first:sm:pl-0 last:sm:pr-0 pt-6 sm:pt-0 first:pt-0 space-y-2 select-none"
          title="Hover to replay 10+ Years counter"
        >
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              <AnimatedCounter
                key={animKey}
                target={10}
                duration={1300}
                onComplete={handleComplete}
              />
            </span>
            <span
              className={`text-3xl sm:text-4xl lg:text-5xl font-black text-indigo-600 dark:text-indigo-400 transition-all duration-300 inline-block ${
                isCounterFinished ? 'scale-110' : 'scale-95'
              }`}
            >
              +
            </span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 dark:text-slate-300 ml-1">
              Years
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Proven Industry Reputation</span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Over a decade of continuous leadership and public asset disposals in Ghana.
          </p>
        </div>

        {/* Metric 2: GAA Licensed */}
        <div className="sm:px-6 lg:px-8 first:sm:pl-0 last:sm:pr-0 pt-6 sm:pt-0 space-y-2">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            GAA <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Licensed</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Ghana Auctioneers Association</span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Regulated by Auctioneers Registration Board &amp; Ministry of the Interior.
          </p>
        </div>

        {/* Metric 3: Accra • Online */}
        <div className="sm:px-6 lg:px-8 first:sm:pl-0 last:sm:pr-0 pt-6 sm:pt-0 space-y-2">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap flex items-center gap-2">
            <span>
              Accra <span className="text-indigo-600 dark:text-indigo-400">&bull;</span> Online
            </span>
            <span
              className="relative flex h-2.5 w-2.5 shrink-0"
              title="Live auction portal active"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Live Events &amp; Real-Time Bidding</span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Physical Accra floor auctions synchronized with instant nationwide digital bidding.
          </p>
        </div>

        {/* Metric 4: 100% Clear Title */}
        <div className="sm:px-6 lg:px-8 first:sm:pl-0 last:sm:pr-0 pt-6 sm:pt-0 space-y-2">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            100<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">%</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Gavel className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span>Clear Title &amp; Court Certified</span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Constitutionally executed sales with verified ownership papers and court orders.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HeroKpis;

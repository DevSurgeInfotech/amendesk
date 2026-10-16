'use client';

import { cn } from '@/lib/utils';

interface ActiveStripProps {
  className?: string;
  glow?: boolean;
}

/**
 * ActiveStrip / CurveStrip — Encore SMS Illuminated Active Indicator
 * Enhanced vertical strip with precision rounded right curvature (rounded-r-full)
 * and an illuminated high-luminance frosted glow.
 */
export function ActiveStrip({ className, glow = true }: ActiveStripProps) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 z-20 select-none',
        'w-1 h-[22px] rounded-r-full bg-white',
        className
      )}
      style={
        glow
          ? {
              boxShadow:
                '0 0 10px rgba(255, 255, 255, 0.95), 0 0 3px #ffffff, 0 1px 3px rgba(0, 0, 0, 0.25)',
            }
          : undefined
      }
      aria-hidden="true"
    />
  );
}

export const CurveStrip = ActiveStrip;
export default ActiveStrip;

'use client';

import { useState, useMemo, type ReactNode } from 'react';

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  hoverColor?: string;
  formattedValue?: string;
}

interface DonutMetricChartProps {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  headerAction?: ReactNode;
}

export function DonutMetricChart({
  title,
  subtitle,
  segments,
  centerLabel = 'Total Volume',
  centerValue,
  size = 140,
  headerAction,
}: DonutMetricChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = useMemo(() => segments.reduce((acc, s) => acc + s.value, 0), [segments]);

  // SVG parameters
  const center = size / 2;
  const strokeWidth = 20;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative arc offsets safely and immutably
  const processedSegments = useMemo(() => {
    return segments.map((seg, idx) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const prevCumulativeFraction = segments
        .slice(0, idx)
        .reduce((sum, s) => sum + (total > 0 ? s.value / total : 0), 0);
      const strokeDashoffset = -prevCumulativeFraction * circumference;
      const percent = Math.round(fraction * 100);

      return {
        ...seg,
        fraction,
        percent,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [segments, total, circumference]);

  const activeSegment = hoveredId ? processedSegments.find((s) => s.id === hoveredId) : null;

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full min-w-0">
      {/* Header with Title and Integrated Action Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Main Content: Centered Donut + Full-Width Progress Legend */}
      <div className="flex flex-col gap-4 my-auto">
        {/* SVG Donut Centerpiece */}
        <div className="relative shrink-0 flex items-center justify-center my-1">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 overflow-visible"
          >
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
            />

            {/* Segment arcs */}
            {total > 0 &&
              processedSegments.map((seg) => {
                const isHovered = hoveredId === seg.id;
                return (
                  <circle
                    key={seg.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredId(seg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="cursor-pointer transition-all duration-200"
                  />
                );
              })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[100px]">
              {activeSegment ? activeSegment.label : centerLabel}
            </span>
            <p className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5 truncate max-w-[110px]">
              {activeSegment
                ? activeSegment.formattedValue || `${activeSegment.percent}%`
                : centerValue || total.toString()}
            </p>
          </div>
        </div>

        {/* Legend List with Micro Progress Bars (Zero-Overflow Design) */}
        <div className="w-full space-y-2.5">
          {processedSegments.map((seg) => {
            const isHovered = hoveredId === seg.id;
            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800/80 shadow-2xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Row: Label + Amount & Percent */}
                <div className="flex items-center justify-between text-xs gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {seg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {seg.formattedValue || seg.value}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      ({seg.percent}%)
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(seg.percent, 2)}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

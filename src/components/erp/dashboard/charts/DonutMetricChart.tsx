'use client';

import { useState, useMemo } from 'react';

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
}

export function DonutMetricChart({
  title,
  subtitle,
  segments,
  centerLabel = 'Total Volume',
  centerValue,
  size = 180,
}: DonutMetricChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = useMemo(() => segments.reduce((acc, s) => acc + s.value, 0), [segments]);

  // SVG parameters
  const center = size / 2;
  const strokeWidth = 24;
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

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Donut and Legend Flex Grid */}
      <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider line-clamp-1">
              {hoveredId
                ? processedSegments.find((s) => s.id === hoveredId)?.label
                : centerLabel}
            </span>
            <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {hoveredId
                ? processedSegments.find((s) => s.id === hoveredId)?.formattedValue ||
                  `${processedSegments.find((s) => s.id === hoveredId)?.percent}%`
                : centerValue || total.toString()}
            </p>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full space-y-2 text-xs">
          {processedSegments.map((seg) => {
            const isHovered = hoveredId === seg.id;
            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {seg.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {seg.formattedValue || seg.value}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">
                    {seg.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

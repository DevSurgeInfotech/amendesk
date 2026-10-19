'use client';

import { useState } from 'react';
import { formatGHS } from '@/lib/utils/currency';
import { TrendingUp, Calendar } from 'lucide-react';

export interface DailyCollectionPoint {
  dateKey: string;      // YYYY-MM-DD
  displayLabel: string; // e.g. "Mon 14", "15 Oct"
  amountGhs: number;
  count: number;
}

interface TrendBarChartProps {
  data: DailyCollectionPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export function TrendBarChart({
  data,
  title = 'Cash Collections Velocity',
  subtitle = 'Daily verified receipts (Cash, MoMo, Bank & Card)',
  height = 180,
}: TrendBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalInPeriod = data.reduce((acc, d) => acc + d.amountGhs, 0);
  const maxAmount = Math.max(...data.map((d) => d.amountGhs), 1);
  const averagePerDay = data.length > 0 ? totalInPeriod / data.length : 0;

  // Chart dimensions in SVG coordinates
  const svgWidth = 560;
  const svgHeight = height;
  const paddingBottom = 28;
  const paddingTop = 20;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const barSlotWidth = svgWidth / Math.max(data.length, 1);
  const barWidth = Math.min(Math.max(barSlotWidth * 0.55, 14), 36);

  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{title}</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Live Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Period Total
          </span>
          <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
            {formatGHS(totalInPeriod)}
          </p>
          <span className="text-[10px] text-slate-500">
            Avg: {formatGHS(averagePerDay)}/day
          </span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-400">
            No collection data recorded in this period.
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full overflow-visible"
              style={{ maxHeight: height }}
            >
              <defs>
                {/* Gradients for bars */}
                <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="barGradientMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Background Reference Grid Lines */}
              <line
                x1="0"
                y1={paddingTop}
                x2={svgWidth}
                y2={paddingTop}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={paddingTop + chartHeight / 2}
                x2={svgWidth}
                y2={paddingTop + chartHeight / 2}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={svgHeight - paddingBottom}
                x2={svgWidth}
                y2={svgHeight - paddingBottom}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />

              {/* Data Bars */}
              {data.map((item, index) => {
                const isHovered = hoveredIndex === index;
                const isMax = item.amountGhs === maxAmount && item.amountGhs > 0;
                const barHeight = Math.max(
                  (item.amountGhs / maxAmount) * chartHeight,
                  item.amountGhs > 0 ? 6 : 2
                );
                const x = index * barSlotWidth + (barSlotWidth - barWidth) / 2;
                const y = svgHeight - paddingBottom - barHeight;

                return (
                  <g
                    key={item.dateKey}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer transition-all duration-150"
                  >
                    {/* Hover hotspot column */}
                    <rect
                      x={index * barSlotWidth}
                      y={0}
                      width={barSlotWidth}
                      height={svgHeight}
                      fill="currentColor"
                      className={
                        isHovered
                          ? 'text-indigo-50/50 dark:text-indigo-950/20'
                          : 'text-transparent'
                      }
                      rx="4"
                    />

                    {/* Bar rectangle with rounded top corners */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={
                        isHovered
                          ? 'url(#barGradientHover)'
                          : isMax
                          ? 'url(#barGradientMax)'
                          : 'url(#barGradientPrimary)'
                      }
                      className="transition-all duration-200"
                    />

                    {/* Peak badge on highest bar */}
                    {isMax && (
                      <circle
                        cx={x + barWidth / 2}
                        cy={y - 6}
                        r="3.5"
                        className="fill-emerald-500 animate-pulse"
                      />
                    )}

                    {/* X-axis date label */}
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-mono select-none ${
                        isHovered
                          ? 'font-bold fill-indigo-600 dark:fill-indigo-400'
                          : 'fill-slate-400 dark:fill-slate-500'
                      }`}
                    >
                      {item.displayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && data[hoveredIndex] && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 backdrop-blur-xs flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{data[hoveredIndex].dateKey}</span>
                </div>
                <div className="font-mono font-bold text-emerald-400">
                  {formatGHS(data[hoveredIndex].amountGhs)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {data[hoveredIndex].count} receipt{data[hoveredIndex].count !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

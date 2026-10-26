'use client';

import { useMemo } from 'react';
import { generateQRCode } from '@/lib/utils/qr';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  label?: string;
}

export function QRCodeView({
  value,
  size = 140,
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  label,
}: QRCodeViewProps) {
  const qr = useMemo(() => {
    try {
      return generateQRCode(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs rounded border border-slate-200 ${className}`}
        style={{ width: size, height: size }}
      >
        QR Error
      </div>
    );
  }

  const moduleSize = 10;
  const margin = 2; // quiet zone
  const totalDim = (qr.size + margin * 2) * moduleSize;

  let pathD = '';
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        pathD += `M${x},${y}h${moduleSize}v${moduleSize}h-${moduleSize}z `;
      }
    }
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div
        className="rounded-lg p-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800"
        style={{ backgroundColor: bgColor }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${totalDim} ${totalDim}`}
          width={size}
          height={size}
          className="block"
          shapeRendering="crispEdges"
        >
          <rect width="100%" height="100%" fill={bgColor} />
          <path d={pathD.trim()} fill={fgColor} />
        </svg>
      </div>
      {label && (
        <span className="mt-1 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * AmenDesk — Commercial Sticker & Label Export Utility
 * Generates high-resolution 300-DPI graphics (PNG) and scalable vector files (SVG)
 * for commercial sticker printing vendors, print shops, and vinyl plotter cutting.
 */

import { generateQRCode } from './qr';
import { formatGHS } from './currency';

export interface StickerExportData {
  title: string;
  stockOrLotNumber: string;
  vin: string;
  fuelType: string;
  transmission: string;
  mileageKm?: number;
  color: string;
  priceLabel: string;
  priceGhs: number;
  location: string;
  primaryPhoto?: string | null;
  qrValue: string;
  qrTargetLabel: string;
  layout: 'A4_WINDOW' | 'COMPACT_HANG_TAG';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Loads an image safely with optional crossOrigin.
 * Resolves null if image fails or is blocked by CORS.
 */
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If anonymous failed for remote host, resolve null rather than throwing
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Generates and downloads a high-resolution, commercial-grade PNG sticker.
 */
export async function downloadStickerPNG(data: StickerExportData): Promise<void> {
  const isA4 = data.layout === 'A4_WINDOW';
  const width = isA4 ? 1600 : 1000;
  const height = isA4 ? 2200 : 1700;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Crisp white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Thick Outer Security Border
  const pad = 40;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  if (isA4) {
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 36);
  } else {
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 50);
  }
  ctx.stroke();

  // Try loading logo
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/amenmart-logo-horizontal-4k.png` : '';
  const logoImg = await loadImageSafe(logoUrl);

  if (isA4) {
    // ==================== A4 MONRONEY WINDOW STICKER ====================
    let y = pad + 40;

    // --- Header Section ---
    const headerHeight = 110;
    if (logoImg) {
      const logoAspect = logoImg.width / logoImg.height;
      const drawHeight = 90;
      const drawWidth = drawHeight * logoAspect;
      ctx.drawImage(logoImg, pad + 40, y + 10, drawWidth, drawHeight);

      // Vertical separator
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pad + 40 + drawWidth + 30, y + 10);
      ctx.lineTo(pad + 40 + drawWidth + 30, y + 100);
      ctx.stroke();

      // Header Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('AMEN MART LIMITED', pad + 40 + drawWidth + 50, y + 40);

      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('OFFICIAL DEALERSHIP & AUTHORIZED AUCTIONEER', pad + 40 + drawWidth + 50, y + 70);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 17px system-ui, -apple-system, sans-serif';
      ctx.fillText('Gbawe, Flower Junction, Accra • Tel: 0548517277 / 0558314744', pad + 40 + drawWidth + 50, y + 96);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('AMEN MART LIMITED', pad + 40, y + 40);

      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('OFFICIAL DEALERSHIP & AUTHORIZED AUCTIONEER', pad + 40, y + 74);
    }

    // Right Header Tag
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(width - pad - 260, y + 15, 220, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL SPEC SHEET', width - pad - 150, y + 41);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(data.stockOrLotNumber, width - pad - 150, y + 85);
    ctx.textAlign = 'left';

    y += headerHeight + 30;

    // Header dividing line
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pad + 30, y);
    ctx.lineTo(width - pad - 30, y);
    ctx.stroke();

    y += 40;

    // --- Hero Banner Box (Title & Price) ---
    const heroBoxHeight = 220;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(pad + 30, y, width - (pad + 30) * 2, heroBoxHeight, 20);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Certified badge
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath();
    ctx.roundRect(pad + 60, y + 25, 210, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('★ CERTIFIED AMEN STOCK', pad + 80, y + 49);

    // Vehicle Title
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.title, pad + 60, y + 115);

    // VIN / Chassis
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('VIN / CHASSIS: ', pad + 60, y + 165);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(data.vin, pad + 215, y + 165);

    // Price Box (Right side of hero)
    const priceBoxW = 400;
    const priceBoxH = 160;
    const priceBoxX = width - pad - 50 - priceBoxW;
    const priceBoxY = y + 30;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.priceLabel.toUpperCase(), priceBoxX + priceBoxW / 2, priceBoxY + 40);

    ctx.fillStyle = '#4338ca';
    ctx.font = '900 46px monospace';
    ctx.fillText(formatGHS(data.priceGhs), priceBoxX + priceBoxW / 2, priceBoxY + 98);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Inclusive of statutory documentation', priceBoxX + priceBoxW / 2, priceBoxY + 135);
    ctx.textAlign = 'left';

    y += heroBoxHeight + 40;

    // --- Main Body (Specs & Photo on Left, Big QR on Right) ---
    const leftColW = 860;
    const rightColX = pad + 30 + leftColW + 40;
    const rightColW = width - rightColX - pad - 30;

    // 4 Spec Badges (2x2 grid)
    const specs = [
      { label: 'FUEL TYPE', val: data.fuelType },
      { label: 'TRANSMISSION', val: data.transmission },
      { label: 'MILEAGE', val: data.mileageKm ? `${data.mileageKm.toLocaleString()} km` : 'Inspected / Low' },
      { label: 'EXTERIOR COLOR', val: data.color },
    ];

    const specCardW = (leftColW - 20) / 2;
    const specCardH = 95;
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = pad + 30 + col * (specCardW + 20);
      const sy = y + row * (specCardH + 16);

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(sx, sy, specCardW, specCardH, 14);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(specs[i].label, sx + 20, sy + 34);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(specs[i].val, sx + 20, sy + 70);
    }

    const photoY = y + 2 * (specCardH + 16) + 10;
    const photoH = 500;

    // Load vehicle photo if available
    let photoImg: HTMLImageElement | null = null;
    if (data.primaryPhoto) {
      photoImg = await loadImageSafe(data.primaryPhoto);
    }

    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pad + 30, photoY, leftColW, photoH, 16);
      ctx.clip();
      ctx.drawImage(photoImg, pad + 30, photoY, leftColW, photoH);
      ctx.restore();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pad + 30, photoY, leftColW, photoH, 16);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(pad + 30, photoY, leftColW, photoH, 16);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AMEN MART CERTIFIED VEHICLE', pad + 30 + leftColW / 2, photoY + photoH / 2);
      ctx.textAlign = 'left';
    }

    // Checklist under photo
    const checkY = photoY + photoH + 40;
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('✓  Clean statutory title • Customs clearance verified', pad + 30, checkY);
    ctx.fillText(`✓  Holding Yard: ${data.location}`, pad + 30, checkY + 36);

    // --- Right Column: Scannable QR Code Panel ---
    const qrPanelH = photoH + 2 * (specCardH + 16) + 80;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(rightColX, y, rightColW, qrPanelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    ctx.textAlign = 'center';
    ctx.fillStyle = '#312e81';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('SCAN WITH PHONE CAMERA', rightColX + rightColW / 2, y + 55);

    // Render QR Code onto canvas
    const qrMatrix = generateQRCode(data.qrValue);
    const qrBoxSize = 360;
    const qrX = rightColX + (rightColW - qrBoxSize) / 2;
    const qrY = y + 85;

    // White card behind QR
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 16, qrY - 16, qrBoxSize + 32, qrBoxSize + 32, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    const modulePx = qrBoxSize / qrMatrix.size;
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < qrMatrix.size; r++) {
      for (let c = 0; c < qrMatrix.size; c++) {
        if (qrMatrix.modules[r][c]) {
          ctx.fillRect(qrX + c * modulePx, qrY + r * modulePx, modulePx + 0.5, modulePx + 0.5);
        }
      }
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.qrTargetLabel, rightColX + rightColW / 2, qrY + qrBoxSize + 60);

    ctx.fillStyle = '#64748b';
    ctx.font = 'normal 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Opens direct vehicle report • No app needed', rightColX + rightColW / 2, qrY + qrBoxSize + 92);

    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`STOCK #${data.stockOrLotNumber}`, rightColX + rightColW / 2, qrY + qrBoxSize + 130);
    ctx.textAlign = 'left';

    // --- Footer ---
    const footerY = height - pad - 40;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 30, footerY - 25);
    ctx.lineTo(width - pad - 30, footerY - 25);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(`AmenDesk ERP Commercial Stock Tag • Exported ${new Date().toLocaleDateString('en-GB')}`, pad + 30, footerY);

    ctx.textAlign = 'right';
    ctx.fillText('Ministry of the Interior & Auctioneers Registration Board Authorized', width - pad - 30, footerY);
    ctx.textAlign = 'left';
  } else {
    // ==================== COMPACT REAR-VIEW MIRROR HANG TAG ====================
    let y = pad + 60;

    // Hanging Loop Hole Marker (Die-Cut guide for print company)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(width / 2, y + 40, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(width / 2, y + 40, 20, 0, Math.PI * 2);
    ctx.fill();

    y += 130;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('AMEN MART INVENTORY', width / 2, y);

    y += 55;
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.title, width / 2, y);

    y += 45;
    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(data.stockOrLotNumber, width / 2, y);

    y += 50;

    // Price Pill
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(140, y, width - 280, 150, 24);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.priceLabel.toUpperCase(), width / 2, y + 45);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 52px monospace';
    ctx.fillText(formatGHS(data.priceGhs), width / 2, y + 105);

    y += 200;

    // Large Scannable QR Code
    const qrMatrix = generateQRCode(data.qrValue);
    const qrBoxSize = 480;
    const qrX = (width - qrBoxSize) / 2;
    const qrY = y;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 20, qrY - 20, qrBoxSize + 40, qrBoxSize + 40, 24);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    const modulePx = qrBoxSize / qrMatrix.size;
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < qrMatrix.size; r++) {
      for (let c = 0; c < qrMatrix.size; c++) {
        if (qrMatrix.modules[r][c]) {
          ctx.fillRect(qrX + c * modulePx, qrY + r * modulePx, modulePx + 0.5, modulePx + 0.5);
        }
      }
    }

    y += qrBoxSize + 60;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scan with Phone for Photos & Specs', width / 2, y);

    y += 35;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`VIN: ${data.vin}`, width / 2, y);

    y += 50;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Amen Mart • Ministry of the Interior Authorized', width / 2, y);
    ctx.textAlign = 'left';
  }

  // Convert canvas to blob and trigger download
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const cleanTitle = sanitizeFilename(data.title || 'Vehicle');
        const cleanStock = sanitizeFilename(data.stockOrLotNumber || 'AM-CAR');
        const filename = `${cleanStock}_${cleanTitle}_QR_${data.layout === 'A4_WINDOW' ? 'A4_Sticker' : 'Hang_Tag'}.png`;
        triggerDownload(blob, filename);
      }
      resolve();
    }, 'image/png');
  });
}

/**
 * Generates and downloads a clean, scalable SVG vector file for plotters and graphic designers.
 */
export function downloadStickerSVG(data: StickerExportData): void {
  const isA4 = data.layout === 'A4_WINDOW';
  const width = isA4 ? 800 : 500;
  const height = isA4 ? 1100 : 850;

  const qrMatrix = generateQRCode(data.qrValue);
  const qrBoxSize = isA4 ? 180 : 220;
  const modulePx = qrBoxSize / qrMatrix.size;

  let qrPaths = '';
  for (let r = 0; r < qrMatrix.size; r++) {
    for (let c = 0; c < qrMatrix.size; c++) {
      if (qrMatrix.modules[r][c]) {
        qrPaths += `M${(c * modulePx).toFixed(2)},${(r * modulePx).toFixed(2)}h${modulePx.toFixed(2)}v${modulePx.toFixed(2)}h-${modulePx.toFixed(2)}z `;
      }
    }
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="20" fill="none" stroke="#0f172a" stroke-width="4" />
  
  <text x="35" y="55" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0f172a">AMEN MART LIMITED</text>
  <text x="35" y="75" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" fill="#4338ca">OFFICIAL DEALERSHIP &amp; AUTHORIZED AUCTIONEER</text>
  <text x="35" y="90" font-family="system-ui, sans-serif" font-size="9" fill="#64748b">Gbawe, Flower Junction, Accra • Tel: 0548517277 / 0558314744</text>

  <line x1="30" y1="105" x2="${width - 30}" y2="105" stroke="#0f172a" stroke-width="2" />

  <rect x="30" y="120" width="${width - 60}" height="100" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="45" y="150" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="#166534">★ CERTIFIED AMEN STOCK</text>
  <text x="45" y="180" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0f172a">${data.title}</text>
  <text x="45" y="202" font-family="monospace" font-size="12" fill="#475569">VIN: ${data.vin}</text>

  <rect x="${width - 240}" y="130" width="195" height="80" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
  <text x="${width - 142}" y="152" font-family="system-ui, sans-serif" font-weight="bold" font-size="9" fill="#64748b" text-anchor="middle">${data.priceLabel.toUpperCase()}</text>
  <text x="${width - 142}" y="182" font-family="monospace" font-weight="900" font-size="22" fill="#4338ca" text-anchor="middle">${formatGHS(data.priceGhs)}</text>

  <g transform="translate(${isA4 ? width - 230 : (width - qrBoxSize) / 2}, ${isA4 ? 260 : 380})">
    <rect x="-10" y="-10" width="${qrBoxSize + 20}" height="${qrBoxSize + 20}" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <path d="${qrPaths.trim()}" fill="#0f172a" />
  </g>

  <text x="${width / 2}" y="${height - 30}" font-family="system-ui, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">AmenDesk ERP Commercial Plotter Export • Stock #${data.stockOrLotNumber}</text>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const cleanTitle = sanitizeFilename(data.title || 'Vehicle');
  const cleanStock = sanitizeFilename(data.stockOrLotNumber || 'AM-CAR');
  const filename = `${cleanStock}_${cleanTitle}_Vector_${data.layout === 'A4_WINDOW' ? 'A4' : 'HangTag'}.svg`;
  triggerDownload(blob, filename);
}

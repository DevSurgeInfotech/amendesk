'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Waybill, AuctionLot, DealershipVehicle, PaymentPlan } from '@/lib/types';
import { useTerminal } from '@/context/TerminalContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ScanLine,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ShieldCheck,
  History,
  Volume2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

interface GateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance;
}

export function GateScannerModal({ isOpen, onClose }: GateScannerModalProps) {
  const { currentStaffName } = useTerminal();

  // Search input state (supports physical USB barcode gun or manual typing)
  const [query, setQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Live query for all waybills to power offline lookup and recent gate releases
  const liveWaybills = useLiveQuery(() => db.waybills.toArray(), []);
  const liveLots = useLiveQuery(() => db.auctionLots.toArray(), []);
  const liveVehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []);
  const livePlans = useLiveQuery(() => db.paymentPlans.toArray(), []);

  const waybills = useMemo(() => liveWaybills ?? [], [liveWaybills]);
  const auctionLots = useMemo(() => liveLots ?? [], [liveLots]);
  const dealershipVehicles = useMemo(() => liveVehicles ?? [], [liveVehicles]);
  const paymentPlans = useMemo(() => livePlans ?? [], [livePlans]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Focus input and cleanup camera on unmount/close
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return undefined;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Clean parse QR code string or Waybill number
  const parsedSearch = useMemo(() => {
    const raw = query.trim();
    if (!raw) return '';

    // If QR formatted: AM-WB:AM-WB-2026-0019|VIN:...
    if (raw.includes('AM-WB:')) {
      const match = raw.match(/AM-WB:([^|]+)/);
      if (match && match[1]) return match[1].trim();
    }
    // If pipe separated: AM-WB-2026-0019|...
    if (raw.includes('|')) {
      return raw.split('|')[0].trim();
    }
    return raw;
  }, [query]);

  // Lookup matched Waybill
  const matchedWaybill: Waybill | undefined = useMemo(() => {
    if (!parsedSearch) return undefined;
    const clean = parsedSearch.toUpperCase();

    return waybills.find((w) => {
      return (
        w.waybillNumber.toUpperCase() === clean ||
        w.id.toUpperCase() === clean ||
        (w.identifier && w.identifier.toUpperCase() === clean) ||
        (w.registrationNumber && w.registrationNumber.toUpperCase() === clean) ||
        w.lotNumber.toUpperCase() === clean
      );
    });
  }, [parsedSearch, waybills]);

  // Find associated lot or dealership vehicle
  const matchedLot: AuctionLot | undefined = useMemo(() => {
    if (!matchedWaybill) return undefined;
    return auctionLots.find((l) => l.id === matchedWaybill.lotId || l.lotNumber === matchedWaybill.lotNumber);
  }, [matchedWaybill, auctionLots]);

  const matchedVehicle: DealershipVehicle | undefined = useMemo(() => {
    if (!matchedWaybill) return undefined;
    return dealershipVehicles.find(
      (v) => v.vin.toUpperCase() === matchedWaybill.identifier.toUpperCase() || v.id === matchedWaybill.lotId
    );
  }, [matchedWaybill, dealershipVehicles]);

  const matchedPaymentPlan: PaymentPlan | undefined = useMemo(() => {
    if (!matchedWaybill) return undefined;
    return paymentPlans.find(
      (p) => p.referenceId === matchedWaybill.lotId || (matchedLot && p.referenceId === matchedLot.id)
    );
  }, [matchedWaybill, matchedLot, paymentPlans]);

  // Camera Barcode Detection Loop
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Attempt native BarcodeDetector if supported in modern browser
      const win = typeof window !== 'undefined' ? (window as unknown as WindowWithBarcodeDetector) : null;
      if (win && win.BarcodeDetector) {
        const detector = new win.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39'],
        });

        const scanLoop = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                setQuery(rawVal);
                stopCamera();
                return;
              }
            }
          } catch {
            // Ignore scan frame hiccups
          }
          if (streamRef.current) {
            requestAnimationFrame(scanLoop);
          }
        };
        requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Unable to open camera. Use a 2D handheld USB barcode gun or type manually.'
      );
      setIsCameraActive(false);
    }
  };

  // Authorize exit action
  const handleAuthorizeExit = async () => {
    if (!matchedWaybill) return;

    const now = new Date().toISOString();
    const updated: Waybill = {
      ...matchedWaybill,
      gateOfficerName: currentStaffName || matchedWaybill.gateOfficerName || 'Gate Security',
      releasedAt: matchedWaybill.releasedAt || now,
    };

    await db.waybills.put(updated);

    // Record stock movement
    await db.stockMovements.add({
      id: `mov-${Date.now()}`,
      itemId: matchedWaybill.lotId || matchedWaybill.id,
      itemName: matchedWaybill.assetDescription,
      fromLocation: 'Amen Mart Yard / Showroom',
      toLocation: `Gate Exit (${matchedWaybill.destinationAddress || 'Consignee'})`,
      quantity: matchedWaybill.quantity || 1,
      transferredBy: currentStaffName || 'Gate Officer',
      timestamp: now,
      reason: `Cleared past security gate under Waybill #${matchedWaybill.waybillNumber}`,
    });

    setActionFeedback(`Vehicle Cleared: Gate exit authorized for ${matchedWaybill.driverName}`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Recent released waybills (last 5)
  const recentWaybills = useMemo(() => {
    return [...waybills]
      .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
      .slice(0, 5);
  }, [waybills]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Security Gate Pass & Waybill Scanner"
      subtitle="Offline-first gate clearance verification for outgoing auction and dealership assets."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Scanner Input & Controls */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan QR with handheld gun or enter AM-WB-XXXX / VIN..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isCameraActive ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={startCamera}
                  className="w-full sm:w-auto whitespace-nowrap bg-indigo-600 hover:bg-indigo-500"
                  icon={<Camera className="h-4 w-4" />}
                >
                  Open Camera
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopCamera}
                  className="w-full sm:w-auto text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  Close Camera
                </Button>
              )}
              {query && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuery('')}
                  className="text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Camera Viewfinder */}
          {isCameraActive && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video max-h-60 flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 pointer-events-none border-2 border-indigo-400/50 m-6 rounded-lg flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-xl animate-pulse flex items-center justify-center">
                  <ScanLine className="h-10 w-10 text-emerald-400 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {cameraError}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-emerald-400" />
              Instant Hardware Gun Auto-Detect
            </span>
            <span>Local Database: {waybills.length} waybill records indexed</span>
          </div>
        </div>

        {actionFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {actionFeedback}
          </div>
        )}

        {/* VERIFICATION RESULT CARD */}
        {query.trim() && (
          <div className="border rounded-2xl p-4 transition-all">
            {matchedWaybill ? (
              <div className="space-y-4">
                {/* Result Status Header */}
                <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-950 dark:text-emerald-100 uppercase">
                          Authorized Gate Release
                        </span>
                        <Badge variant="success">Verified Authentic</Badge>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 font-medium">
                        Waybill #{matchedWaybill.waybillNumber} is genuine and registered in AmenDesk.
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAuthorizeExit}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    icon={<Truck className="h-4 w-4" />}
                  >
                    Release Vehicle (Open Gate)
                  </Button>
                </div>

                {/* 2-Column Particulars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Column 1: Asset Details */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <span className="font-bold text-[10px] uppercase text-indigo-700 dark:text-indigo-400 block border-b border-slate-200 dark:border-slate-800 pb-1">
                      Cleared Asset Particulars
                    </span>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Description</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {matchedVehicle
                          ? `${matchedVehicle.year} ${matchedVehicle.make} ${matchedVehicle.model}`
                          : matchedWaybill.assetDescription}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Chassis / VIN</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{matchedWaybill.identifier}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Plate / Lot No</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {matchedWaybill.registrationNumber || matchedWaybill.lotNumber}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Settlement / Financial State</span>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {matchedPaymentPlan
                          ? matchedPaymentPlan.status === 'PAID_IN_FULL'
                            ? '100% Fully Settled (GH₵ 0.00 Balance)'
                            : `Balance: GH₵ ${matchedPaymentPlan.balanceRemainingGhs.toLocaleString()}`
                          : matchedLot?.status === 'FULLY_PAID' || matchedLot?.status === 'DISPOSED'
                            ? 'Statutory Settlement Cleared'
                            : matchedVehicle
                              ? `Direct Showroom Stock (${matchedVehicle.year} ${matchedVehicle.make} ${matchedVehicle.model})`
                              : 'Direct Showroom Stock Waybill'}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Driver & Destination */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <span className="font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300 block border-b border-slate-200 dark:border-slate-800 pb-1">
                      Transporter &amp; Gate Credentials
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Driver Name</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{matchedWaybill.driverName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Driver Phone</span>
                        <p className="font-mono text-slate-800 dark:text-slate-200">{matchedWaybill.driverPhone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Driver Ghana Card</span>
                        <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {matchedWaybill.driverGhanaCard || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Haulage Plate No</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{matchedWaybill.vehiclePlateNo}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Authorized Officer</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {matchedWaybill.authorizedBy} &bull; Stamped {formatDateTime(matchedWaybill.releasedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Security Alert: Waybill Not Found */
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  GATE ALERT: No Matching Waybill Found
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  The scanned barcode / query <code className="font-mono font-bold">{query}</code> does not match any
                  official gate release docket in the local AmenDesk database.
                </p>
                <div className="text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                  <strong className="block text-rose-800 dark:text-rose-300">Security Gate Protocol:</strong>
                  1. Do not raise the barrier. Request physical paper waybill.
                  <br />
                  2. Verify with Cashier or Yard Manager before allowing egress.
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECENT GATE CLEARANCES */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-500" /> Recent Gate Waybills
            </span>
            <span className="text-[11px] text-slate-400">Past Releases</span>
          </div>

          <div className="space-y-1.5">
            {recentWaybills.length > 0 ? (
              recentWaybills.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setQuery(w.waybillNumber)}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {w.waybillNumber}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[200px]">
                      {w.assetDescription}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="hidden sm:inline font-mono">{w.vehiclePlateNo}</span>
                    <span>{formatDateTime(w.releasedAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-2 text-center">No recent waybill dispatches logged.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

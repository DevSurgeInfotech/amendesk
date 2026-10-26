'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { DealershipVehicle, AuctionLot } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QRCodeView } from '@/components/ui/QRCodeView';
import { downloadStickerPNG, downloadStickerSVG } from '@/lib/utils/stickerExport';
import {
  Printer,
  QrCode,
  Sparkles,
  MessageCircle,
  Globe,
  ShieldCheck,
  Check,
  Download,
  FileCode2,
} from 'lucide-react';

interface VehicleStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: DealershipVehicle | null;
  lot?: AuctionLot | null;
}

type QrTarget = 'SHOWROOM' | 'WHATSAPP' | 'STAFF_ERP';
type StickerLayout = 'A4_WINDOW' | 'COMPACT_HANG_TAG';

export function VehicleStickerModal({
  isOpen,
  onClose,
  vehicle,
  lot,
}: VehicleStickerModalProps) {
  const [qrTarget, setQrTarget] = useState<QrTarget>('SHOWROOM');
  const [layout, setLayout] = useState<StickerLayout>('A4_WINDOW');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || (!vehicle && !lot)) return null;

  // Normalize details between DealershipVehicle and AuctionLot
  const title = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : lot
      ? `${lot.year || ''} ${lot.make || ''} ${lot.model || ''}`.trim() || lot.title
      : 'Amen Mart Vehicle';

  const stockOrLotNumber = vehicle ? vehicle.stockNumber : lot?.lotNumber || 'AM-LOT';
  const vin = vehicle ? vehicle.vin : lot?.chassisNumber || 'N/A';
  const fuelType = vehicle ? vehicle.fuelType : lot?.fuelType || 'PETROL';
  const transmission = vehicle ? vehicle.transmission : 'AUTOMATIC';
  const mileageKm = vehicle ? vehicle.mileageKm : lot?.mileageKm;
  const color = vehicle ? vehicle.color : 'Standard';
  const priceLabel = vehicle ? 'Asking Price' : 'Reserve / Estimate';
  const priceGhs = vehicle ? vehicle.askingPriceGhs : (lot?.hammerPriceGhs || lot?.reservePriceGhs || 0);
  const location = vehicle ? vehicle.location : (lot?.yardLocation || 'Amen Mart Main Yard, Gbawe');
  const primaryPhoto = vehicle?.photos?.[0] || lot?.photos?.[0] || null;

  // Compute QR Destination URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amenmart.com';
  
  let qrValue = `${origin}/showroom?stock=${encodeURIComponent(stockOrLotNumber)}`;
  if (qrTarget === 'WHATSAPP') {
    const waText = encodeURIComponent(
      `Hello Amen Mart, I am inspecting ${title} (Stock #${stockOrLotNumber}, VIN: ${vin}) at your yard. I would like to inquire about pricing and availability.`
    );
    qrValue = `https://wa.me/233548517277?text=${waText}`;
  } else if (qrTarget === 'STAFF_ERP') {
    qrValue = `${origin}/desk/dealership?search=${encodeURIComponent(vin)}`;
  }

  const qrTargetLabel =
    qrTarget === 'WHATSAPP'
      ? 'Instant WhatsApp Sales Chat'
      : qrTarget === 'STAFF_ERP'
        ? 'Staff Maintenance & Test Drive Log'
        : 'View Full Photos & Inspection Report';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    setIsDownloading(true);
    try {
      await downloadStickerPNG({
        title,
        stockOrLotNumber,
        vin,
        fuelType,
        transmission,
        mileageKm,
        color,
        priceLabel,
        priceGhs,
        location,
        primaryPhoto,
        qrValue,
        qrTargetLabel,
        layout,
      });
    } catch (err) {
      console.error('Failed to export sticker PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSVG = () => {
    downloadStickerSVG({
      title,
      stockOrLotNumber,
      vin,
      fuelType,
      transmission,
      mileageKm,
      color,
      priceLabel,
      priceGhs,
      location,
      primaryPhoto,
      qrValue,
      qrTargetLabel,
      layout,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Printable QR Window Sticker & Yard Monroney Label"
      subtitle="Generate high-resolution weatherproof window stickers and hanging tags for vehicle inventory."
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Controls Bar (Hidden during printing) */}
        <div className="no-print space-y-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-indigo-600" /> QR Target:
              </span>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-950 text-xs">
                <button
                  type="button"
                  onClick={() => setQrTarget('SHOWROOM')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    qrTarget === 'SHOWROOM'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" /> Showroom Web
                </button>
                <button
                  type="button"
                  onClick={() => setQrTarget('WHATSAPP')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    qrTarget === 'WHATSAPP'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Lead
                </button>
                <button
                  type="button"
                  onClick={() => setQrTarget('STAFF_ERP')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    qrTarget === 'STAFF_ERP'
                      ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-200 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Staff ERP Fast-Log
                </button>
              </div>
            </div>

            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-950 text-xs">
              <button
                type="button"
                onClick={() => setLayout('A4_WINDOW')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  layout === 'A4_WINDOW'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                A4 Window Spec
              </button>
              <button
                type="button"
                onClick={() => setLayout('COMPACT_HANG_TAG')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  layout === 'COMPACT_HANG_TAG'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Mirror Hang Tag
              </button>
            </div>
          </div>

          {/* Action Export Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium">
              Export commercial graphics to send to sticker/printing company:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPNG}
                isLoading={isDownloading}
                icon={<Download className="h-4 w-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                title="Download 300-DPI high-resolution PNG image to send to sticker printing company via WhatsApp or email"
              >
                Download PNG (For Print Shop)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSVG}
                icon={<FileCode2 className="h-4 w-4 text-indigo-600" />}
                className="text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                title="Download scalable vector SVG file for commercial vinyl cutting and print plotters"
              >
                Vector SVG
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                icon={<Printer className="h-4 w-4" />}
                title="Print directly or save as clean single-page PDF"
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </div>

        {/* PRINTABLE CANVAS */}
        <div className="print:m-0 print:p-0 flex justify-center">
          {layout === 'A4_WINDOW' ? (
            /* A4 Full Window Monroney Sticker */
            <div className="sticker-printable-area a4-document-container w-full max-w-[650px] bg-white text-slate-900 border-2 border-slate-900 p-6 rounded-2xl shadow-md font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/amenmart-logo-horizontal-4k.png"
                    alt="Amen Mart"
                    width={180}
                    height={80}
                    priority
                    unoptimized
                    className="h-10 w-auto object-contain"
                  />
                  <div className="border-l-2 border-slate-300 pl-3">
                    <h1 className="text-sm font-black tracking-wider uppercase text-slate-900">
                      AMEN MART LIMITED
                    </h1>
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                      Official Dealership &amp; Authorized Auctioneer
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Gbawe, Flower Junction, Accra &bull; Tel: 0548517277 / 0558314744
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                    Official Spec Sheet
                  </span>
                  <p className="font-mono font-bold text-xs mt-1 text-slate-700">
                    {stockOrLotNumber}
                  </p>
                </div>
              </div>

              {/* Vehicle Title & Highlight Price Box */}
              <div className="flex items-start justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mb-1">
                    <Sparkles className="h-3 w-3" /> Certified Amen Stock
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {title}
                  </h2>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    VIN / CHASSIS: <span className="font-bold text-slate-900">{vin}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 bg-white px-4 py-2 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {priceLabel}
                  </span>
                  <p className="text-2xl font-black font-mono text-indigo-700 leading-none mt-1">
                    {formatGHS(priceGhs)}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                    Inclusive of statutory documentation
                  </span>
                </div>
              </div>

              {/* Main Content Grid: Specs on Left, QR + Call to Action on Right */}
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* 7 Columns: Specifications Table */}
                <div className="col-span-7 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Fuel Type</span>
                      <span className="font-bold text-slate-800">{fuelType}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Transmission</span>
                      <span className="font-bold text-slate-800">{transmission}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mileage</span>
                      <span className="font-mono font-bold text-slate-800">
                        {mileageKm ? `${mileageKm.toLocaleString()} km` : 'Inspected / Low'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Exterior Color</span>
                      <span className="font-bold text-slate-800">{color}</span>
                    </div>
                  </div>

                  {primaryPhoto && (
                    <div className="relative h-28 w-full rounded-lg overflow-hidden border border-slate-200">
                      <Image
                        src={primaryPhoto}
                        alt={title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                    <p className="flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      Clean statutory title &bull; Customs clearance verified
                    </p>
                    <p className="flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      Holding Yard: {location}
                    </p>
                  </div>
                </div>

                {/* 5 Columns: Big Scannable QR Code */}
                <div className="col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-dashed border-indigo-200 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 mb-2">
                    Scan with Phone Camera
                  </span>
                  
                  <QRCodeView
                    value={qrValue}
                    size={160}
                    className="shadow-sm bg-white p-2 rounded-xl"
                  />

                  <p className="text-[10px] font-bold text-slate-700 mt-2">
                    {qrTargetLabel}
                  </p>
                  <p className="text-[8.5px] text-slate-400 mt-0.5">
                    No special application required
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 mt-4 pt-3 flex justify-between items-center text-[9px] text-slate-400">
                <span>AmenDesk ERP Stock Tag &bull; Printed {new Date().toLocaleDateString('en-GB')}</span>
                <span>Ministry of the Interior &amp; Auctioneers Board Authorized</span>
              </div>
            </div>
          ) : (
            /* COMPACT REAR-VIEW MIRROR HANGING TAG */
            <div className="sticker-printable-area sticker-printable-hang-tag w-[300px] bg-white text-slate-900 border-2 border-slate-900 p-4 rounded-3xl shadow-md font-sans text-center">
              {/* Die-cut hole representation */}
              <div className="w-12 h-12 rounded-full border-4 border-slate-900 mx-auto mb-2 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
              </div>

              <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">
                AMEN MART INVENTORY
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug mt-1">
                {title}
              </h3>
              <p className="font-mono text-[10px] font-bold text-indigo-700 mt-0.5">
                {stockOrLotNumber}
              </p>

              <div className="my-3 py-2 border-y border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                  {priceLabel}
                </span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {formatGHS(priceGhs)}
                </span>
              </div>

              <div className="flex justify-center my-2">
                <QRCodeView value={qrValue} size={130} />
              </div>

              <span className="text-[10px] font-bold text-slate-800 block">
                Scan for Photos &amp; Specs
              </span>
              <span className="text-[8px] font-mono text-slate-400 block mt-1">
                VIN: {vin.slice(0, 11)}...
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

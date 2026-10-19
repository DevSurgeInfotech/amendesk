'use client';

import { useState } from 'react';
import type { AuctionLot, DealershipVehicle, LandParcel, PropertyUnit } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import Link from 'next/link';
import {
  Gavel,
  Car,
  MapPin,
  Building2,
  ArrowRight,
  ShieldAlert,
  Building,
  Layers,
} from 'lucide-react';

interface LineOfOperationsPulseProps {
  lots: AuctionLot[];
  vehicles: DealershipVehicle[];
  landParcels: LandParcel[];
  properties: PropertyUnit[];
}

type OperationTab = 'AUCTIONS' | 'DEALERSHIP' | 'LAND' | 'PROPERTY';

export function LineOfOperationsPulse({
  lots,
  vehicles,
  landParcels,
  properties,
}: LineOfOperationsPulseProps) {
  const [activeTab, setActiveTab] = useState<OperationTab>('AUCTIONS');

  // 1. Auctions Metrics
  const judicialLots = lots.filter((l) => l.category === 'JUDICIAL');
  const govtLots = lots.filter((l) => l.category === 'GOVERNMENT');
  const privateLots = lots.filter((l) => l.category === 'PRIVATE');
  const totalAuctionVolume = lots.reduce(
    (acc, l) => acc + (l.currentBidGhs || l.reservePriceGhs || 0),
    0
  );
  const realized7PercentMargin = lots
    .filter((l) => l.hammerPriceGhs && l.hammerPriceGhs > 0)
    .reduce((acc, l) => acc + (l.hammerPriceGhs || 0) * 0.07, 0);

  // 2. Dealership Metrics
  const availableCars = vehicles.filter((v) => v.status === 'AVAILABLE');
  const reservedCars = vehicles.filter((v) => v.status === 'RESERVED');
  const soldCars = vehicles.filter((v) => v.status === 'SOLD');
  const totalAskingValue = vehicles.reduce((acc, v) => acc + v.askingPriceGhs, 0);
  const totalLandedCost = vehicles.reduce((acc, v) => acc + v.landedCostGhs, 0);
  const projectedDealerGross = Math.max(totalAskingValue - totalLandedCost, 0);

  // 3. Land Parcels Metrics
  const availableParcels = landParcels.filter((p) => p.status === 'AVAILABLE');
  const totalAcreage = landParcels.reduce((acc, p) => acc + (p.sizeAcres || 1), 0);
  const totalLandValuation = landParcels.reduce((acc, p) => acc + p.priceGhs, 0);
  const indentureCount = landParcels.filter((p) => p.titleType === 'INDENTURE').length;
  const leaseholdCount = landParcels.filter((p) => p.titleType === 'LEASEHOLD').length;
  const freeholdCount = landParcels.filter((p) => p.titleType === 'FREEHOLD').length;

  // 4. Property Units Metrics
  const availableProperties = properties.filter((p) => p.status === 'AVAILABLE');
  const residentialCount = properties.filter((p) => p.propertyType === 'RESIDENTIAL').length;
  const commercialCount = properties.filter((p) => p.propertyType === 'COMMERCIAL').length;
  const totalPropertyValuation = properties.reduce((acc, p) => acc + p.priceGhs, 0);

  return (
    <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Header & Tab Switcher */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Amen Mart 4-Line Operations Matrix</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Field &amp; Showroom
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational pulse across Auctions, Car Dealership, Land &amp; Property units
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('AUCTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'AUCTIONS'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Gavel className="h-3.5 w-3.5" />
            <span>Auctions ({lots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEALERSHIP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DEALERSHIP'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Dealership ({vehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LAND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LAND'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Land ({landParcels.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROPERTY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PROPERTY'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Property ({properties.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-5">
        {/* AUCTIONS TAB */}
        {activeTab === 'AUCTIONS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Judicial */}
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Judicial Auctions
                  </span>
                  <span className="font-mono font-bold text-xs text-rose-700 dark:text-rose-300">
                    {judicialLots.length} Lots
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">
                  High Court fi.fa. writs &amp; Sheriff mandates. Movable &amp; Immovable assets.
                </p>
              </div>

              {/* Government */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-amber-600" />
                    Government Fleet
                  </span>
                  <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-300">
                    {govtLots.length} Lots
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Strictly Movable fleet disposals, heavy plants &amp; surplus ministry machinery.
                </p>
              </div>

              {/* Private */}
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    Private Consignment
                  </span>
                  <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300">
                    {privateLots.length} Lots
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Executive vehicles, industrial plants &amp; residential estate liquidations.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400">Total Auction Valuation</span>
                  <p className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatGHS(totalAuctionVolume)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">7% Margin Earned</span>
                  <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatGHS(realized7PercentMargin)}
                  </p>
                </div>
              </div>

              <Link
                href="/desk/auctions"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Go to Auction Yard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* DEALERSHIP TAB */}
        {activeTab === 'DEALERSHIP' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Available in Showroom</span>
                <p className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 mt-1">
                  {availableCars.length} Cars
                </p>
                <span className="text-[10px] text-slate-500">Ready for delivery</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Reserved / Deposit Held</span>
                <p className="font-mono font-black text-lg text-amber-600 dark:text-amber-400 mt-1">
                  {reservedCars.length} Cars
                </p>
                <span className="text-[10px] text-slate-500">Pending final settlement</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Total Asking Valuation</span>
                <p className="font-mono font-black text-base text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {formatGHS(totalAskingValue)}
                </p>
                <span className="text-[10px] text-slate-500">Retail inventory value</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Projected Gross Margin</span>
                <p className="font-mono font-black text-base text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                  {formatGHS(projectedDealerGross)}
                </p>
                <span className="text-[10px] text-slate-500">Asking price minus landed cost</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">
                Spintex Showroom &bull; {soldCars.length} vehicles sold &amp; delivered this quarter
              </span>
              <Link
                href="/desk/dealership"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Showroom</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* LAND TAB */}
        {activeTab === 'LAND' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Total Land Portfolio</span>
                <p className="font-mono font-black text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {landParcels.length} Parcels ({totalAcreage} Acres)
                </p>
                <span className="text-[10px] text-slate-500">{availableParcels.length} available for outright purchase</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Title Types Breakdown</span>
                <div className="space-y-1 mt-1 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-indigo-600 dark:text-indigo-400">Customary Indenture:</span>
                    <span className="font-mono">{indentureCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Leasehold Title:</span>
                    <span className="font-mono">{leaseholdCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600 dark:text-amber-400">Titled Freehold:</span>
                    <span className="font-mono">{freeholdCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Portfolio Valuation</span>
                <p className="font-mono font-black text-base text-slate-900 dark:text-slate-100 mt-1">
                  {formatGHS(totalLandValuation)}
                </p>
                <span className="text-[10px] text-slate-500">East Legon Hills, Prampram &amp; Tsopoli</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">All parcels verified with registered cadastral site plans</span>
              <Link
                href="/desk/land"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Land Registry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* PROPERTY TAB */}
        {activeTab === 'PROPERTY' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Units Under Management</span>
                <p className="font-mono font-black text-lg text-slate-900 dark:text-slate-100 mt-1">
                  {properties.length} Developments
                </p>
                <span className="text-[10px] text-slate-500">{availableProperties.length} currently available</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Asset Classification</span>
                <div className="space-y-1 mt-1 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-indigo-600 dark:text-indigo-400">Residential Units:</span>
                    <span className="font-mono">{residentialCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Commercial Units:</span>
                    <span className="font-mono">{commercialCount}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-slate-400 text-[11px]">Total Property Valuation</span>
                <p className="font-mono font-black text-base text-slate-900 dark:text-slate-100 mt-1">
                  {formatGHS(totalPropertyValuation)}
                </p>
                <span className="text-[10px] text-slate-500">Deed of assignment transfer ready</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Residential townhouses, apartments &amp; commercial warehouses</span>
              <Link
                href="/desk/property"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Properties</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

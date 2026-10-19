'use client';

import Link from 'next/link';
import {
  CreditCard,
  Car,
  Gavel,
  Truck,
  Receipt,
  Building,
} from 'lucide-react';

interface QuickActionBarProps {
  onOpenPayment: () => void;
  onOpenVehicleIntake: () => void;
  onOpenWaybillModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenBankDepositModal: () => void;
}

export function QuickActionBar({
  onOpenPayment,
  onOpenVehicleIntake,
  onOpenWaybillModal,
  onOpenExpenseModal,
  onOpenBankDepositModal,
}: QuickActionBarProps) {
  return (
    <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Speed Operations &bull; Quick Action Command Hub
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          1-Click Field &amp; Office Launchpad
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Record POS Payment */}
        <button
          type="button"
          onClick={onOpenPayment}
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white group-hover:bg-white group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 group-hover:text-white truncate">
              Record POS Payment
            </p>
            <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 group-hover:text-indigo-100 truncate">
              Cash, MoMo, Card
            </p>
          </div>
        </button>

        {/* Showroom Vehicle Intake */}
        <button
          type="button"
          onClick={onOpenVehicleIntake}
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-slate-800 dark:bg-slate-700 text-white group-hover:bg-white group-hover:text-slate-900 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Car className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-white truncate">
              Intake Vehicle
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-200 truncate">
              Add to Showroom
            </p>
          </div>
        </button>

        {/* Auction Lot Intake */}
        <Link
          href="/desk/auctions/intake"
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-amber-600 text-white group-hover:bg-white group-hover:text-amber-600 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Gavel className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-white truncate">
              Auction Lot Intake
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-200 truncate">
              Judicial, Govt, Private
            </p>
          </div>
        </Link>

        {/* Issue Yard Waybill */}
        <button
          type="button"
          onClick={onOpenWaybillModal}
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-600 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-white truncate">
              Issue Waybill
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-200 truncate">
              A5 Gate Pass
            </p>
          </div>
        </button>

        {/* Record Expense */}
        <button
          type="button"
          onClick={onOpenExpenseModal}
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-600 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Receipt className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-white truncate">
              Record Expense
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-200 truncate">
              Yard Rent, Logistics, AP
            </p>
          </div>
        </button>

        {/* Bank Deposit Slip */}
        <button
          type="button"
          onClick={onOpenBankDepositModal}
          className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 transition-all text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <Building className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-white truncate">
              Bank Deposit Slip
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-200 truncate">
              Sweep Cash to Bank
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

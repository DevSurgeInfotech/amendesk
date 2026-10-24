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

interface QuickActionConfig {
  id: string;
  title: string;
  subtitle: string;
  ariaLabel: string;
  icon: typeof CreditCard;
  iconBgClass: string;
  borderClass: string;
  bgClass: string;
  hoverClass: string;
  titleColorClass: string;
  subtitleColorClass: string;
  tooltipPos: string;
  arrowPos: string;
  onClick?: () => void;
  href?: string;
}

export function QuickActionBar({
  onOpenPayment,
  onOpenVehicleIntake,
  onOpenWaybillModal,
  onOpenExpenseModal,
  onOpenBankDepositModal,
}: QuickActionBarProps) {
  const actions: QuickActionConfig[] = [
    {
      id: 'record-pos',
      title: 'Record POS Payment',
      subtitle: 'Cash, MoMo, Card',
      ariaLabel: 'Record POS Payment: Cash, MoMo, Card counter collections',
      icon: CreditCard,
      iconBgClass: 'bg-indigo-600 text-white group-hover:bg-white group-hover:text-indigo-600',
      borderClass: 'border-indigo-200 dark:border-indigo-900/60',
      bgClass: 'bg-indigo-50/60 dark:bg-indigo-950/30',
      hoverClass: 'hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600',
      titleColorClass: 'text-indigo-950 dark:text-indigo-200 group-hover:text-white',
      subtitleColorClass: 'text-indigo-600/80 dark:text-indigo-400 group-hover:text-indigo-100',
      tooltipPos: 'left-0 sm:left-0 lg:left-0',
      arrowPos: 'left-6',
      onClick: onOpenPayment,
    },
    {
      id: 'vehicle-intake',
      title: 'Intake Vehicle',
      subtitle: 'Add to Showroom',
      ariaLabel: 'Intake Vehicle: Add to Showroom inventory registry',
      icon: Car,
      iconBgClass: 'bg-slate-800 dark:bg-slate-700 text-white group-hover:bg-white group-hover:text-slate-900',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      hoverClass: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700',
      titleColorClass: 'text-slate-900 dark:text-slate-100 group-hover:text-white',
      subtitleColorClass: 'text-slate-500 group-hover:text-slate-200',
      tooltipPos: 'right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto lg:left-1/2 lg:-translate-x-1/2',
      arrowPos: 'right-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto lg:left-1/2 lg:-translate-x-1/2',
      onClick: onOpenVehicleIntake,
    },
    {
      id: 'auction-intake',
      title: 'Auction Lot Intake',
      subtitle: 'Judicial, Govt, Private',
      ariaLabel: 'Auction Lot Intake: Judicial, Govt, Private asset cataloging',
      icon: Gavel,
      iconBgClass: 'bg-amber-600 text-white group-hover:bg-white group-hover:text-amber-600',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      hoverClass: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700',
      titleColorClass: 'text-slate-900 dark:text-slate-100 group-hover:text-white',
      subtitleColorClass: 'text-slate-500 group-hover:text-slate-200',
      tooltipPos: 'left-0 sm:right-0 sm:left-auto lg:left-1/2 lg:-translate-x-1/2 lg:right-auto',
      arrowPos: 'left-6 sm:right-6 sm:left-auto lg:left-1/2 lg:-translate-x-1/2 lg:right-auto',
      href: '/desk/auctions/intake',
    },
    {
      id: 'issue-waybill',
      title: 'Issue Waybill',
      subtitle: 'A5 Gate Pass',
      ariaLabel: 'Issue Waybill: A5 Gate Pass and yard exit clearance',
      icon: Truck,
      iconBgClass: 'bg-emerald-600 text-white group-hover:bg-white group-hover:text-emerald-600',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      hoverClass: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700',
      titleColorClass: 'text-slate-900 dark:text-slate-100 group-hover:text-white',
      subtitleColorClass: 'text-slate-500 group-hover:text-slate-200',
      tooltipPos: 'right-0 sm:left-0 sm:right-auto lg:left-1/2 lg:-translate-x-1/2',
      arrowPos: 'right-6 sm:left-6 sm:right-auto lg:left-1/2 lg:-translate-x-1/2',
      onClick: onOpenWaybillModal,
    },
    {
      id: 'record-expense',
      title: 'Record Expense',
      subtitle: 'Yard Rent, Logistics, AP',
      ariaLabel: 'Record Expense: Yard Rent, Logistics, AP disbursements',
      icon: Receipt,
      iconBgClass: 'bg-rose-600 text-white group-hover:bg-white group-hover:text-rose-600',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      hoverClass: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700',
      titleColorClass: 'text-slate-900 dark:text-slate-100 group-hover:text-white',
      subtitleColorClass: 'text-slate-500 group-hover:text-slate-200',
      tooltipPos: 'left-0 sm:left-1/2 sm:-translate-x-1/2 sm:left-auto lg:left-1/2 lg:-translate-x-1/2',
      arrowPos: 'left-6 sm:left-1/2 sm:-translate-x-1/2 sm:left-auto lg:left-1/2 lg:-translate-x-1/2',
      onClick: onOpenExpenseModal,
    },
    {
      id: 'bank-deposit',
      title: 'Bank Deposit Slip',
      subtitle: 'Sweep Cash to Bank',
      ariaLabel: 'Bank Deposit Slip: Sweep Cash to Bank clearance queue',
      icon: Building,
      iconBgClass: 'bg-blue-600 text-white group-hover:bg-white group-hover:text-blue-600',
      borderClass: 'border-slate-200 dark:border-slate-800',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      hoverClass: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700',
      titleColorClass: 'text-slate-900 dark:text-slate-100 group-hover:text-white',
      subtitleColorClass: 'text-slate-500 group-hover:text-slate-200',
      tooltipPos: 'right-0 sm:right-0 lg:right-0',
      arrowPos: 'right-6',
      onClick: onOpenBankDepositModal,
    },
  ];

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
        {actions.map((action) => {
          const Icon = action.icon;
          const sharedClasses = `group relative flex items-center gap-2.5 p-2.5 rounded-xl border ${action.borderClass} ${action.bgClass} ${action.hoverClass} transition-all text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500`;

          const content = (
            <>
              {/* Tooltip revealing full untruncated words */}
              <div
                role="tooltip"
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-full mb-2.5 opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:scale-100 group-focus-visible:translate-y-0 transition-all duration-150 ease-out z-40 px-3 py-2 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-xl border border-slate-700/60 dark:border-slate-800 backdrop-blur-xs min-w-[180px] max-w-[240px] text-left select-none ${action.tooltipPos}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <p className="text-xs font-bold text-white tracking-tight leading-tight">
                    {action.title}
                  </p>
                </div>
                <p className="text-[11px] font-medium text-slate-300 dark:text-slate-400 leading-tight">
                  {action.subtitle}
                </p>
                {/* Tooltip Downward Arrow */}
                <div
                  className={`absolute top-full -mt-px border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950/95 ${action.arrowPos}`}
                />
              </div>

              {/* Icon */}
              <div
                className={`h-8 w-8 rounded-lg ${action.iconBgClass} flex items-center justify-center shrink-0 transition-colors shadow-xs`}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Text Container with Truncation on narrow viewports */}
              <div className="min-w-0">
                <p className={`text-xs font-bold ${action.titleColorClass} truncate`}>
                  {action.title}
                </p>
                <p className={`text-[10px] ${action.subtitleColorClass} truncate`}>
                  {action.subtitle}
                </p>
              </div>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                aria-label={action.ariaLabel}
                className={sharedClasses}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              className={sharedClasses}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

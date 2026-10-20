'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PaymentPlan } from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDate, getInstalmentWindowInfo } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PaymentModal } from '@/components/erp/PaymentModal';
import { ExtensionModal } from '@/components/erp/ExtensionModal';
import {
  CreditCard,
  CalendarPlus,
  History,
  CheckCircle2,
  Search,
} from 'lucide-react';

function PaymentPlansContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');

  const plans = useLiveQuery(() => db.paymentPlans.toArray(), []) || [];
  const initialFilter = urlFilter && ['ALL', 'AWAITING_BALANCE', 'OVERDUE', 'EXTENDED', 'PAID_IN_FULL'].includes(urlFilter)
    ? (urlFilter as 'ALL' | 'AWAITING_BALANCE' | 'OVERDUE' | 'EXTENDED' | 'PAID_IN_FULL')
    : 'ALL';
  const [filter, setFilter] = useState<'ALL' | 'AWAITING_BALANCE' | 'OVERDUE' | 'EXTENDED' | 'PAID_IN_FULL'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null);
  const [extensionPlan, setExtensionPlan] = useState<PaymentPlan | null>(null);

  const filteredPlans = plans.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.referenceTitle.toLowerCase().includes(q);
      const matchBuyer = p.customerName.toLowerCase().includes(q) || p.customerPhone.includes(q);
      if (!matchTitle && !matchBuyer) return false;
    }
    return true;
  });

  const totalOutstanding = plans
    .filter((p) => p.status !== 'PAID_IN_FULL')
    .reduce((acc, p) => acc + p.balanceRemainingGhs, 0);

  const overdueCount = plans.filter((p) => p.status === 'OVERDUE').length;
  const activeCount = plans.filter((p) => p.status === 'AWAITING_BALANCE' || p.status === 'EXTENDED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              14-Day Settlement Engine
            </span>
            <span className="text-xs text-slate-400">Aging Receivables &bull; Extension Manager</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Deposit &amp; Instalment Payment Plans
          </h1>
          <p className="text-xs text-slate-500">
            Hammer sales initiate a 14-day window for full settlement. Partial payments permitted in multiple instalments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard
          theme="amber"
          title="Total Outstanding Balance"
          value={formatGHS(totalOutstanding)}
          subtitle={`${plans.length} total payment plans`}
          iconName="receivables"
        />

        <GlassCard
          theme="indigo"
          title="Active Within 14-Day Window"
          value={`${activeCount} Plans`}
          subtitle="Scheduled for balance settlement"
          iconName="collections"
        />

        <GlassCard
          theme="rose"
          title="Overdue / Needs Extension"
          value={`${overdueCount} Plans`}
          subtitle="Eligible for manager extension"
          iconName="alert"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'AWAITING_BALANCE', 'OVERDUE', 'EXTENDED', 'PAID_IN_FULL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buyer or asset..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => {
          const windowInfo = getInstalmentWindowInfo(plan.currentDueDate);
          return (
            <div
              key={plan.id}
              className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {plan.referenceType}
                  </Badge>
                  <Badge
                    variant={
                      plan.status === 'PAID_IN_FULL'
                        ? 'success'
                        : plan.status === 'OVERDUE'
                        ? 'danger'
                        : plan.status === 'EXTENDED'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {plan.status.replace('_', ' ')}
                  </Badge>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${windowInfo.badgeClass}`}>
                    {windowInfo.statusLabel}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {plan.referenceTitle}
                </h3>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-5 gap-y-1">
                  <span>Buyer: <strong className="text-slate-700 dark:text-slate-300">{plan.customerName}</strong> ({plan.customerPhone})</span>
                  <span>Due Date: <strong>{formatDate(plan.currentDueDate)}</strong></span>
                  <span>Total Amount: <strong>{formatGHS(plan.totalPriceGhs)}</strong></span>
                </div>

                {/* Extension Trail */}
                {plan.extensions && plan.extensions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <History className="h-3.5 w-3.5" />
                      <span>Extension History ({plan.extensions.length}x):</span>
                    </div>
                    {plan.extensions.map((ext, idx) => (
                      <p key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-400">
                        Extended to <strong>{formatDate(ext.newDueDate)}</strong> by {ext.extendedBy}: &quot;{ext.reason}&quot;
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Balances & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500">Balance Remaining</span>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {formatGHS(plan.balanceRemainingGhs)}
                  </p>
                  <span className="text-xs text-slate-400">
                    Deposit Paid: {formatGHS(plan.depositPaidGhs)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {plan.status !== 'PAID_IN_FULL' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setPaymentPlan(plan)}
                        icon={<CreditCard className="h-4 w-4" />}
                      >
                        Pay Instalment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExtensionPlan(plan)}
                        icon={<CalendarPlus className="h-4 w-4" />}
                      >
                        Grant Extension
                      </Button>
                    </>
                  )}
                  {plan.status === 'PAID_IN_FULL' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Settled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {paymentPlan && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentPlan(null)}
          paymentPlan={paymentPlan}
          onSuccess={() => setPaymentPlan(null)}
        />
      )}

      {/* Extension Modal */}
      {extensionPlan && (
        <ExtensionModal
          isOpen={true}
          onClose={() => setExtensionPlan(null)}
          paymentPlan={extensionPlan}
          onSuccess={() => setExtensionPlan(null)}
        />
      )}
    </div>
  );
}

export default function PaymentPlansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading payment plans...</div>}>
      <PaymentPlansContent />
    </Suspense>
  );
}

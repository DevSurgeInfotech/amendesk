'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type {
  Receipt,
  PaymentMethod,
  AccountType,
  Invoice,
} from '@/lib/types';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime, formatDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ThermalReceipt } from '@/components/erp/ThermalReceipt';
import { NewJournalEntryModal } from '@/components/erp/accounting/NewJournalEntryModal';
import { RecordExpenseModal } from '@/components/erp/accounting/RecordExpenseModal';
import { NewAccountModal } from '@/components/erp/accounting/NewAccountModal';
import { NewInvoiceModal } from '@/components/erp/accounting/NewInvoiceModal';
import { InvoiceViewerModal } from '@/components/erp/accounting/InvoiceViewerModal';
import { PaymentModal } from '@/components/erp/PaymentModal';
import Link from 'next/link';
import {
  Receipt as ReceiptIcon,
  Printer,
  Smartphone,
  Banknote,
  Building,
  CreditCard,
  Search,
  PlusCircle,
  BookOpen,
  PieChart,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  FileCheck,
  Scale,
  ArrowRight,
} from 'lucide-react';

type TabType =
  | 'OVERVIEW'
  | 'CHART_OF_ACCOUNTS'
  | 'GENERAL_LEDGER'
  | 'FINANCIAL_REPORTS'
  | 'EXPENSES'
  | 'INVOICES'
  | 'RECEIPTS';

const VALID_TABS: TabType[] = [
  'OVERVIEW',
  'CHART_OF_ACCOUNTS',
  'GENERAL_LEDGER',
  'FINANCIAL_REPORTS',
  'EXPENSES',
  'INVOICES',
  'RECEIPTS',
];

const tabMeta: Record<
  TabType,
  { label: string; desc: string; icon: typeof PieChart }
> = {
  OVERVIEW: {
    label: 'Financial Overview & KPIs',
    desc: 'Audit-ready Chart of Accounts, Double-Entry Journal Postings, Trial Balance, P&L, Balance Sheet, Invoicing, and Multi-Mode Cash Office.',
    icon: PieChart,
  },
  CHART_OF_ACCOUNTS: {
    label: 'Chart of Accounts (COA)',
    desc: 'Standardized Ghana IFRS 4-digit general ledger master accounts spanning Assets, Liabilities, Equity, Revenue & Expenses.',
    icon: BookOpen,
  },
  GENERAL_LEDGER: {
    label: 'General Ledger & Double-Entry Journals',
    desc: 'Immutable audit journal transactions where Total Debits strictly balance Total Credits with source document references.',
    icon: FileCheck,
  },
  FINANCIAL_REPORTS: {
    label: 'Financial Statements (P&L, Balance Sheet, GRA Tax)',
    desc: 'Real-time financial position, income statement, multi-mode cash book, and Ghana Revenue Authority tax levy obligations.',
    icon: Scale,
  },
  EXPENSES: {
    label: 'Operating Expenses & Accounts Payable (AP)',
    desc: 'Record and track yard rent, facility power, security, vehicle logistics, legal fees, and administrative operating expenses.',
    icon: DollarSign,
  },
  INVOICES: {
    label: 'Invoices & Commercial Billing',
    desc: 'Issue official commercial & GRA tax invoices with standard statutory levies, direct payment linkage, and printable A4 formats.',
    icon: FileText,
  },
  RECEIPTS: {
    label: 'Cashier Receipts Ledger',
    desc: 'Comprehensive audit registry of all payment receipts issued across physical Cash, Mobile Money, Bank Wire, and Card POS.',
    icon: ReceiptIcon,
  },
};

function AccountsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as TabType | null;
  const activeTab: TabType = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'OVERVIEW';

  const currentMeta = tabMeta[activeTab];
  const CurrentIcon = currentMeta.icon;

  const setActiveTab = (tab: TabType) => {
    router.push(`/desk/accounts?tab=${tab}`);
  };

  // Live queries
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const journalEntries = useLiveQuery(() => db.journalEntries.orderBy('date').reverse().toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  // Modals state
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filters
  const [coaTypeFilter, setCoaTypeFilter] = useState<'ALL' | AccountType>('ALL');
  const [receiptMethodFilter, setReceiptMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statementSubTab, setStatementSubTab] = useState<'TRIAL_BALANCE' | 'PNL' | 'BALANCE_SHEET' | 'CASH_BOOK' | 'GRA_TAX'>('TRIAL_BALANCE');

  // Key Totals
  const momoTotal = receipts.filter((r) => r.paymentMethod === 'MOMO').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const cashTotal = receipts.filter((r) => r.paymentMethod === 'CASH').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const bankTotal = receipts.filter((r) => r.paymentMethod === 'BANK_TRANSFER').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const cardTotal = receipts.filter((r) => r.paymentMethod === 'CARD_PAYSTACK').reduce((acc, r) => acc + r.amountPaidGhs, 0);

  // Liquidity Accounts (Cash, MoMo, Bank)
  const liquidAccounts = accounts.filter(
    (a) => a.type === 'ASSET' && (a.code.startsWith('10') || a.category === 'CURRENT_ASSET') && a.code !== '1200' && !a.code.startsWith('13')
  );
  const totalLiquidity = liquidAccounts.reduce((acc, a) => acc + a.balanceGhs, 0);

  // Receivables (1200) & Payables (2000s)
  const arAccount = accounts.find((a) => a.code === '1200');
  const totalReceivables = arAccount ? arAccount.balanceGhs : 0;

  const totalPayablesAndEscrow = accounts
    .filter((a) => a.type === 'LIABILITY' && a.code.startsWith('20'))
    .reduce((acc, a) => acc + a.balanceGhs, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amountGhs, 0);

  // P&L Calculations
  const revenueAccounts = accounts.filter((a) => a.type === 'REVENUE');
  const totalRevenue = revenueAccounts.reduce((acc, a) => acc + a.balanceGhs, 0);

  const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');
  const totalOperatingExpenses = expenseAccounts.reduce((acc, a) => acc + a.balanceGhs, 0);
  const netOperatingProfit = totalRevenue - totalOperatingExpenses;

  // Trial Balance Calculations
  const totalDebitBalances = accounts
    .filter((a) => a.type === 'ASSET' || a.type === 'EXPENSE')
    .reduce((acc, a) => acc + a.balanceGhs, 0);
  const totalCreditBalances = accounts
    .filter((a) => a.type === 'LIABILITY' || a.type === 'EQUITY' || a.type === 'REVENUE')
    .reduce((acc, a) => acc + a.balanceGhs, 0);
  const trialBalanceDiff = Math.abs(totalDebitBalances - totalCreditBalances);

  // Balance Sheet Calculations
  const totalAssets = accounts.filter((a) => a.type === 'ASSET').reduce((acc, a) => acc + a.balanceGhs, 0);
  const totalLiabilities = accounts.filter((a) => a.type === 'LIABILITY').reduce((acc, a) => acc + a.balanceGhs, 0);
  const totalEquity = accounts.filter((a) => a.type === 'EQUITY').reduce((acc, a) => acc + a.balanceGhs, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + netOperatingProfit;

  // GRA Statutory Tax Calculations
  const vatAcc = accounts.find((a) => a.code === '2100');
  const nhilAcc = accounts.find((a) => a.code === '2110');
  const getfundAcc = accounts.find((a) => a.code === '2120');
  const covidAcc = accounts.find((a) => a.code === '2130');
  const whtAcc = accounts.find((a) => a.code === '2140');

  const totalVat = (vatAcc?.balanceGhs || 0) + invoices.reduce((acc, i) => acc + (i.vatGhs || 0), 0);
  const totalNhil = (nhilAcc?.balanceGhs || 0) + invoices.reduce((acc, i) => acc + (i.nhilGhs || 0), 0);
  const totalGetfund = (getfundAcc?.balanceGhs || 0) + invoices.reduce((acc, i) => acc + (i.getfundGhs || 0), 0);
  const totalCovid = (covidAcc?.balanceGhs || 0) + invoices.reduce((acc, i) => acc + (i.covidGhs || 0), 0);
  const totalWht = whtAcc?.balanceGhs || 0;

  // Filtered Receipts
  const filteredReceipts = receipts.filter((r) => {
    if (receiptMethodFilter !== 'ALL' && r.paymentMethod !== receiptMethodFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.referenceTitle.toLowerCase().includes(q) ||
        (r.transactionReference && r.transactionReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Chart of Accounts
  const filteredAccounts = accounts.filter((a) => {
    if (coaTypeFilter !== 'ALL' && a.type !== coaTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="surface-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <CurrentIcon className="h-3.5 w-3.5" />
              <span>Accounting &bull; {currentMeta.label}</span>
            </span>
            <span className="text-xs text-slate-400">Ghana IFRS &bull; Multi-Mode GL &bull; GRA Tax Compliant</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {currentMeta.label}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl mt-0.5">
            {currentMeta.desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/desk/payments">
            <Button size="sm" variant="primary" icon={<CreditCard className="h-4 w-4" />}>
              Record Payment
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            icon={<FileCheck className="h-4 w-4" />}
            onClick={() => setIsJournalModalOpen(true)}
          >
            New Journal Entry
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<DollarSign className="h-4 w-4" />}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            Record Expense
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<FileText className="h-4 w-4" />}
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Horizontal In-Page Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {VALID_TABS.map((tab) => {
          const meta = tabMeta[tab];
          const Icon = meta.icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{meta.label.split('(')[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Liquid Funds
                </span>
                <Building className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                {formatGHS(totalLiquidity)}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Cash Tills + MoMo + Bank Accounts
              </p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Accounts Receivable (AR)
                </span>
                <ReceiptIcon className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                {formatGHS(totalReceivables)}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1">
                14-day auction &amp; showroom debtor balances
              </p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Payables &amp; Judicial Escrow
                </span>
                <Scale className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                {formatGHS(totalPayablesAndEscrow)}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Court registrar, consignor &amp; vendor liabilities
              </p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Net Operating Margin
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                {formatGHS(netOperatingProfit)}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Revenue {formatGHS(totalRevenue)} &minus; Opex {formatGHS(totalOperatingExpenses)}
              </p>
            </div>
          </div>

          {/* Multi-Mode Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Cash on Hand (Tills)</span>
                <Banknote className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatGHS(cashTotal)}
              </p>
              <p className="text-[11px] text-slate-400">Tema Yard &amp; Spintex Showroom</p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Mobile Money (MoMo)</span>
                <Smartphone className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatGHS(momoTotal)}
              </p>
              <p className="text-[11px] text-amber-600 font-medium">MTN &bull; Telecel &bull; Hubtel Float</p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Bank Deposits / Wire</span>
                <Building className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatGHS(bankTotal)}
              </p>
              <p className="text-[11px] text-blue-600 font-medium">GCB &bull; Stanbic &bull; Ecobank Escrow</p>
            </div>

            <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Paystack / Card</span>
                <CreditCard className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatGHS(cardTotal)}
              </p>
              <p className="text-[11px] text-purple-600 font-medium">Visa &bull; Mastercard &bull; Gh-Link</p>
            </div>
          </div>

          {/* Quick Shortcuts & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liquid Float Balances */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Cash &amp; Bank Floats (General Ledger 1000s)
                </h3>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Total: {formatGHS(totalLiquidity)}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {liquidAccounts.map((acc) => (
                  <div key={acc.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                        {acc.code}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{acc.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatGHS(acc.balanceGhs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent General Ledger Postings */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Recent Journal Postings
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('GENERAL_LEDGER')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View All ({journalEntries.length}) <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {journalEntries.slice(0, 5).map((je) => (
                  <div key={je.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {je.entryNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(je.date)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 truncate max-w-xs mt-0.5">
                        {je.description}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatGHS(je.totalAmountGhs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'CHART_OF_ACCOUNTS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Account Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCoaTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    coaTypeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, title, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                icon={<PlusCircle className="h-3.5 w-3.5" />}
                onClick={() => setIsAccountModalOpen(true)}
              >
                Add Account
              </Button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Account Title</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5 text-right">Balance (GH₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {acc.code}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {acc.name}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            acc.type === 'ASSET'
                              ? 'success'
                              : acc.type === 'LIABILITY'
                              ? 'warning'
                              : acc.type === 'EQUITY'
                              ? 'info'
                              : acc.type === 'REVENUE'
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {acc.type}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {acc.category.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3.5 text-slate-500 truncate max-w-xs">
                        {acc.description}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatGHS(acc.balanceGhs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER */}
      {activeTab === 'GENERAL_LEDGER' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                General Ledger Journal Entries
              </h2>
              <p className="text-xs text-slate-500">
                Continuous double-entry journal postings with debit and credit lines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                icon={<PlusCircle className="h-3.5 w-3.5" />}
                onClick={() => setIsJournalModalOpen(true)}
              >
                Post Manual Journal Entry
              </Button>
            </div>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-3">
            {journalEntries.map((je) => (
              <div
                key={je.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {je.entryNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {formatDateTime(je.date)}
                    </span>
                    <Badge variant="success">POSTED</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500">Ref: {je.reference}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Total: {formatGHS(je.totalAmountGhs)}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {je.description}
                </p>

                {/* Lines Table */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Account</th>
                        <th className="p-2.5">Memo / Particulars</th>
                        <th className="p-2.5 text-right">Debit (GH₵)</th>
                        <th className="p-2.5 text-right">Credit (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50 font-mono text-[11px]">
                      {je.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            <span className="text-indigo-600 dark:text-indigo-400 mr-2">{l.accountCode}</span>
                            {l.accountName}
                          </td>
                          <td className="p-2.5 text-slate-500">{l.memo || '-'}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {l.debitGhs > 0 ? formatGHS(l.debitGhs) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {l.creditGhs > 0 ? formatGHS(l.creditGhs) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL REPORTS & STATEMENTS */}
      {activeTab === 'FINANCIAL_REPORTS' && (
        <div className="space-y-4">
          {/* Sub-nav for Financial Statements */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'TRIAL_BALANCE', label: 'Trial Balance' },
              { id: 'PNL', label: 'Profit & Loss (P&L)' },
              { id: 'BALANCE_SHEET', label: 'Balance Sheet' },
              { id: 'CASH_BOOK', label: 'Multi-Mode Cash Book' },
              { id: 'GRA_TAX', label: 'GRA Statutory Taxes' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setStatementSubTab(sub.id as typeof statementSubTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statementSubTab === sub.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Statement View: Trial Balance */}
          {statementSubTab === 'TRIAL_BALANCE' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                    Amen Mart General Ledger Trial Balance
                  </h3>
                  <p className="text-xs text-slate-500">
                    As at {formatDate(new Date().toISOString())} &bull; Verification of double-entry equality
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {trialBalanceDiff === 0 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle className="h-4 w-4" />
                      BOOKS BALANCED &amp; AUDIT READY
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Variance: {formatGHS(trialBalanceDiff)}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5">Code</th>
                      <th className="py-2.5">Account Title</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5 text-right">Debit (GH₵)</th>
                      <th className="py-2.5 text-right">Credit (GH₵)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {accounts.map((acc) => {
                      const isDebit = acc.type === 'ASSET' || acc.type === 'EXPENSE';
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 font-bold text-indigo-600 dark:text-indigo-400">{acc.code}</td>
                          <td className="py-2 font-sans font-medium text-slate-800 dark:text-slate-200">{acc.name}</td>
                          <td className="py-2 font-sans text-slate-400 text-[10px]">{acc.type}</td>
                          <td className="py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                            {isDebit ? formatGHS(acc.balanceGhs) : '-'}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                            {!isDebit ? formatGHS(acc.balanceGhs) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 dark:border-slate-100 font-mono font-black text-sm">
                    <tr>
                      <td colSpan={3} className="py-3 font-sans uppercase">Total Balances</td>
                      <td className="py-3 text-right text-indigo-600 dark:text-indigo-400">
                        {formatGHS(totalDebitBalances)}
                      </td>
                      <td className="py-3 text-right text-indigo-600 dark:text-indigo-400">
                        {formatGHS(totalCreditBalances)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Statement View: Profit & Loss */}
          {statementSubTab === 'PNL' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                  Income Statement (Profit &amp; Loss)
                </h3>
                <p className="text-xs text-slate-500">
                  For the period ending {formatDate(new Date().toISOString())} &bull; Currency: Ghana Cedis (GH₵)
                </p>
              </div>

              {/* Operating Revenue */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Operating Revenue
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {revenueAccounts.map((a) => (
                    <div key={a.id} className="py-2 flex justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatGHS(a.balanceGhs)}
                      </span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                    <span>Total Operating Revenue</span>
                    <span className="font-mono text-sm">{formatGHS(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Operating &amp; Administrative Expenses
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {expenseAccounts.map((a) => (
                    <div key={a.id} className="py-2 flex justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatGHS(a.balanceGhs)}
                      </span>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono text-sm">{formatGHS(totalOperatingExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold">
                <span className="uppercase text-slate-900 dark:text-slate-100 tracking-wide">
                  Net Operating Profit (EBITDA)
                </span>
                <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatGHS(netOperatingProfit)}
                </span>
              </div>
            </div>
          )}

          {/* Statement View: Balance Sheet */}
          {statementSubTab === 'BALANCE_SHEET' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                  Statement of Financial Position (Balance Sheet)
                </h3>
                <p className="text-xs text-slate-500">
                  Assets = Liabilities + Equity &bull; As at {formatDate(new Date().toISOString())}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1">
                    ASSETS
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {accounts.filter((a) => a.type === 'ASSET').map((a) => (
                      <div key={a.id} className="py-2 flex justify-between">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatGHS(a.balanceGhs)}
                        </span>
                      </div>
                    ))}
                    <div className="py-3 flex justify-between font-black text-sm text-indigo-600 dark:text-indigo-400 border-t-2 border-slate-300">
                      <span>TOTAL ASSETS</span>
                      <span className="font-mono">{formatGHS(totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b pb-1">
                    LIABILITIES &amp; EQUITY
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    <p className="font-bold text-[11px] text-slate-400 pt-1 uppercase">Liabilities</p>
                    {accounts.filter((a) => a.type === 'LIABILITY').map((a) => (
                      <div key={a.id} className="py-2 flex justify-between">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatGHS(a.balanceGhs)}
                        </span>
                      </div>
                    ))}

                    <p className="font-bold text-[11px] text-slate-400 pt-3 uppercase">Equity &amp; Reserves</p>
                    {accounts.filter((a) => a.type === 'EQUITY').map((a) => (
                      <div key={a.id} className="py-2 flex justify-between">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatGHS(a.balanceGhs)}
                        </span>
                      </div>
                    ))}
                    <div className="py-2 flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Current Year Operating Surplus</span>
                      <span className="font-mono font-bold">{formatGHS(netOperatingProfit)}</span>
                    </div>

                    <div className="py-3 flex justify-between font-black text-sm text-rose-600 dark:text-rose-400 border-t-2 border-slate-300">
                      <span>TOTAL LIABILITIES &amp; EQUITY</span>
                      <span className="font-mono">{formatGHS(totalLiabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statement View: Cash Book */}
          {statementSubTab === 'CASH_BOOK' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                  Multi-Mode Cash &amp; Bank Float Book
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time reconciliation of Till Cash, MoMo Floats, and Bank Accounts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liquidAccounts.map((acc) => (
                  <div key={acc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{acc.code}</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{acc.name}</h4>
                      </div>
                      <Badge variant="success">ACTIVE FLOAT</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{acc.description}</p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-mono">
                      <span className="text-xs text-slate-400">Current Ledger Balance:</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">{formatGHS(acc.balanceGhs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statement View: GRA Tax */}
          {statementSubTab === 'GRA_TAX' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                  Ghana Revenue Authority (GRA) Statutory Tax Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  VAT, NHIL, GETFund, COVID-19 Health Recovery Levy &amp; Withholding Tax Ledger
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-400 font-sans font-bold">GRA VAT (15%)</span>
                  <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{formatGHS(totalVat)}</p>
                  <span className="text-[10px] text-slate-500 font-sans">Standard VAT Levy (Acc 2100)</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-400 font-sans font-bold">NHIL (2.5%)</span>
                  <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{formatGHS(totalNhil)}</p>
                  <span className="text-[10px] text-slate-500 font-sans">National Health Ins. (Acc 2110)</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-400 font-sans font-bold">GETFund (2.5%)</span>
                  <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{formatGHS(totalGetfund)}</p>
                  <span className="text-[10px] text-slate-500 font-sans">Education Trust (Acc 2120)</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-400 font-sans font-bold">COVID-19 (1%)</span>
                  <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{formatGHS(totalCovid)}</p>
                  <span className="text-[10px] text-slate-500 font-sans">Health Recovery (Acc 2130)</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-400 font-sans font-bold">Withholding Tax (WHT)</span>
                  <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{formatGHS(totalWht)}</p>
                  <span className="text-[10px] text-slate-500 font-sans">3% Goods / 7.5% Serv. (Acc 2140)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: OPERATING EXPENSES (AP) */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Operating Disbursements &amp; Expenses (Accounts Payable)
              </h2>
              <p className="text-xs text-slate-500">
                Total logged: {formatGHS(totalExpenses)} across {expenses.length} disbursements
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={<PlusCircle className="h-3.5 w-3.5" />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              Record New Expense
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Expense #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Payee / Vendor</th>
                    <th className="p-3.5">Purpose</th>
                    <th className="p-3.5">Paid From</th>
                    <th className="p-3.5 text-right">Amount (GH₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {exp.expenseNumber}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(exp.date)}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {exp.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{exp.payee}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 truncate max-w-xs">{exp.description}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{exp.paidFromAccountName}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatGHS(exp.amountGhs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVOICES & BILLING */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Commercial &amp; Tax Invoices Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Official proforma &amp; settlement invoices with Ghanaian statutory taxes.
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={<PlusCircle className="h-3.5 w-3.5" />}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              Generate Commercial Invoice
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Particulars</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Balance Due</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(inv.issueDate)}</td>
                      <td className="p-3.5 font-semibold text-rose-600">{formatDate(inv.dueDate)}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{inv.customerName}</p>
                        <p className="text-[11px] text-slate-400">{inv.customerPhone}</p>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {inv.referenceTitle || 'Commercial Sale Item'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatGHS(inv.totalAmountGhs)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        {formatGHS(inv.balanceDueGhs)}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'OVERDUE'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingInvoice(inv)}
                        >
                          View / Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: RECEIPTS & SETTLEMENTS LEDGER */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Method filter */}
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'MOMO', 'CASH', 'BANK_TRANSFER', 'CARD_PAYSTACK'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setReceiptMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    receiptMethodFilter === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt, customer, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Receipts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Receipt No.</th>
                    <th className="p-4">Date &amp; Time</th>
                    <th className="p-4">Customer Particulars</th>
                    <th className="p-4">Sale Item / Lot</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4 text-right">Amount Paid</th>
                    <th className="p-4 text-right">Balance Due</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredReceipts.map((rcp) => (
                    <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rcp.receiptNumber}
                      </td>
                      <td className="p-4 text-slate-500">{formatDateTime(rcp.printedAt)}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{rcp.customerName}</p>
                        <p className="text-[11px] text-slate-400">{rcp.customerPhone}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {rcp.referenceTitle}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {rcp.referenceType}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {rcp.paymentMethod === 'MOMO' && <Smartphone className="h-3.5 w-3.5 text-amber-500" />}
                          {rcp.paymentMethod === 'CASH' && <Banknote className="h-3.5 w-3.5 text-emerald-500" />}
                          {rcp.paymentMethod === 'BANK_TRANSFER' && <Building className="h-3.5 w-3.5 text-blue-500" />}
                          {rcp.paymentMethod === 'CARD_PAYSTACK' && <CreditCard className="h-3.5 w-3.5 text-purple-500" />}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {rcp.paymentMethod}
                            {rcp.momoNetwork ? ` (${rcp.momoNetwork})` : ''}
                          </span>
                        </div>
                        {rcp.transactionReference && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Ref: {rcp.transactionReference}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatGHS(rcp.amountPaidGhs)}
                      </td>
                      <td className="p-4 text-right font-mono text-xs">
                        <span className={rcp.balanceRemainingGhs > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                          {formatGHS(rcp.balanceRemainingGhs)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingReceipt(rcp)}
                          icon={<Printer className="h-3.5 w-3.5" />}
                        >
                          Reprint
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <NewJournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={() => setIsJournalModalOpen(false)}
      />

      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => setIsExpenseModalOpen(false)}
      />

      <NewAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={() => setIsAccountModalOpen(false)}
      />

      <NewInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={() => setIsInvoiceModalOpen(false)}
      />

      {viewingInvoice && (
        <InvoiceViewerModal
          invoice={viewingInvoice}
          isOpen={true}
          onClose={() => setViewingInvoice(null)}
          onRecordPayment={() => {
            setPayingInvoice(viewingInvoice);
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {viewingReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setViewingReceipt(null)}
          title={`Official Receipt ${viewingReceipt.receiptNumber}`}
          subtitle="Ready for 80mm front-desk thermal printing or digital archiving."
          maxWidth="sm"
        >
          <ThermalReceipt receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
        </Modal>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPayingInvoice(null);
        }}
        invoice={payingInvoice || undefined}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setPayingInvoice(null);
        }}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading Accounting &amp; Finance...
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}


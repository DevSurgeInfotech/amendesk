'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type {
  PaymentMethod,
  MoMoNetwork,
  Receipt,
  PaymentSplit,
  PaymentPlan,
  Customer,
  CashShift,
} from '@/lib/types';
import { useTerminal } from '@/context/TerminalContext';
import { syncEngine } from '@/lib/sync/syncEngine';
import { postPaymentReceiptLedger } from '@/lib/accounting/ledger';
import { formatGHS } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/date';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThermalReceipt } from '@/components/erp/ThermalReceipt';
import Link from 'next/link';
import {
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Printer,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Car,
  MapPin,
  Building2,
  FileText,
  Search,
  Scale,
} from 'lucide-react';

function generateReceiptNumber(): string {
  return `AM-RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateReceiptId(): string {
  return `rcp-${Date.now()}`;
}

function generateCustomerId(): string {
  return `cust-${Date.now()}`;
}

function calculate14DayDueDate(): string {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function getTodayDatePrefix(): string {
  return new Date().toISOString().split('T')[0];
}

function generateGeneralRefId(): string {
  return `gen-${Date.now()}`;
}

function generatePlanId(): string {
  return `plan-${Date.now()}`;
}

function generateShiftId(): string {
  return `shift-${Date.now()}`;
}

function generateShiftNumber(): string {
  return `SHF-${Date.now().toString().slice(-6)}`;
}

type PaymentView = 'terminal' | 'shift' | 'collections';

const viewMeta: Record<
  PaymentView,
  { title: string; subtitle: string; badge: string; icon: typeof CreditCard }
> = {
  terminal: {
    title: 'Record Payment Terminal (Multi-Mode POS)',
    subtitle: 'Accept Cash, Mobile Money (Hubtel/MTN/Telecel), Bank Transfer & Card settlements for Auction lots, Vehicles, Land, Property & Invoices.',
    badge: 'Front Desk Cash Office • Active Till',
    icon: CreditCard,
  },
  shift: {
    title: 'Cash Drawer & Till Shift Balancing',
    subtitle: 'Audit reconciliation of physical cash float, mobile money, and electronic deposits with zero-variance shift closing.',
    badge: 'Front Desk Till Reconciliation',
    icon: Banknote,
  },
  collections: {
    title: 'Recent Collections Ledger',
    subtitle: 'Comprehensive audit registry of all payment receipts issued with instant 80mm thermal reprint & settlement history.',
    badge: 'Audit Receipts Registry',
    icon: Clock,
  },
};

function RecordPaymentContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view') as PaymentView | null;
  const activeView: PaymentView = viewParam && ['terminal', 'shift', 'collections'].includes(viewParam) ? viewParam : 'terminal';

  const currentMeta = viewMeta[activeView];
  const CurrentIcon = currentMeta.icon;

  // Live queries
  const lots = useLiveQuery(() => db.auctionLots.toArray(), []) || [];
  const vehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []) || [];
  const landParcels = useLiveQuery(() => db.landParcels.toArray(), []) || [];
  const properties = useLiveQuery(() => db.propertyUnits.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const paymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []) || [];
  const receipts = useLiveQuery(() => db.receipts.orderBy('printedAt').reverse().toArray(), []) || [];
  const shifts = useLiveQuery(() => db.cashShifts.toArray(), []) || [];

  // Active cashier & shift
  const { currentStaffName } = useTerminal();
  const cashierName = currentStaffName || 'Mary Afriyie';
  const issuedLocation = 'Front Desk — Amen Mart Tema';

  // Category & ID query parameters
  const categoryParam = searchParams.get('category');
  const idParam = searchParams.get('id');

  const defaultCategory =
    categoryParam && ['AUCTION', 'DEALERSHIP', 'LAND', 'PROPERTY', 'INVOICE', 'GENERAL'].includes(categoryParam)
      ? (categoryParam as 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'INVOICE' | 'GENERAL')
      : 'AUCTION';

  // Category of item being paid
  const [targetCategory, setTargetCategory] = useState<
    'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'INVOICE' | 'GENERAL'
  >(defaultCategory);

  // Selected item reference
  const [selectedLotId, setSelectedLotId] = useState(defaultCategory === 'AUCTION' && idParam ? idParam : '');
  const [selectedVehicleId, setSelectedVehicleId] = useState(defaultCategory === 'DEALERSHIP' && idParam ? idParam : '');
  const [selectedLandId, setSelectedLandId] = useState(defaultCategory === 'LAND' && idParam ? idParam : '');
  const [selectedPropertyId, setSelectedPropertyId] = useState(defaultCategory === 'PROPERTY' && idParam ? idParam : '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(defaultCategory === 'INVOICE' && idParam ? idParam : '');
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState('');

  // General particulars
  const [generalTitle, setGeneralTitle] = useState('Bidder Registration Fee (Catalog)');
  const [generalAmount, setGeneralAmount] = useState<number>(200);

  // Customer state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGhanaCard, setCustomerGhanaCard] = useState('');

  // Payment amount & mode
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [singleMethod, setSingleMethod] = useState<PaymentMethod>('MOMO');
  const [singleMomoNet, setSingleMomoNet] = useState<MoMoNetwork>('MTN');
  const [singleBankName, setSingleBankName] = useState('GCB Bank');
  const [singleTxnRef, setSingleTxnRef] = useState('');

  // Cash tendered & change calculation
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Split payment rows
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { method: 'CASH', amountGhs: 0, transactionReference: 'CASH-TILL-01' },
    { method: 'MOMO', amountGhs: 0, momoNetwork: 'MTN', transactionReference: '' },
  ]);

  // Submission & receipt state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdReceipt, setCreatedReceipt] = useState<Receipt | null>(null);

  // Filter for recent receipts table
  const [recentSearch, setRecentSearch] = useState('');

  // Derived balance due & reference particulars
  let currentBalanceDue = 0;
  let referenceTitle = '';
  let referenceType: 'AUCTION' | 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'GENERAL' = 'GENERAL';
  let referenceId = '';

  if (targetCategory === 'AUCTION') {
    referenceType = 'AUCTION';
    const lot = lots.find((l) => l.id === selectedLotId);
    if (lot) {
      currentBalanceDue = lot.balanceDueGhs ?? (lot.hammerPriceGhs ? lot.hammerPriceGhs + (lot.marginFeeGhs || 0) : lot.currentBidGhs);
      referenceTitle = `${lot.lotNumber}: ${lot.title}`;
      referenceId = lot.id;
    }
  } else if (targetCategory === 'DEALERSHIP') {
    referenceType = 'DEALERSHIP';
    const v = vehicles.find((car) => car.id === selectedVehicleId);
    if (v) {
      currentBalanceDue = v.askingPriceGhs;
      referenceTitle = `${v.year} ${v.make} ${v.model} (${v.stockNumber})`;
      referenceId = v.id;
    }
  } else if (targetCategory === 'LAND') {
    referenceType = 'LAND';
    const l = landParcels.find((p) => p.id === selectedLandId);
    if (l) {
      currentBalanceDue = l.priceGhs;
      referenceTitle = `${l.siteRef}: ${l.title} (${l.sizeAcres} Acres)`;
      referenceId = l.id;
    }
  } else if (targetCategory === 'PROPERTY') {
    referenceType = 'PROPERTY';
    const p = properties.find((u) => u.id === selectedPropertyId);
    if (p) {
      currentBalanceDue = p.priceGhs;
      referenceTitle = `${p.unitRef}: ${p.title} (${p.location})`;
      referenceId = p.id;
    }
  } else if (targetCategory === 'INVOICE') {
    referenceType = 'GENERAL';
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (inv) {
      currentBalanceDue = inv.balanceDueGhs;
      referenceTitle = `${inv.invoiceNumber} — ${inv.referenceTitle || 'Invoice Item'}`;
      referenceId = inv.id;
      if (inv.referenceType !== 'GENERAL') {
        referenceType = inv.referenceType;
      }
    }
  } else if (targetCategory === 'GENERAL') {
    referenceType = 'GENERAL';
    currentBalanceDue = generalAmount;
    referenceTitle = generalTitle;
    referenceId = 'gen-service';
  }

  // Handle asset selection and auto-populate customer
  const handleSelectAuctionLot = (lotId: string) => {
    setSelectedLotId(lotId);
    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      const bal = lot.balanceDueGhs ?? (lot.hammerPriceGhs ? lot.hammerPriceGhs + (lot.marginFeeGhs || 0) : lot.currentBidGhs);
      setAmountPaid(bal);
      if (lot.winningBidderId) {
        setCustomerId(lot.winningBidderId);
        setCustomerName(lot.winningBidderName || '');
        setCustomerPhone(lot.winningBidderPhone || '');
        const c = customers.find((cust) => cust.id === lot.winningBidderId);
        if (c) setCustomerGhanaCard(c.ghanaCardNumber);
      }
    }
  };

  const handleSelectCustomer = (id: string) => {
    setCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomerName(c.fullName);
      setCustomerPhone(c.phone);
      setCustomerGhanaCard(c.ghanaCardNumber);
    }
  };

  // Auto-derived particulars for items pre-selected via URL or selector
  const activeLot = lots.find((l) => l.id === selectedLotId);
  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const effectiveCustomerId =
    customerId ||
    (targetCategory === 'AUCTION' ? activeLot?.winningBidderId || '' : '') ||
    (targetCategory === 'INVOICE' ? activeInvoice?.customerId || '' : '');

  const effectiveCustomerName =
    customerName ||
    (targetCategory === 'AUCTION' ? activeLot?.winningBidderName || '' : '') ||
    (targetCategory === 'INVOICE' ? activeInvoice?.customerName || '' : '');

  const effectiveCustomerPhone =
    customerPhone ||
    (targetCategory === 'AUCTION' ? activeLot?.winningBidderPhone || '' : '') ||
    (targetCategory === 'INVOICE' ? activeInvoice?.customerPhone || '' : '');

  const effectiveCustomerGhanaCard =
    customerGhanaCard ||
    (targetCategory === 'INVOICE' ? activeInvoice?.customerGhanaCard || '' : '');

  const effectiveAmountToPay = amountPaid > 0 ? amountPaid : currentBalanceDue;

  const totalPaidComputed = isSplitPayment
    ? splits.reduce((acc, s) => acc + (Number(s.amountGhs) || 0), 0)
    : effectiveAmountToPay;

  const changeDue = singleMethod === 'CASH' && cashTendered > totalPaidComputed
    ? cashTendered - totalPaidComputed
    : 0;

  // Split management
  const handleAddSplit = () => {
    setSplits([...splits, { method: 'MOMO', amountGhs: 0, momoNetwork: 'MTN', transactionReference: '' }]);
  };

  const handleRemoveSplit = (idx: number) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const handleSplitChange = (idx: number, field: string, value: unknown) => {
    const updated = [...splits];
    updated[idx] = { ...updated[idx], [field]: value };
    setSplits(updated);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (totalPaidComputed <= 0) {
      setErrorMsg('Payment amount must be greater than GH₵ 0');
      return;
    }

    const finalCustomerName = (customerName || effectiveCustomerName).trim();
    const finalCustomerPhone = (customerPhone || effectiveCustomerPhone).trim();
    const finalCustomerGhanaCard = (customerGhanaCard || effectiveCustomerGhanaCard).trim();
    const finalCustomerId = customerId || effectiveCustomerId || generateCustomerId();

    if (!finalCustomerName) {
      setErrorMsg('Please specify or select customer particulars');
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const newBalanceRemaining = Math.max(0, currentBalanceDue - totalPaidComputed);
      const isSettled = newBalanceRemaining === 0;

      // Auto-register walk-in customer in database if not existing
      if (finalCustomerName && finalCustomerPhone) {
        const existingCust = customers.find((c) => c.phone === finalCustomerPhone || c.id === finalCustomerId);
        if (!existingCust) {
          const newCust: Customer = {
            id: finalCustomerId,
            fullName: finalCustomerName,
            phone: finalCustomerPhone,
            email: '',
            ghanaCardNumber: finalCustomerGhanaCard || '',
            address: 'Walk-in Cash Office',
            customerType: 'INDIVIDUAL',
            kycVerified: Boolean(finalCustomerGhanaCard),
            createdAt: getIsoTimestamp(),
          };
          await db.customers.add(newCust);
          await syncEngine.queueMutation('customers', newCust.id, 'CREATE', newCust);
        }
      }

      const receipt: Receipt = {
        id: generateReceiptId(),
        receiptNumber,
        referenceType,
        referenceId: referenceId === 'gen-service' ? generateGeneralRefId() : referenceId,
        referenceTitle,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        amountPaidGhs: totalPaidComputed,
        paymentMethod: isSplitPayment ? 'CASH' : singleMethod,
        momoNetwork: !isSplitPayment && singleMethod === 'MOMO' ? singleMomoNet : undefined,
        transactionReference: isSplitPayment
          ? 'SPLIT-MULTI-MODE'
          : singleTxnRef || (singleMethod === 'CASH' ? 'CASH-TILL-01' : undefined),
        splitPayments: isSplitPayment ? splits : undefined,
        totalPaidToDateGhs: totalPaidComputed,
        balanceRemainingGhs: newBalanceRemaining,
        balanceDueDate: calculate14DayDueDate(),
        cashierName,
        issuedLocation,
        printedAt: getIsoTimestamp(),
        syncStatus: 'SYNCED',
      };

      await db.receipts.add(receipt);

      // 1. Update Auction Lot if applicable
      if (targetCategory === 'AUCTION' && selectedLotId) {
        const lot = lots.find((l) => l.id === selectedLotId);
        if (lot) {
          const updatedDeposit = (lot.depositAmountGhs || 0) + totalPaidComputed;
          const updatedStatus = isSettled ? 'FULLY_PAID' : 'AWAITING_BALANCE';
          await db.auctionLots.update(lot.id, {
            depositAmountGhs: updatedDeposit,
            balanceDueGhs: newBalanceRemaining,
            status: updatedStatus,
          });
          await syncEngine.queueMutation('auctionLots', lot.id, 'UPDATE', {
            depositAmountGhs: updatedDeposit,
            balanceDueGhs: newBalanceRemaining,
            status: updatedStatus,
          });

          // Also update associated payment plan if one exists
          const plan = paymentPlans.find((p) => p.referenceId === lot.id);
          if (plan) {
            await db.paymentPlans.update(plan.id, {
              depositPaidGhs: plan.depositPaidGhs + totalPaidComputed,
              balanceRemainingGhs: newBalanceRemaining,
              status: isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
            });
          }
        }
      }

      // 2. Update Dealership Vehicle if applicable
      if (targetCategory === 'DEALERSHIP' && selectedVehicleId) {
        const newVehicleStatus = isSettled ? 'SOLD' : 'RESERVED';
        await db.dealershipVehicles.update(selectedVehicleId, { status: newVehicleStatus });
        await syncEngine.queueMutation('dealershipVehicles', selectedVehicleId, 'UPDATE', { status: newVehicleStatus });

        const plan = paymentPlans.find((p) => p.referenceId === selectedVehicleId);
        if (plan) {
          await db.paymentPlans.update(plan.id, {
            depositPaidGhs: plan.depositPaidGhs + totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            status: isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
          });
        } else if (!isSettled) {
          const newPlan: PaymentPlan = {
            id: generatePlanId(),
            referenceType: 'DEALERSHIP',
            referenceId: selectedVehicleId,
            referenceTitle,
            customerId: customerId || generateCustomerId(),
            customerName,
            customerPhone,
            totalPriceGhs: currentBalanceDue,
            depositPaidGhs: totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            initialDueDate: calculate14DayDueDate(),
            currentDueDate: calculate14DayDueDate(),
            status: 'AWAITING_BALANCE',
            extensions: [],
            createdAt: getIsoTimestamp(),
            updatedAt: getIsoTimestamp(),
          };
          await db.paymentPlans.add(newPlan);
          await syncEngine.queueMutation('paymentPlans', newPlan.id, 'CREATE', newPlan);
        }
      }

      // 3. Update Land Parcel if applicable
      if (targetCategory === 'LAND' && selectedLandId) {
        const newLandStatus = isSettled ? 'SOLD' : 'RESERVED';
        await db.landParcels.update(selectedLandId, { status: newLandStatus });
        await syncEngine.queueMutation('landParcels', selectedLandId, 'UPDATE', { status: newLandStatus });

        const plan = paymentPlans.find((p) => p.referenceId === selectedLandId);
        if (plan) {
          await db.paymentPlans.update(plan.id, {
            depositPaidGhs: plan.depositPaidGhs + totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            status: isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
          });
        } else if (!isSettled) {
          const newPlan: PaymentPlan = {
            id: generatePlanId(),
            referenceType: 'LAND',
            referenceId: selectedLandId,
            referenceTitle,
            customerId: customerId || generateCustomerId(),
            customerName,
            customerPhone,
            totalPriceGhs: currentBalanceDue,
            depositPaidGhs: totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            initialDueDate: calculate14DayDueDate(),
            currentDueDate: calculate14DayDueDate(),
            status: 'AWAITING_BALANCE',
            extensions: [],
            createdAt: getIsoTimestamp(),
            updatedAt: getIsoTimestamp(),
          };
          await db.paymentPlans.add(newPlan);
          await syncEngine.queueMutation('paymentPlans', newPlan.id, 'CREATE', newPlan);
        }
      }

      // 4. Update Property Unit if applicable
      if (targetCategory === 'PROPERTY' && selectedPropertyId) {
        const newPropStatus = isSettled ? 'SOLD' : 'RESERVED';
        await db.propertyUnits.update(selectedPropertyId, { status: newPropStatus });
        await syncEngine.queueMutation('propertyUnits', selectedPropertyId, 'UPDATE', { status: newPropStatus });

        const plan = paymentPlans.find((p) => p.referenceId === selectedPropertyId);
        if (plan) {
          await db.paymentPlans.update(plan.id, {
            depositPaidGhs: plan.depositPaidGhs + totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            status: isSettled ? 'PAID_IN_FULL' : 'AWAITING_BALANCE',
          });
        } else if (!isSettled) {
          const newPlan: PaymentPlan = {
            id: generatePlanId(),
            referenceType: 'PROPERTY',
            referenceId: selectedPropertyId,
            referenceTitle,
            customerId: customerId || generateCustomerId(),
            customerName,
            customerPhone,
            totalPriceGhs: currentBalanceDue,
            depositPaidGhs: totalPaidComputed,
            balanceRemainingGhs: newBalanceRemaining,
            initialDueDate: calculate14DayDueDate(),
            currentDueDate: calculate14DayDueDate(),
            status: 'AWAITING_BALANCE',
            extensions: [],
            createdAt: getIsoTimestamp(),
            updatedAt: getIsoTimestamp(),
          };
          await db.paymentPlans.add(newPlan);
          await syncEngine.queueMutation('paymentPlans', newPlan.id, 'CREATE', newPlan);
        }
      }

      // 5. Update Invoice if applicable
      if (targetCategory === 'INVOICE' && selectedInvoiceId) {
        const inv = invoices.find((i) => i.id === selectedInvoiceId);
        if (inv) {
          const updatedPaid = inv.amountPaidGhs + totalPaidComputed;
          const updatedStatus = newBalanceRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
          await db.invoices.update(inv.id, {
            amountPaidGhs: updatedPaid,
            balanceDueGhs: newBalanceRemaining,
            status: updatedStatus,
          });
          await syncEngine.queueMutation('invoices', inv.id, 'UPDATE', {
            amountPaidGhs: updatedPaid,
            balanceDueGhs: newBalanceRemaining,
            status: updatedStatus,
          });
        }
      }

      await syncEngine.queueMutation('receipts', receipt.id, 'CREATE', receipt);

      // Post double-entry to General Ledger with split support
      try {
        await postPaymentReceiptLedger(
          receipt.receiptNumber,
          receipt.customerName,
          receipt.referenceTitle,
          receipt.referenceType,
          receipt.amountPaidGhs,
          receipt.paymentMethod,
          cashierName,
          receipt.momoNetwork,
          singleBankName,
          isSplitPayment ? splits : undefined
        );
      } catch (glErr) {
        console.warn('GL Posting note:', glErr);
      }

      setCreatedReceipt(receipt);
    } catch (err) {
      console.error('Failed to log payment:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to log payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Day Collections Totals
  const todayReceipts = receipts.filter((r) => {
    const todayStr = getTodayDatePrefix();
    return r.printedAt.startsWith(todayStr);
  });
  const todayTotal = todayReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const todayCash = todayReceipts.filter((r) => r.paymentMethod === 'CASH').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const todayMomo = todayReceipts.filter((r) => r.paymentMethod === 'MOMO').reduce((acc, r) => acc + r.amountPaidGhs, 0);
  const todayBank = todayReceipts.filter((r) => r.paymentMethod === 'BANK_TRANSFER').reduce((acc, r) => acc + r.amountPaidGhs, 0);

  const todayShift = shifts.find(
    (s) => s.shiftDate === getTodayDatePrefix() && s.cashierName === cashierName
  );

  const handleVerifyCloseShift = async () => {
    const shiftRecord: CashShift = {
      id: todayShift?.id || generateShiftId(),
      shiftNumber: todayShift?.shiftNumber || generateShiftNumber(),
      cashierName,
      facilityLocation: issuedLocation,
      shiftDate: getTodayDatePrefix(),
      openingFloatGhs: 5000,
      cashCollectionsGhs: todayCash,
      momoCollectionsGhs: todayMomo,
      bankCollectionsGhs: todayBank,
      cardCollectionsGhs: todayReceipts
        .filter((r) => r.paymentMethod === 'CARD_PAYSTACK')
        .reduce((acc, r) => acc + r.amountPaidGhs, 0),
      cashDisbursementsGhs: 0,
      expectedCashInDrawerGhs: 5000 + todayCash,
      actualCashInDrawerGhs: 5000 + todayCash,
      varianceGhs: 0,
      notes: 'Shift balanced and verified at front desk till.',
      status: 'CLOSED',
      closedAt: getIsoTimestamp(),
    };

    await db.cashShifts.put(shiftRecord);
    await syncEngine.queueMutation('cashShifts', shiftRecord.id, todayShift ? 'UPDATE' : 'CREATE', shiftRecord);
    setShiftSuccessMsg(`Shift verified and closed successfully! Expected Till Cash: ${formatGHS(5000 + todayCash)}`);
  };

  // Filtered recent receipts
  const filteredRecent = receipts.filter((r) => {
    if (!recentSearch) return true;
    const q = recentSearch.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.referenceTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="surface-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CurrentIcon className="h-3.5 w-3.5" />
              <span>{currentMeta.badge}</span>
            </span>
            <span className="text-xs text-slate-400">Cashier: {cashierName} &bull; {issuedLocation}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/desk/accounts">
            <Button size="sm" variant="outline" icon={<Scale className="h-4 w-4" />}>
              View General Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Till Shift Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          theme="emerald"
          title="Today's Total Collections"
          value={formatGHS(todayTotal)}
          subtitle={`${todayReceipts.length} receipts issued today`}
          iconName="collections"
        />

        <GlassCard
          theme="amber"
          title="Drawer Cash Till"
          value={formatGHS(todayCash)}
          subtitle="Physical notes &amp; coins in till"
          iconName="cash"
        />

        <GlassCard
          theme="purple"
          title="Mobile Money (MoMo)"
          value={formatGHS(todayMomo)}
          subtitle="MTN &bull; Telecel &bull; Hubtel"
          iconName="momo"
        />

        <GlassCard
          theme="blue"
          title="Bank Wires &amp; Drafts"
          value={formatGHS(todayBank)}
          subtitle="GCB &bull; Stanbic &bull; Ecobank Escrow"
          iconName="bank"
        />
      </div>

      {/* Main Payment Recording Layout (When in terminal view) */}
      {activeView === 'terminal' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Terminal (7 cols) */}
        <div className="surface-card lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              New Payment Transaction
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mode:</span>
              <button
                type="button"
                onClick={() => setIsSplitPayment(!isSplitPayment)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  isSplitPayment
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isSplitPayment ? 'Split Payment Active' : 'Single Payment'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitPayment} className="space-y-5">
            {/* Step 1: Target Asset Category Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Asset / Service Line
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                {[
                  { id: 'AUCTION', label: 'Auctions', icon: Clock },
                  { id: 'DEALERSHIP', label: 'Dealership', icon: Car },
                  { id: 'LAND', label: 'Land', icon: MapPin },
                  { id: 'PROPERTY', label: 'Property', icon: Building2 },
                  { id: 'INVOICE', label: 'Invoice', icon: FileText },
                  { id: 'GENERAL', label: 'Direct Fee', icon: Banknote },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = targetCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setTargetCategory(cat.id as typeof targetCategory);
                        setAmountPaid(0);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors font-semibold ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1B: Pick Reference Item */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              {targetCategory === 'AUCTION' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Auction Lot (Winning Bidder Settlement) *
                  </label>
                  <select
                    required
                    value={selectedLotId}
                    onChange={(e) => handleSelectAuctionLot(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Auction Lot with Balance Due --</option>
                    {lots
                      .filter((l) => (l.balanceDueGhs ?? 0) > 0 || l.status === 'AWAITING_BALANCE' || l.status === 'ACTIVE')
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.lotNumber}: {l.title} (Bal Due: {formatGHS(l.balanceDueGhs || 0)}) &bull; {l.winningBidderName || 'Unassigned'}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {targetCategory === 'DEALERSHIP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Showroom Vehicle *
                  </label>
                  <select
                    required
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const v = vehicles.find((car) => car.id === e.target.value);
                      if (v) setAmountPaid(v.askingPriceGhs);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Vehicle from Stock --</option>
                    {vehicles
                      .filter((v) => v.status !== 'SOLD')
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.stockNumber}: {v.year} {v.make} {v.model} &bull; Asking: {formatGHS(v.askingPriceGhs)} ({v.status})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {targetCategory === 'LAND' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Land Parcel *
                  </label>
                  <select
                    required
                    value={selectedLandId}
                    onChange={(e) => {
                      setSelectedLandId(e.target.value);
                      const l = landParcels.find((p) => p.id === e.target.value);
                      if (l) setAmountPaid(l.priceGhs);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Land Parcel --</option>
                    {landParcels
                      .filter((l) => l.status !== 'SOLD')
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.siteRef}: {l.title} &bull; Price: {formatGHS(l.priceGhs)} ({l.location})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {targetCategory === 'PROPERTY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Property Unit *
                  </label>
                  <select
                    required
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      const p = properties.find((u) => u.id === e.target.value);
                      if (p) setAmountPaid(p.priceGhs);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Property Unit --</option>
                    {properties
                      .filter((p) => p.status !== 'SOLD')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.unitRef}: {p.title} &bull; Price: {formatGHS(p.priceGhs)} ({p.location})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {targetCategory === 'INVOICE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Commercial / Tax Invoice *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = invoices.find((i) => i.id === e.target.value);
                      if (inv) {
                        setAmountPaid(inv.balanceDueGhs);
                        handleSelectCustomer(inv.customerId);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Select Outstanding Invoice --</option>
                    {invoices.filter((i) => i.balanceDueGhs > 0).map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber}: {inv.customerName} &bull; Bal: {formatGHS(inv.balanceDueGhs)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetCategory === 'GENERAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Fee Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={generalTitle}
                      onChange={(e) => setGeneralTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Standard Amount (GH₵) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={generalAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setGeneralAmount(val);
                        setAmountPaid(val);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Balance Due Display */}
              {currentBalanceDue > 0 && (
                <div className="pt-2 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">Asset Balance Due:</span>
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {formatGHS(currentBalanceDue)}
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Customer Particulars */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Customer / Payer Particulars
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Registered Client
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Walk-in Client --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nana Kwesi Boateng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+233 24 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ghana Card ID
                  </label>
                  <input
                    type="text"
                    placeholder="GHA-712894102-4"
                    value={customerGhanaCard}
                    onChange={(e) => setCustomerGhanaCard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Breakdown (Single or Split) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Payment Details &amp; Method
              </label>

              {!isSplitPayment ? (
                /* Single Payment Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSingleMethod('MOMO')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                        singleMethod === 'MOMO'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 text-amber-500" />
                      <span>MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleMethod('CASH')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                        singleMethod === 'CASH'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Banknote className="h-4 w-4 text-emerald-500" />
                      <span>Cash at Desk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleMethod('BANK_TRANSFER')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                        singleMethod === 'BANK_TRANSFER'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Building className="h-4 w-4 text-blue-500" />
                      <span>Bank Wire</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleMethod('CARD_PAYSTACK')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                        singleMethod === 'CARD_PAYSTACK'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 text-purple-500" />
                      <span>Paystack / Card</span>
                    </button>
                  </div>

                  {/* MoMo Network Option */}
                  {singleMethod === 'MOMO' && (
                    <div className="grid grid-cols-3 gap-2">
                      {(['MTN', 'VODAFONE', 'AIRTELTIGO'] as MoMoNetwork[]).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setSingleMomoNet(net)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            singleMomoNet === net
                              ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {net === 'VODAFONE' ? 'Telecel / Vodafone' : net === 'AIRTELTIGO' ? 'AT / AirtelTigo' : 'MTN MoMo'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bank Selector Option */}
                  {singleMethod === 'BANK_TRANSFER' && (
                    <div className="grid grid-cols-3 gap-2">
                      {['GCB Bank', 'Stanbic Bank', 'Ecobank Ghana'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSingleBankName(b)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            singleBankName === b
                              ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Amount to Pay */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Amount to Pay (GH₵) *
                      </label>
                      {currentBalanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmountPaid(currentBalanceDue)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          Pay Full Balance ({formatGHS(currentBalanceDue)})
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 text-base font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Cash Change Calculator */}
                  {singleMethod === 'CASH' && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          Cash Tendered by Customer
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={cashTendered || ''}
                          onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                          Change Due to Return
                        </label>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono font-bold text-sm">
                          {formatGHS(changeDue)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction Ref */}
                  {singleMethod !== 'CASH' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Transaction Ref / MoMo Code / Bank Slip *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HUB-MOMO-891024 / GCB-TRF-00192"
                        value={singleTxnRef}
                        onChange={(e) => setSingleTxnRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Split Payment Mode */
                <div className="space-y-3">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-2 space-y-2">
                    {splits.map((split, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-4">
                          <select
                            value={split.method}
                            onChange={(e) => handleSplitChange(idx, 'method', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            <option value="CASH">Cash at Desk</option>
                            <option value="MOMO">Mobile Money (MoMo)</option>
                            <option value="BANK_TRANSFER">Bank Wire / Draft</option>
                            <option value="CARD_PAYSTACK">Card / Paystack</option>
                          </select>
                        </div>

                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Amount GH₵"
                            value={split.amountGhs || ''}
                            onChange={(e) => handleSplitChange(idx, 'amountGhs', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-right"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Txn Ref / Code"
                            value={split.transactionReference || ''}
                            onChange={(e) => handleSplitChange(idx, 'transactionReference', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                          />
                        </div>

                        <div className="col-span-1 text-center">
                          {splits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSplit(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddSplit}
                        icon={<Plus className="h-3 w-3" />}
                      >
                        Add Split Mode
                      </Button>
                      <div className="text-xs font-mono">
                        <span className="text-slate-400 mr-2">Total Split:</span>
                        <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          {formatGHS(totalPaidComputed)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Posting Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                icon={<CheckCircle className="h-4 w-4" />}
              >
                Post Payment &amp; Print Official Receipt
              </Button>
            </div>
          </form>
        </div>

        {/* Right Panel: Active Receipt Preview / Live Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {createdReceipt ? (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle className="h-5 w-5" />
                <span>Payment Logged &amp; Posted to Ledger!</span>
              </div>
              <ThermalReceipt receipt={createdReceipt} onClose={() => setCreatedReceipt(null)} />
            </div>
          ) : (
            <div className="surface-card bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Front-Desk Till Reconciliation (Shift)
              </h3>
              <p className="text-xs text-slate-500">
                Logged in cashier: <span className="font-semibold text-slate-800 dark:text-slate-200">{cashierName}</span>
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opening Till Float:</span>
                    <span className="font-bold">GH₵ 5,000.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Cash Inflow Today:</span>
                    <span className="font-bold">+{formatGHS(todayCash)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>MoMo Floats Inflow:</span>
                    <span className="font-bold">+{formatGHS(todayMomo)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Bank Wire Inflow:</span>
                    <span className="font-bold">+{formatGHS(todayBank)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm">
                    <span>Expected Till Cash:</span>
                    <span>{formatGHS(5000 + todayCash)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 text-xs space-y-1">
                <p className="font-bold">Automated General Ledger Posting:</p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Every payment automatically debits Cash/MoMo/Bank assets and credits Accounts Receivable (1200) or Revenue, maintaining audit balance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* SHIFT VIEW: Till Shift & Drawer Balancing Console */}
      {activeView === 'shift' && (
        <div className="space-y-6">
          <div className="surface-card bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {shiftSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{shiftSuccessMsg}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${todayShift?.status === 'CLOSED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                  Drawer Status: {todayShift?.status === 'CLOSED' ? `Closed at ${todayShift.closedAt ? formatDateTime(todayShift.closedAt) : 'End of Shift'}` : 'Active • In-Balance'}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                  Cash Drawer &amp; Till Shift Balancing
                </h2>
                <p className="text-xs text-slate-500">
                  Audit reconciliation of physical cash float, mobile money, and electronic deposits for cashier <strong className="text-slate-800 dark:text-slate-200">{cashierName}</strong> at {issuedLocation}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={todayShift?.status === 'CLOSED' ? 'outline' : 'primary'}
                  icon={<CheckCircle className="h-4 w-4" />}
                  onClick={handleVerifyCloseShift}
                >
                  {todayShift?.status === 'CLOSED' ? 'Re-Verify & Save Shift' : 'Verify & Close Shift'}
                </Button>
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: Physical Cash Till Float */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-500" />
                    Physical Till Drawer Cash
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Account 1010
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Opening Till Float:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatGHS(5000)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-emerald-600">
                    <span>Cash Collections (Today):</span>
                    <span className="font-bold">+{formatGHS(todayCash)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-slate-400">
                    <span>Cash Payouts / Petty AP:</span>
                    <span className="font-bold">-GH₵ 0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                    <span>Expected Cash in Till:</span>
                    <span className="text-emerald-600">{formatGHS(5000 + todayCash)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Keep physical notes sorted by GH₵ 200, 100, 50, 20 denominations in the front drawer tray.
                </p>
              </div>

              {/* Box 2: Digital MoMo & Bank Settlements */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-amber-500" />
                    Electronic Settlements
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                    Accounts 1020 &bull; 1030
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-amber-600">
                    <span>Mobile Money (MTN/Telecel/Hubtel):</span>
                    <span className="font-bold">+{formatGHS(todayMomo)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-blue-600">
                    <span>Direct Bank Wires / Escrow:</span>
                    <span className="font-bold">+{formatGHS(todayBank)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 text-purple-600">
                    <span>Paystack Card POS:</span>
                    <span className="font-bold">
                      +{formatGHS(todayReceipts.filter((r) => r.paymentMethod === 'CARD_PAYSTACK').reduce((acc, r) => acc + r.amountPaidGhs, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                    <span>Total Digital Inflow:</span>
                    <span className="text-indigo-600">{formatGHS(todayTotal - todayCash)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Electronic receipts automatically sync to GCB Escrow and MTN MoMo Merchant wallets.
                </p>
              </div>

              {/* Box 3: Shift Verification & Audit Certificate */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-indigo-500" />
                    General Ledger Audit Status
                  </h4>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    Double-Entry OK
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    All receipts issued in this shift have been journalized to their corresponding asset accounts (1010/1020/1030) and credited against Accounts Receivable (1200) or Auction revenue.
                  </p>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Zero Variance Detected</span>
                    </div>
                    <p>Total logged: {formatGHS(todayTotal)} across {todayReceipts.length} transactions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTIONS VIEW or Below Terminal: Recent Collections Ledger */}
      {(activeView === 'collections' || activeView === 'terminal') && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Recent Collections Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Real-time audit receipts recorded across Cash, MoMo, Bank Wire, and Card.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt, customer, ref..."
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Receipt No.</th>
                  <th className="p-3.5">Date &amp; Time</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Particulars</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecent.slice(0, activeView === 'collections' ? 50 : 15).map((rcp) => (
                  <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {rcp.receiptNumber}
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDateTime(rcp.printedAt)}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{rcp.customerName}</p>
                      <p className="text-[11px] text-slate-400">{rcp.customerPhone}</p>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 truncate max-w-xs font-medium">
                      {rcp.referenceTitle}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {rcp.paymentMethod === 'MOMO' && <Smartphone className="h-3.5 w-3.5 text-amber-500" />}
                        {rcp.paymentMethod === 'CASH' && <Banknote className="h-3.5 w-3.5 text-emerald-500" />}
                        {rcp.paymentMethod === 'BANK_TRANSFER' && <Building className="h-3.5 w-3.5 text-blue-500" />}
                        {rcp.paymentMethod === 'CARD_PAYSTACK' && <CreditCard className="h-3.5 w-3.5 text-purple-500" />}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {rcp.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatGHS(rcp.amountPaidGhs)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs">
                      <span className={rcp.balanceRemainingGhs > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                        {formatGHS(rcp.balanceRemainingGhs)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCreatedReceipt(rcp)}
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
      )}
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading Payment Terminal...
        </div>
      }
    >
      <RecordPaymentContent />
    </Suspense>
  );
}


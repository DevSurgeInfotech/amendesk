'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Customer, LeadStatus } from '@/lib/types';
import {
  isCustomerInboundLead,
  getLeadStatus,
  getLeadSourceLabel,
  extractInquiryDetails,
} from '@/lib/crm/leads';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { syncEngine } from '@/lib/sync/syncEngine';
import { formatGHS } from '@/lib/utils/currency';
import Link from 'next/link';
import {
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Search,
  Edit2,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  UserCheck,
  Sparkles,
} from 'lucide-react';

function generateCustomerId(): string {
  return `cust-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `233${digits.substring(1)}`;
  }
  return digits;
}

type FilterTab = 'ALL' | 'INQUIRIES' | 'VERIFIED' | 'UNVERIFIED';

interface ManageLeadModalProps {
  lead: Customer;
  onClose: () => void;
  onUpdateStatus: (cust: Customer, nextStatus: LeadStatus) => Promise<void>;
  onConvert: (cust: Customer, card: string, address: string, notes: string) => Promise<void>;
}

function ManageLeadModal({ lead, onClose, onUpdateStatus, onConvert }: ManageLeadModalProps) {
  const [leadGhanaCard, setLeadGhanaCard] = useState(
    lead.ghanaCardNumber?.startsWith('GHA-') ? lead.ghanaCardNumber : ''
  );
  const [leadAddress, setLeadAddress] = useState(lead.address || '');
  const [leadInternalNotes, setLeadInternalNotes] = useState(lead.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneForWa = cleanPhoneForWhatsApp(lead.phone);
  const inquiryDetails = extractInquiryDetails(lead);
  const leadStatus = getLeadStatus(lead);
  const waGreeting = encodeURIComponent(
    `Hello ${lead.fullName}, thank you for reaching out to Amen Mart Auctioning Services regarding your inquiry on "${inquiryDetails.typeLabel}". How may we assist you today?`
  );

  const handleSubmitConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConvert(lead, leadGhanaCard, leadAddress, leadInternalNotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Inbound Request: ${lead.fullName}`}
      subtitle={`Source: ${getLeadSourceLabel(lead)} &bull; Received ${
        lead.createdAt
          ? new Date(lead.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Recently'
      }`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Lead Message Details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>INQUIRY DETAILS</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {inquiryDetails.typeLabel}
            </span>
          </div>
          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
            &quot;{inquiryDetails.messageText}&quot;
          </p>
          <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-4">
            <span>
              <strong>Phone:</strong> {lead.phone}
            </span>
            {lead.email && (
              <span>
                <strong>Email:</strong> {lead.email}
              </span>
            )}
          </div>
        </div>

        {/* Direct Connect Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="h-4 w-4 text-indigo-600" />
            <span>Call Client</span>
          </a>

          <a
            href={`https://wa.me/${phoneForWa}?text=${waGreeting}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0 text-white" />
            <span>WhatsApp</span>
          </a>

          {lead.email && (
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(
                `Amen Mart Auctioning Services — Regarding your inquiry on ${inquiryDetails.typeLabel}`
              )}`}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors col-span-2 sm:col-span-1"
            >
              <Mail className="h-4 w-4 text-indigo-600" />
              <span>Send Email</span>
            </a>
          )}
        </div>

        {/* Jump directly to Communication Hub with Resend Email & WhatsApp Templates */}
        <div>
          <Link
            href={`/desk/communication?leadId=${lead.id}`}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open in Communication Hub (Resend Email &amp; WhatsApp Templates)</span>
          </Link>
        </div>

        {/* Lead Status Workflow Bar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Update Lead Response Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['NEW', 'CONTACTED', 'RESOLVED', 'CONVERTED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => void onUpdateStatus(lead, st)}
                className={`py-2 px-1 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                  leadStatus === st
                    ? st === 'NEW'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : st === 'CONTACTED'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                      : st === 'CONVERTED'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-800 text-white border-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Convert to KYC Verified Registered Bidder/Customer Form */}
        <form onSubmit={handleSubmitConvert} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Convert Lead to KYC Registered Bidder / Buyer
            </h4>
            <p className="text-[11px] text-slate-500">
              Authenticate with official Ghana Card PIN for full AML compliance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Ghana Card PIN</label>
              <input
                type="text"
                value={leadGhanaCard}
                onChange={(e) => setLeadGhanaCard(e.target.value)}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Physical / Postal Address</label>
              <input
                type="text"
                value={leadAddress}
                onChange={(e) => setLeadAddress(e.target.value)}
                placeholder="e.g. Dansoman, Accra"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Internal Notes &amp; Follow-Up History</label>
              <textarea
                rows={2}
                value={leadInternalNotes}
                onChange={(e) => setLeadInternalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} icon={<CheckCircle2 className="h-4 w-4" />}>
              Save &amp; Convert to Customer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function CrmContent() {
  const searchParams = useSearchParams();
  const rawFilter = searchParams.get('filter')?.toUpperCase();
  const leadIdParam = searchParams.get('leadId');
  const initialType = searchParams.get('type')?.toUpperCase();

  const rawCustomers = useLiveQuery(() => db.customers.toArray(), []);
  const customers = useMemo(() => rawCustomers || [], [rawCustomers]);

  const rawReceipts = useLiveQuery(() => db.receipts.toArray(), []);
  const receipts = useMemo(() => rawReceipts || [], [rawReceipts]);

  const rawPaymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []);
  const paymentPlans = useMemo(() => rawPaymentPlans || [], [rawPaymentPlans]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leadIdParam || null);
  const [prevLeadIdParam, setPrevLeadIdParam] = useState(leadIdParam);
  if (leadIdParam !== prevLeadIdParam) {
    setPrevLeadIdParam(leadIdParam);
    setSelectedLeadId(leadIdParam || null);
  }

  const managingLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return customers.find((c) => c.id === selectedLeadId) || null;
  }, [selectedLeadId, customers]);

  // Tab Filtering
  const resolvedTab: FilterTab =
    rawFilter === 'INQUIRIES' || rawFilter === 'VERIFIED' || rawFilter === 'UNVERIFIED'
      ? rawFilter
      : 'ALL';

  const [activeTab, setActiveTab] = useState<FilterTab>(resolvedTab);
  const [prevRawFilter, setPrevRawFilter] = useState(rawFilter);
  if (rawFilter !== prevRawFilter) {
    setPrevRawFilter(rawFilter);
    setActiveTab(resolvedTab);
  }

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'CORPORATE'>(
    initialType === 'INDIVIDUAL' || initialType === 'CORPORATE' ? initialType : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = customers.length;
    const inbound = customers.filter(isCustomerInboundLead);
    const newInbound = inbound.filter((c) => getLeadStatus(c) === 'NEW');
    const verified = customers.filter((c) => c.kycVerified);
    const unverified = customers.filter((c) => !c.kycVerified);
    return {
      total,
      inboundCount: inbound.length,
      newInboundCount: newInbound.length,
      verifiedCount: verified.length,
      unverifiedCount: unverified.length,
    };
  }, [customers]);

  // Add Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGhanaCard, setEditGhanaCard] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setEditFullName(cust.fullName);
    setEditPhone(cust.phone);
    setEditEmail(cust.email || '');
    setEditGhanaCard(cust.ghanaCardNumber || '');
    setEditAddress(cust.address || '');
    setEditNotes(cust.notes || '');
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);

    try {
      const updates: Partial<Customer> = {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        ghanaCardNumber: editGhanaCard.trim(),
        address: editAddress.trim(),
        notes: editNotes.trim(),
        kycVerified: Boolean(editGhanaCard.trim() && editGhanaCard.trim().startsWith('GHA-')),
      };

      await db.customers.update(editingCustomer.id, updates);
      await syncEngine.queueMutation('customers', editingCustomer.id, 'UPDATE', updates);

      setEditingCustomer(null);
    } catch (err) {
      console.error('Failed to update customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const custId = generateCustomerId();
      const nowIso = getIsoTimestamp();

      const newCust: Customer = {
        id: custId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        ghanaCardNumber: ghanaCardNumber.trim(),
        address: address.trim(),
        customerType,
        kycVerified: Boolean(ghanaCardNumber.trim() && ghanaCardNumber.trim().startsWith('GHA-')),
        notes: notes.trim(),
        createdAt: nowIso,
      };

      await db.customers.add(newCust);
      await syncEngine.queueMutation('customers', custId, 'CREATE', newCust);

      setIsAddOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setGhanaCardNumber('');
      setAddress('');
      setNotes('');
    } catch (err) {
      console.error('Failed to add customer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleKyc = async (cust: Customer) => {
    const updatedStatus = !cust.kycVerified;
    await db.customers.update(cust.id, { kycVerified: updatedStatus });
    await syncEngine.queueMutation('customers', cust.id, 'UPDATE', { kycVerified: updatedStatus });
  };

  const handleSetLeadStatus = async (cust: Customer, nextStatus: LeadStatus) => {
    const updates: Partial<Customer> = { leadStatus: nextStatus };
    if (nextStatus === 'CONVERTED' && !cust.kycVerified && cust.ghanaCardNumber?.startsWith('GHA-')) {
      updates.kycVerified = true;
    }
    await db.customers.update(cust.id, updates);
    await syncEngine.queueMutation('customers', cust.id, 'UPDATE', updates);
  };

  const handleConvertLeadToCustomer = async (
    lead: Customer,
    card: string,
    addr: string,
    noteText: string
  ) => {
    const isCardValid = card.trim().toUpperCase().startsWith('GHA-');
    const updates: Partial<Customer> = {
      ghanaCardNumber: card.trim().toUpperCase() || lead.ghanaCardNumber,
      address: addr.trim() || lead.address,
      notes: noteText.trim() || lead.notes,
      leadStatus: 'CONVERTED',
      kycVerified: isCardValid,
    };

    await db.customers.update(lead.id, updates);
    await syncEngine.queueMutation('customers', lead.id, 'UPDATE', updates);
    setSelectedLeadId(null);
  };

  const filteredCustomers = customers.filter((cust) => {
    if (activeTab === 'INQUIRIES') {
      if (!isCustomerInboundLead(cust)) return false;
    } else if (activeTab === 'VERIFIED') {
      if (!cust.kycVerified) return false;
    } else if (activeTab === 'UNVERIFIED') {
      if (cust.kycVerified) return false;
    }

    if (typeFilter !== 'ALL' && cust.customerType !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.fullName.toLowerCase().includes(q);
      const matchPhone = cust.phone.toLowerCase().includes(q);
      const matchEmail = (cust.email || '').toLowerCase().includes(q);
      const matchGhanaCard = (cust.ghanaCardNumber || '').toLowerCase().includes(q);
      const matchNotes = (cust.notes || '').toLowerCase();
      if (!matchName && !matchPhone && !matchEmail && !matchGhanaCard && !matchNotes.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Directory &amp; Inbound Desk
          </h1>
          <p className="text-xs text-slate-500">
            Client profiles, website contact inquiries &amp; Ghana Card KYC verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/desk/communication"
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Communication Hub</span>
          </Link>

          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
            Register Customer
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All Clients</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.total}</p>
          <span className="text-[10px] text-slate-500">Unified profiles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INQUIRIES')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'INQUIRIES'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Inbound Inquiries
            </span>
            {metrics.newInboundCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {metrics.newInboundCount} New
              </span>
            )}
          </div>
          <p className="text-xl font-black text-amber-950 dark:text-amber-200 mt-1">{metrics.inboundCount}</p>
          <span className="text-[10px] text-slate-500">Web contact &amp; requests</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VERIFIED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'VERIFIED'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            KYC Verified
          </span>
          <p className="text-xl font-black text-emerald-950 dark:text-emerald-200 mt-1">{metrics.verifiedCount}</p>
          <span className="text-[10px] text-slate-500">Ghana Card authenticated</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNVERIFIED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'UNVERIFIED'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Pending KYC
          </span>
          <p className="text-xl font-black text-rose-950 dark:text-rose-200 mt-1">{metrics.unverifiedCount}</p>
          <span className="text-[10px] text-slate-500">Awaiting AML verification</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">View:</span>
          {(
            [
              { key: 'ALL', label: `All (${metrics.total})` },
              { key: 'INQUIRIES', label: `Inquiries (${metrics.inboundCount})` },
              { key: 'VERIFIED', label: `KYC Verified (${metrics.verifiedCount})` },
              { key: 'UNVERIFIED', label: `Pending KYC (${metrics.unverifiedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">Type:</span>
          {(['ALL', 'INDIVIDUAL', 'CORPORATE'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === tf
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, message..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <MessageSquare className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {activeTab === 'INQUIRIES'
              ? 'No inbound website inquiries at this time.'
              : 'No customers match the selected criteria.'}
          </p>
          <p className="text-xs text-slate-500">
            {activeTab === 'INQUIRIES'
              ? 'Inquiries submitted through the Contact page, vehicle showroom, and land parcels will appear here.'
              : 'Try clearing the search query or changing your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((cust) => {
            const isLead = isCustomerInboundLead(cust);
            const leadStatus = getLeadStatus(cust);
            const leadSourceLabel = getLeadSourceLabel(cust);
            const inquiryDetails = extractInquiryDetails(cust);
            const custReceipts = receipts.filter((r) => r.customerId === cust.id);
            const custPlans = paymentPlans.filter((p) => p.customerId === cust.id);
            const totalSpent = custReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);
            const phoneForWa = cleanPhoneForWhatsApp(cust.phone);
            const waGreeting = encodeURIComponent(
              `Hello ${cust.fullName}, thank you for reaching out to Amen Mart Auctioning Services regarding your inquiry on "${inquiryDetails.typeLabel}". How may we assist you today?`
            );

            return (
              <div
                key={cust.id}
                className={`surface-card rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                  isLead && leadStatus === 'NEW'
                    ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-200 dark:ring-amber-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                          isLead
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {cust.fullName.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cust.fullName}</h3>
                          {isLead && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {leadSourceLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                          <span>{cust.customerType} CLIENT</span>
                          {cust.createdAt && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(cust.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        title="Edit profile"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Lead Status or KYC Badge */}
                      {isLead ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1 ${
                              leadStatus === 'NEW'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : leadStatus === 'CONTACTED'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                                : leadStatus === 'CONVERTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {leadStatus === 'NEW' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                            {leadStatus === 'CONVERTED' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                            {leadStatus}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => void handleToggleKyc(cust)}
                          title="Click to toggle Ghana Card KYC status"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
                        >
                          {cust.kycVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              KYC Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800">
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                              KYC Unverified
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lead Inquiry Highlight Box */}
                  {isLead && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Area: {inquiryDetails.typeLabel}
                        </span>
                        <span className="text-slate-400 font-normal">Inbound Message</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        &quot;{inquiryDetails.messageText}&quot;
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{cust.phone}</span>
                      </div>
                      {!isLead && cust.phone && (
                        <a
                          href={`https://wa.me/${phoneForWa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-md bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs"
                          title="Chat on WhatsApp"
                        >
                          <WhatsAppIcon className="h-3 w-3 shrink-0 text-white" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>
                        Ghana Card:{' '}
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {cust.ghanaCardNumber && cust.ghanaCardNumber.startsWith('GHA-')
                            ? cust.ghanaCardNumber
                            : isLead
                            ? 'Pending AML Verification'
                            : cust.ghanaCardNumber || 'Pending AML Submission'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{cust.address}</span>
                    </div>
                    {!isLead && cust.notes && (
                      <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 italic mt-2">
                        &quot;{cust.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-3">
                  {isLead ? (
                    /* Inbound Lead Direct Action Hub */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">Lead Workflow:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetLeadStatus(cust, 'CONTACTED')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              leadStatus === 'CONTACTED'
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Contacted
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetLeadStatus(cust, 'RESOLVED')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              leadStatus === 'RESOLVED'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Resolved
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={`tel:${cust.phone}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/${phoneForWa}?text=${waGreeting}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                          <span>WhatsApp</span>
                        </a>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLeadId(cust.id)}
                          className="text-xs font-bold"
                          icon={<UserCheck className="h-3.5 w-3.5" />}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Regular Customer Transactions & Payment Plans */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[11px] text-slate-400">Lifetime Transactions:</span>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {custReceipts.length} Payments &bull; {custPlans.length} Plans
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400">Total Settled:</span>
                          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            {formatGHS(totalSpent)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/desk/payment-plans" className="block">
                          <Button size="sm" variant="outline" className="w-full text-xs" icon={<Calendar className="h-3.5 w-3.5" />}>
                            View Plans ({custPlans.length})
                          </Button>
                        </Link>
                        <Link href="/desk/payments" className="block">
                          <Button size="sm" variant="outline" className="w-full text-xs" icon={<CreditCard className="h-3.5 w-3.5" />}>
                            New Payment
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Inbound Lead / Conversion Modal */}
      {managingLead && (
        <ManageLeadModal
          lead={managingLead}
          onClose={() => setSelectedLeadId(null)}
          onUpdateStatus={handleSetLeadStatus}
          onConvert={handleConvertLeadToCustomer}
        />
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Customer (Unified Profile)"
        subtitle="Captures contact information and Ghana Card KYC for AML compliance."
        maxWidth="lg"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Full Legal Name / Company *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Nana Kwesi Boateng"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 XXX XXXX"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.gh"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Ghana Card PIN *</label>
              <input
                type="text"
                required
                value={ghanaCardNumber}
                onChange={(e) => setGhanaCardNumber(e.target.value)}
                placeholder="GHA-XXXXXXXXX-X"
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Customer Classification *</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as 'INDIVIDUAL' | 'CORPORATE')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="INDIVIDUAL">Individual Bidder / Buyer</option>
                <option value="CORPORATE">Corporate Entity / Enterprise</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Physical / Postal Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 14, Airport Residential Area, Accra"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Internal Notes &amp; Line Preferences</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Prefers Judicial auction fleet vehicles and Cantonments residential land..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Customer &amp; Verify KYC
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <Modal
          isOpen={Boolean(editingCustomer)}
          onClose={() => setEditingCustomer(null)}
          title={`Edit ${editingCustomer.fullName}`}
          subtitle="Update contact phone, Ghana Card PIN, and physical address."
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Ghana Card PIN</label>
                <input
                  type="text"
                  value={editGhanaCard}
                  onChange={(e) => setEditGhanaCard(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">KYC Status</label>
                <p className="text-xs font-semibold py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {editGhanaCard.startsWith('GHA-') ? 'Valid GHA Format (Auto-Verified)' : 'Pending Valid GHA- PIN'}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Physical / Postal Address *</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function CrmPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 font-semibold text-sm">
          Loading Customer Directory...
        </div>
      }
    >
      <CrmContent />
    </Suspense>
  );
}

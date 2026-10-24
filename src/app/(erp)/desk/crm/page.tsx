'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';

function generateCustomerId(): string {
  return `cust-${Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

function CrmContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter')?.toUpperCase();
  const initialType = searchParams.get('type')?.toUpperCase();

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const paymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []) || [];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Filters
  const resolvedKycFilter =
    initialFilter === 'VERIFIED' || initialFilter === 'UNVERIFIED' ? initialFilter : 'ALL';
  const [kycFilter, setKycFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>(resolvedKycFilter);
  const [prevKycParam, setPrevKycParam] = useState(initialFilter);
  if (initialFilter !== prevKycParam) {
    setPrevKycParam(initialFilter);
    setKycFilter(resolvedKycFilter);
  }
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'CORPORATE'>(
    initialType === 'INDIVIDUAL' || initialType === 'CORPORATE' ? initialType : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

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
        fullName: editFullName,
        phone: editPhone,
        email: editEmail,
        ghanaCardNumber: editGhanaCard,
        address: editAddress,
        notes: editNotes,
        kycVerified: Boolean(editGhanaCard.trim() && editGhanaCard.startsWith('GHA-')),
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
        fullName,
        phone,
        email,
        ghanaCardNumber,
        address,
        customerType,
        kycVerified: Boolean(ghanaCardNumber.trim() && ghanaCardNumber.startsWith('GHA-')),
        notes,
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

  const filteredCustomers = customers.filter((cust) => {
    if (kycFilter === 'VERIFIED' && !cust.kycVerified) return false;
    if (kycFilter === 'UNVERIFIED' && cust.kycVerified) return false;
    if (typeFilter !== 'ALL' && cust.customerType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.fullName.toLowerCase().includes(q);
      const matchPhone = cust.phone.toLowerCase().includes(q);
      const matchEmail = (cust.email || '').toLowerCase().includes(q);
      const matchGhanaCard = (cust.ghanaCardNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchGhanaCard) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500">
            Client profiles &amp; Ghana Card KYC verification
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
          Register Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">KYC:</span>
          {(['ALL', 'VERIFIED', 'UNVERIFIED'] as const).map((kf) => (
            <button
              key={kf}
              onClick={() => setKycFilter(kf)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                kycFilter === kf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {kf}
            </button>
          ))}

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">Type:</span>
          {(['ALL', 'INDIVIDUAL', 'CORPORATE'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
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
            placeholder="Search name, phone, Ghana Card..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-500">No customers match the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCustomers.map((cust) => {
            const custReceipts = receipts.filter((r) => r.customerId === cust.id);
            const custPlans = paymentPlans.filter((p) => p.customerId === cust.id);
            const totalSpent = custReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);

            return (
              <div
                key={cust.id}
                className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                        {cust.fullName.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cust.fullName}</h3>
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {cust.customerType} CLIENT
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        title="Edit profile"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* KYC Badge Toggle */}
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
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                      <span>
                        Ghana Card:{' '}
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {cust.ghanaCardNumber || 'Pending AML Submission'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{cust.address}</span>
                    </div>
                    {cust.notes && (
                      <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 italic mt-2">
                        &quot;{cust.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Transactions summary & Action Links */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
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

                  <div className="grid grid-cols-2 gap-2 pt-1">
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
              </div>
            );
          })}
        </div>
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

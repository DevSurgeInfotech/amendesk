'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { syncEngine } from '@/lib/sync/syncEngine';
import { formatGHS } from '@/lib/utils/currency';
import {
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';

export default function CrmPage() {
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const receipts = useLiveQuery(() => db.receipts.toArray(), []) || [];
  const paymentPlans = useLiveQuery(() => db.paymentPlans.toArray(), []) || [];

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        fullName,
        phone,
        email,
        ghanaCardNumber,
        address,
        customerType,
        kycVerified: true, // Ghana Card entered
        notes,
        createdAt: new Date().toISOString(),
      };

      await db.customers.add(newCust);
      await syncEngine.queueMutation('customers', newCust.id, 'CREATE', newCust);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Unified CRM &amp; KYC
            </span>
            <span className="text-xs text-slate-400">Ghana Card AML Verification &bull; Multi-Line Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Profile Directory
          </h1>
          <p className="text-xs text-slate-500">
            One single client record across Auction bidding, Car Dealership showroom sales, and Land/Property purchases.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
          Register Customer
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customers.map((cust) => {
          const custReceipts = receipts.filter((r) => r.customerId === cust.id);
          const custPlans = paymentPlans.filter((p) => p.customerId === cust.id);
          const totalSpent = custReceipts.reduce((acc, r) => acc + r.amountPaidGhs, 0);

          return (
            <div
              key={cust.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                      {cust.fullName.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {cust.fullName}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        {cust.customerType} CLIENT
                      </span>
                    </div>
                  </div>

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

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Ghana Card: <strong className="font-mono text-slate-800 dark:text-slate-200">{cust.ghanaCardNumber}</strong></span>
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

              {/* Transactions summary */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
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
            </div>
          );
        })}
      </div>

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
    </div>
  );
}

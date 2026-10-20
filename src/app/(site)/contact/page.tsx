'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, Mail, Clock, CheckCircle2, Send, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('AUCTION_INQUIRY');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    try {
      const customerId = `cust-${Date.now()}`;
      await db.customers.add({
        id: customerId,
        fullName: name,
        phone,
        email: email || 'contact@amenmartgh.com',
        ghanaCardNumber: 'WEB_GENERAL_CONTACT',
        address: 'Direct Contact Inbound',
        customerType: 'INDIVIDUAL',
        kycVerified: false,
        notes: `Contact Inbound (${inquiryType}): ${message}`,
        createdAt: new Date().toISOString(),
      });

      await syncEngine.queueMutation('customers', customerId, 'CREATE', {
        fullName: name,
        phone,
        inquiryType,
        message,
      });

      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Failed to log contact form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Amen Mart Auctioning Services &bull; Ghana Auctioneers Association (GAA)
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Contact Dr. Francis Kwaku Yeboah &amp; Auction Desk
        </h1>
        <p className="text-xs text-slate-500">
          Reach our Accra auction yard, dealership showroom, online bidding desk, and executive cash office.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Info Column */}
        <div className="space-y-8">
          <div className="surface-card bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Corporate Headquarters &amp; Heavy Auction Yard
            </h2>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Main Auction Yard &amp; Cash Office
                  </p>
                  <p className="text-slate-500">
                    Tema Motorway Heavy Industrial Area, Greater Accra, Ghana
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Postal: P.O. Box GP 22451, Accra — Ghana
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Dealership Showroom
                  </p>
                  <p className="text-slate-500">
                    Amen Mart Showroom Facility, Accra, Ghana
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Telephone Lines
                  </p>
                  <p className="text-slate-500">
                    +233 24 412 8990 &bull; +233 30 223 9011
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Official Email
                  </p>
                  <p className="text-slate-500">
                    info@amenmartgh.com &bull; auctions@amenmartgh.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Business &amp; Yard Viewing Hours
                  </p>
                  <p className="text-slate-500">
                    Monday – Friday: 8:00 AM – 5:00 PM &bull; Saturday: 9:00 AM – 2:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Licensed Auctioneers in Ghana (GAA Affiliated)</span>
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Amen Mart Auctioning Services is owned and led by <strong>Dr. Francis Kwaku Yeboah</strong>, recognized by the Ghana Auctioneers Association. We conduct live auctions in Accra and provide secure online real-time bidding platforms for participants across Ghana and worldwide.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="surface-card bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Send an Inquiry
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Inquiries land directly into the AmenDesk CRM customer pipeline for prompt response.
          </p>

          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Message Sent Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Thank you for reaching out. An Amen Mart representative will get back to you shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsSuccess(false)}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nana Kwesi"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Contact Phone Number *</label>
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
                  placeholder="name@domain.gh"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Area of Interest *</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                >
                  <option value="AUCTION_INQUIRY">Accra Live Auction Bidding (Judicial / Govt / Private)</option>
                  <option value="ONLINE_BIDDING">Online Auction Platform Bidding Support</option>
                  <option value="PROPERTY_AUCTION">Property &amp; Real Estate Auction Inquiry</option>
                  <option value="SHOWROOM_VEHICLE">Dealership Vehicle Purchase / Reservation</option>
                  <option value="LAND_PURCHASE">Titled Land Parcel Inquiry</option>
                  <option value="CONSIGNMENT">Consign an Asset / Seller Advisory with Dr. Francis Kwaku Yeboah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Your Message / Specific Request</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the asset, lot number, or inquiry details..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
                icon={<Send className="h-4 w-4" />}
              >
                Send Inbound Inquiry
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

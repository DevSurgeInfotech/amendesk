'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Customer } from '@/lib/types';
import { isCustomerInboundLead, getLeadSourceLabel, extractInquiryDetails } from '@/lib/crm/leads';
import { formatRelativeTime } from '@/lib/utils/date';
import { cleanPhoneForWhatsApp, generateWhatsAppLink } from '@/lib/communication/templates';
import {
  markCustomerInquiryAsRead,
  markCustomerInquiryAsUnread,
} from '@/lib/notifications/operationalNotifications';
import { useTerminal } from '@/context/TerminalContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import {
  MessageSquare,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RecentInboundInquiriesProps {
  customers: Customer[];
}

type FilterCategory = 'ALL' | 'UNREAD' | 'SHOWROOM' | 'AUCTIONS' | 'LAND_PROPERTY';

export function RecentInboundInquiries({ customers }: RecentInboundInquiriesProps) {
  const { activeTenant } = useTerminal();
  const [filter, setFilter] = useState<FilterCategory>('ALL');

  // Filter all inbound leads and sort newest first
  const allInboundLeads = useMemo(() => {
    return (customers ?? [])
      .filter((c) => isCustomerInboundLead(c))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customers]);

  const unreadCount = useMemo(() => {
    return allInboundLeads.filter((c) => !c.isRead && (c.leadStatus === 'NEW' || !c.leadStatus)).length;
  }, [allInboundLeads]);

  // Apply category filter
  const displayedLeads = useMemo(() => {
    return allInboundLeads.filter((c) => {
      if (filter === 'UNREAD') {
        return !c.isRead && (c.leadStatus === 'NEW' || !c.leadStatus);
      }
      if (filter === 'SHOWROOM') {
        return c.leadSource === 'SHOWROOM' || (c.notes || '').toLowerCase().includes('showroom') || (c.notes || '').toLowerCase().includes('vehicle');
      }
      if (filter === 'AUCTIONS') {
        return c.leadSource === 'AUCTIONS' || (c.notes || '').toLowerCase().includes('auction');
      }
      if (filter === 'LAND_PROPERTY') {
        return (
          c.leadSource === 'LAND' ||
          c.leadSource === 'PROPERTY' ||
          (c.notes || '').toLowerCase().includes('land') ||
          (c.notes || '').toLowerCase().includes('property')
        );
      }
      return true;
    });
  }, [allInboundLeads, filter]);

  if (allInboundLeads.length === 0) {
    return null;
  }

  return (
    <div className="surface-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Inbound Inquiries &amp; Website Leads
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {allInboundLeads.length} Total
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct inquiries dispatched from Amen Mart showroom, auction notices, and contact desks.
            </p>
          </div>
        </div>

        <Link
          href="/desk/communication"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>Open Communication Hub</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({allInboundLeads.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'UNREAD'
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Unread / New</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('SHOWROOM')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'SHOWROOM'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Showroom
        </button>

        <button
          type="button"
          onClick={() => setFilter('AUCTIONS')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'AUCTIONS'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Auctions
        </button>

        <button
          type="button"
          onClick={() => setFilter('LAND_PROPERTY')}
          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filter === 'LAND_PROPERTY'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Land &amp; Property
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {displayedLeads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <Sparkles className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No inbound inquiries in this view.
            </p>
            <p className="text-[11px]">
              When prospective clients inquire via the website showroom, auction listings, or contact desk, they will land here in real time.
            </p>
          </div>
        ) : (
          displayedLeads.slice(0, 6).map((lead) => {
            const details = extractInquiryDetails(lead);
            const isUnread = !lead.isRead && (lead.leadStatus === 'NEW' || !lead.leadStatus);

            return (
              <div
                key={lead.id}
                className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                  isUnread
                    ? 'bg-amber-50/40 dark:bg-amber-950/15 border-l-4 border-l-amber-500'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Inquiry Metadata & Content */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {lead.fullName}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {getLeadSourceLabel(lead)}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {details.typeLabel}
                    </span>

                    {isUnread ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        New Lead
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {lead.leadStatus === 'CONTACTED' ? 'Contacted' : 'Read'}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                  </div>

                  {/* Message Quotation */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed italic bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    &quot;{details.messageText}&quot;
                  </p>

                  {/* Contact Channels */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-mono"
                      >
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 truncate"
                      >
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{lead.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Interactive Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                  {lead.phone && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleaned = cleanPhoneForWhatsApp(lead.phone);
                        const link = generateWhatsAppLink(
                          cleaned,
                          `Hello ${lead.fullName}, thank you for contacting Amen Mart Auctioning Services regarding your inquiry on "${details.typeLabel}".`
                        );
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5 text-white" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <Link
                    href={`/desk/communication?leadId=${lead.id}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    <span>Reply in Hub</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (lead.isRead) {
                        void markCustomerInquiryAsUnread(lead.id, activeTenant.id);
                      } else {
                        void markCustomerInquiryAsRead(lead.id, activeTenant.id);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    {lead.isRead ? (
                      <>
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>Mark Unread</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Mark Read</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {allInboundLeads.length > 6 && (
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link
            href="/desk/crm?filter=INQUIRIES"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all {allInboundLeads.length} inquiries in CRM Leads Pipeline &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

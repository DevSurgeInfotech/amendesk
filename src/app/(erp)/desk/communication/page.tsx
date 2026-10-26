'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type {
  CommunicationRecord,
  CommunicationBusinessLine,
  LeadStatus,
} from '@/lib/types';
import {
  cleanPhoneForWhatsApp,
  generateWhatsAppLink,
  COMMUNICATION_TEMPLATES,
  generateAmenMartEmailHtml,
} from '@/lib/communication/templates';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useTerminal } from '@/context/TerminalContext';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  Phone,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Inbox,
  AlertCircle,
  X,
  Copy,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Monitor,
} from 'lucide-react';

type TabView = 'INBOX' | 'COMPOSE' | 'TEMPLATES' | 'LOGS';
type FilterStatus = 'ALL' | 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CONVERTED';
type FilterChannel = 'ALL' | 'WEB_INBOUND' | 'EMAIL' | 'WHATSAPP';
type FilterBusinessLine = 'ALL' | CommunicationBusinessLine;

function CommunicationHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentStaffName,
    desktopNotifsAllowed,
    desktopNotifsEnabled,
    desktopNotifsSound,
    requestDesktopNotifPermission,
    toggleDesktopNotifs,
    toggleDesktopNotifSound,
    testDesktopNotification,
  } = useTerminal();

  // Active Tab from URL query parameter
  const tabParam = searchParams.get('tab')?.toUpperCase() as TabView | undefined;
  const activeTab: TabView =
    tabParam === 'COMPOSE' || tabParam === 'TEMPLATES' || tabParam === 'LOGS'
      ? tabParam
      : 'INBOX';

  const selectLeadId = searchParams.get('leadId') || undefined;

  const setTab = (nextTab: TabView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'INBOX') {
      params.delete('tab');
    } else {
      params.set('tab', nextTab.toLowerCase());
    }
    router.replace(`/desk/communication?${params.toString()}`, { scroll: false });
  };

  // Live Dexie queries
  const localCommunications = useLiveQuery(() => db.communications.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  // Server-synced communications
  const [serverMessages, setServerMessages] = useState<CommunicationRecord[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchServerMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch('/api/communication/messages');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setServerMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Could not sync communication messages from server API:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const res = await fetch('/api/communication/messages');
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages)) {
            setServerMessages(data.messages);
          }
        }
      } catch (err) {
        console.warn('Initial server messages load warning:', err);
      }
    }
    initLoad();
    return () => {
      ignore = true;
    };
  }, []);

  // Merged and deduplicated messages
  const allMessages = useMemo(() => {
    const map = new Map<string, CommunicationRecord>();

    // 1. Ingest server records
    for (const msg of serverMessages) {
      map.set(msg.id, msg);
    }

    // 2. Ingest local Dexie records (takes precedence for local offline writes)
    for (const msg of localCommunications ?? []) {
      map.set(msg.id, msg);
    }

    // 3. Fallback: synthesize inbound messages from any Customer inquiry in Dexie
    for (const cust of customers ?? []) {
      if (
        cust.leadSource &&
        cust.leadSource !== 'DIRECT' &&
        !map.has(`comm-inbound-${cust.id}`)
      ) {
        map.set(`comm-inbound-${cust.id}`, {
          id: `comm-inbound-${cust.id}`,
          customerId: cust.id,
          customerName: cust.fullName,
          customerPhone: cust.phone,
          customerEmail: cust.email || undefined,
          direction: 'INBOUND',
          channel: 'WEB_INBOUND',
          status: cust.leadStatus === 'NEW' || !cust.leadStatus ? 'RECEIVED' : 'READ',
          subject: cust.inquirySubject || `Inbound: ${cust.inquiryType || 'General Inquiry'}`,
          message: cust.inquiryMessage || cust.notes || 'Inquiry registered through website portal.',
          businessLine:
            cust.leadSource === 'SHOWROOM'
              ? 'DEALERSHIP'
              : cust.leadSource === 'AUCTIONS'
              ? 'AUCTION'
              : cust.leadSource === 'LAND'
              ? 'LAND'
              : cust.leadSource === 'PROPERTY'
              ? 'PROPERTY'
              : 'GENERAL',
          assetReference: cust.inquirySubject || undefined,
          createdAt: cust.createdAt || new Date().toISOString(),
          syncStatus: 'SYNCED',
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [serverMessages, localCommunications, customers]);

  // Selected Thread / Message derived cleanly without cascading state effect
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);

  const selectedMessage = useMemo(() => {
    if (userSelectedId) {
      const match = allMessages.find((m) => m.id === userSelectedId);
      if (match) return match;
    }
    if (selectLeadId) {
      const match = allMessages.find((m) => m.customerId === selectLeadId || m.id === selectLeadId);
      if (match) return match;
    }
    return allMessages[0] || null;
  }, [allMessages, userSelectedId, selectLeadId]);

  const associatedCustomer = useMemo(() => {
    if (!selectedMessage?.customerId) return null;
    return (customers ?? []).find((c) => c.id === selectedMessage.customerId) || null;
  }, [customers, selectedMessage]);

  // Inbox Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterChannel, setFilterChannel] = useState<FilterChannel>('ALL');
  const [filterBusinessLine, setFilterBusinessLine] = useState<FilterBusinessLine>('ALL');

  const filteredMessages = useMemo(() => {
    return allMessages.filter((msg) => {
      // Channel
      if (filterChannel !== 'ALL' && msg.channel !== filterChannel) return false;

      // Status
      if (filterStatus !== 'ALL') {
        const leadSt = associatedCustomer?.leadStatus || (msg.status === 'RECEIVED' ? 'NEW' : 'CONTACTED');
        if (filterStatus === 'NEW' && leadSt !== 'NEW' && msg.status !== 'RECEIVED') return false;
        if (filterStatus === 'CONTACTED' && leadSt !== 'CONTACTED' && msg.status !== 'SENT') return false;
        if (filterStatus === 'RESOLVED' && leadSt !== 'RESOLVED') return false;
        if (filterStatus === 'CONVERTED' && leadSt !== 'CONVERTED') return false;
      }

      // Business Line
      if (filterBusinessLine !== 'ALL' && msg.businessLine !== filterBusinessLine) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (msg.customerName || '').toLowerCase();
        const phone = (msg.customerPhone || '').toLowerCase();
        const email = (msg.customerEmail || '').toLowerCase();
        const subject = (msg.subject || '').toLowerCase();
        const text = (msg.message || '').toLowerCase();
        const asset = (msg.assetReference || '').toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          subject.includes(q) ||
          text.includes(q) ||
          asset.includes(q)
        );
      }

      return true;
    });
  }, [allMessages, filterChannel, filterStatus, filterBusinessLine, searchQuery, associatedCustomer]);

  // KPIs
  const kpiStats = useMemo(() => {
    const totalInbound = allMessages.filter((m) => m.direction === 'INBOUND').length;
    const newUnread = allMessages.filter(
      (m) => m.direction === 'INBOUND' && (m.status === 'RECEIVED' || m.status === 'PENDING')
    ).length;
    const emailsSent = allMessages.filter((m) => m.channel === 'EMAIL' && m.direction === 'OUTBOUND').length;
    const whatsappSent = allMessages.filter((m) => m.channel === 'WHATSAPP' && m.direction === 'OUTBOUND').length;
    const responseRate = totalInbound > 0 ? Math.round(((totalInbound - newUnread) / totalInbound) * 100) : 100;

    return { totalInbound, newUnread, emailsSent, whatsappSent, responseRate };
  }, [allMessages]);

  // Email Reply Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [emailAssetRef, setEmailAssetRef] = useState('');
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('tmpl-general-reply');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  // WhatsApp Reply Modal State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waMessageText, setWaMessageText] = useState('');
  const [selectedWaTemplate, setSelectedWaTemplate] = useState('tmpl-general-reply');
  const [waSuccessMsg, setWaSuccessMsg] = useState<string | null>(null);

  // Open Reply via Email
  const handleOpenEmailReply = (targetMsg: CommunicationRecord) => {
    setEmailTo(targetMsg.customerEmail || '');
    setEmailAssetRef(targetMsg.assetReference || '');
    const defaultSubj = `Amen Mart Auctioning Services — Regarding: ${targetMsg.subject || 'Your Inquiry'}`;
    setEmailSubject(defaultSubj);

    const tmpl = COMMUNICATION_TEMPLATES.find((t) => t.id === 'tmpl-general-reply');
    if (tmpl) {
      let body = tmpl.bodyText;
      body = body.replace(/\{customerName\}/g, targetMsg.customerName || 'Valued Client');
      body = body.replace(/\{topic\}/g, targetMsg.subject || 'your request');
      body = body.replace(/\{customReply\}/g, `In reference to your message: "${targetMsg.message}"`);
      body = body.replace(/\{operatorName\}/g, currentStaffName || 'Amen Mart Desk');
      setEmailBodyText(body);
    }
    setEmailSuccessMsg(null);
    setEmailErrorMsg(null);
    setIsEmailModalOpen(true);
  };

  // Open Reply via WhatsApp
  const handleOpenWhatsAppReply = (targetMsg: CommunicationRecord) => {
    setWaPhone(targetMsg.customerPhone || '');
    const tmpl = COMMUNICATION_TEMPLATES.find((t) => t.id === 'tmpl-general-reply');
    if (tmpl) {
      let body = tmpl.bodyText;
      body = body.replace(/\{customerName\}/g, targetMsg.customerName || 'Valued Client');
      body = body.replace(/\{topic\}/g, targetMsg.subject || 'your inquiry');
      body = body.replace(/\{customReply\}/g, `We received your request: "${targetMsg.message}"`);
      body = body.replace(/\{operatorName\}/g, currentStaffName || 'Amen Mart Desk');
      setWaMessageText(body);
    }
    setWaSuccessMsg(null);
    setIsWaModalOpen(true);
  };

  // Template switch handler for Email
  const handleEmailTemplateChange = (tmplId: string) => {
    setSelectedEmailTemplate(tmplId);
    const tmpl = COMMUNICATION_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl || !selectedMessage) return;

    let body = tmpl.bodyText;
    body = body.replace(/\{customerName\}/g, selectedMessage.customerName || 'Valued Client');
    body = body.replace(/\{assetReference\}/g, emailAssetRef || selectedMessage.assetReference || 'Selected Unit');
    body = body.replace(/\{auctionCategory\}/g, 'Judicial / Government Auction');
    body = body.replace(/\{balanceAmount\}/g, '0.00');
    body = body.replace(/\{dueDate\}/g, 'within 14 days');
    body = body.replace(/\{topic\}/g, selectedMessage.subject || 'your inquiry');
    body = body.replace(/\{customReply\}/g, `Regarding your message: "${selectedMessage.message}"`);
    body = body.replace(/\{operatorName\}/g, currentStaffName || 'Customer Relations Desk');
    setEmailBodyText(body);

    let subj = tmpl.subject;
    subj = subj.replace(/\{assetReference\}/g, emailAssetRef || selectedMessage.assetReference || 'Amen Mart Services');
    setEmailSubject(subj);
  };

  // Template switch handler for WhatsApp
  const handleWaTemplateChange = (tmplId: string) => {
    setSelectedWaTemplate(tmplId);
    const tmpl = COMMUNICATION_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl || !selectedMessage) return;

    let body = tmpl.bodyText;
    body = body.replace(/\{customerName\}/g, selectedMessage.customerName || 'Valued Client');
    body = body.replace(/\{assetReference\}/g, selectedMessage.assetReference || 'Selected Asset');
    body = body.replace(/\{auctionCategory\}/g, 'Public Auction');
    body = body.replace(/\{balanceAmount\}/g, '0.00');
    body = body.replace(/\{dueDate\}/g, 'within 14 days');
    body = body.replace(/\{topic\}/g, selectedMessage.subject || 'your inquiry');
    body = body.replace(/\{customReply\}/g, `We note your inquiry: "${selectedMessage.message}"`);
    body = body.replace(/\{operatorName\}/g, currentStaffName || 'Amen Mart');
    setWaMessageText(body);
  };

  // Execute Send Email via Resend API
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBodyText) return;

    setIsSendingEmail(true);
    setEmailErrorMsg(null);
    setEmailSuccessMsg(null);

    try {
      const renderedHtml = generateAmenMartEmailHtml({
        recipientName: selectedMessage?.customerName || emailTo,
        subjectTitle: emailSubject,
        messageHtml: emailBodyText.replace(/\n/g, '<br />'),
        assetReference: emailAssetRef || selectedMessage?.assetReference,
        businessLine: selectedMessage?.businessLine || 'GENERAL',
        senderOfficer: currentStaffName || 'Customer Relations Desk',
      });

      const res = await fetch('/api/communication/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          recipientName: selectedMessage?.customerName || emailTo,
          subject: emailSubject,
          html: renderedHtml,
          text: emailBodyText,
          customerId: selectedMessage?.customerId,
          templateId: selectedEmailTemplate,
          assetReference: emailAssetRef,
          businessLine: selectedMessage?.businessLine,
          operatorName: currentStaffName || 'Staff Officer',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email via Resend API.');
      }

      // Record in local Dexie database for offline durability
      if (data.record) {
        await db.communications.put(data.record);
      }

      // Update customer leadStatus to CONTACTED in local Dexie if applicable
      if (selectedMessage?.customerId) {
        await db.customers.update(selectedMessage.customerId, {
          leadStatus: 'CONTACTED',
        });
      }

      setEmailSuccessMsg(
        data.isSimulated
          ? `Dispatched in offline simulated mode! Message ID: ${data.messageId} (Set RESEND_API_KEY in .env.local for live SMTP delivery)`
          : `Email successfully dispatched via Resend API! Message ID: ${data.messageId}`
      );

      // Refresh message list
      fetchServerMessages();

      setTimeout(() => {
        setIsEmailModalOpen(false);
      }, 1600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEmailErrorMsg(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Execute WhatsApp (wa.me) Dispatch and Interaction Logging
  const handleSendWhatsApp = async () => {
    if (!waPhone || !waMessageText) return;

    const cleanedPhone = cleanPhoneForWhatsApp(waPhone);
    const waUrl = generateWhatsAppLink(cleanedPhone, waMessageText);

    // 1. Open WhatsApp Web / App
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // 2. Log interaction into system
    const nowIso = new Date().toISOString();
    const commId = `comm-wa-${Date.now()}`;
    const newRecord: CommunicationRecord = {
      id: commId,
      customerId: selectedMessage?.customerId,
      customerName: selectedMessage?.customerName || 'WhatsApp Contact',
      customerPhone: waPhone,
      customerEmail: selectedMessage?.customerEmail,
      direction: 'OUTBOUND',
      channel: 'WHATSAPP',
      status: 'SENT',
      subject: `WhatsApp Consultation: ${selectedMessage?.subject || 'Direct Contact'}`,
      message: waMessageText,
      templateId: selectedWaTemplate,
      assetReference: selectedMessage?.assetReference,
      businessLine: selectedMessage?.businessLine || 'GENERAL',
      operatorName: currentStaffName || 'Front Desk Officer',
      createdAt: nowIso,
      syncStatus: 'SYNCED',
    };

    try {
      await db.communications.put(newRecord);
      await fetch('/api/communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      if (selectedMessage?.customerId) {
        await db.customers.update(selectedMessage.customerId, {
          leadStatus: 'CONTACTED',
        });
      }

      setWaSuccessMsg('WhatsApp dispatched and interaction logged in customer history.');
      fetchServerMessages();

      setTimeout(() => {
        setIsWaModalOpen(false);
      }, 1400);
    } catch (err) {
      console.error('Failed to log WhatsApp interaction:', err);
    }
  };

  // Toggle Lead Status
  const handleUpdateLeadStatus = async (newStatus: LeadStatus) => {
    if (!selectedMessage?.customerId) return;
    try {
      await db.customers.update(selectedMessage.customerId, {
        leadStatus: newStatus,
      });
      fetchServerMessages();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Communication Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Resend API &bull; WhatsApp wa.me
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized communications engine for Amen Mart auction inquiries, vehicle showroom leads, and land site briefings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServerMessages}
            disabled={isLoadingMessages}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
            <span>Sync Messages</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setTab('COMPOSE')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Send className="h-3.5 w-3.5" />
            <span>New Dispatch</span>
          </Button>
        </div>
      </div>

      {/* Windows & Desktop Notifications Control Strip */}
      <div className="surface-card rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {!desktopNotifsAllowed ? (
          <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-sky-50/40 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Windows Desktop Inbound Alerts
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    Recommended for Desk
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Receive instant Windows Action Center popups with chime when clients inquire from the showroom, land desk, or website.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  const granted = await requestDesktopNotifPermission();
                  if (granted) {
                    testDesktopNotification();
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Enable Windows Alerts</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-emerald-500">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {desktopNotifsEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    desktopNotifsEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Monitor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Windows Desktop Notifications {desktopNotifsEnabled ? 'Active' : 'Paused'}</span>
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Windows Action Center Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  New inquiries toast on your PC taskbar even if AmenDesk is minimized or working in another window.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => toggleDesktopNotifSound(!desktopNotifsSound)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  desktopNotifsSound
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title={desktopNotifsSound ? 'Mute Chime Sound' : 'Enable Chime Sound'}
              >
                {desktopNotifsSound ? (
                  <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>{desktopNotifsSound ? 'Chime ON' : 'Chime Muted'}</span>
              </button>

              <button
                type="button"
                onClick={testDesktopNotification}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Test Alert</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDesktopNotifs(!desktopNotifsEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  desktopNotifsEnabled
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {desktopNotifsEnabled ? 'Pause Alerts' : 'Resume Alerts'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI 5-Card Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="surface-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Inbound Requests</span>
            <Inbox className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpiStats.totalInbound}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Website inquiries</div>
        </div>

        <div className="surface-card p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
            <span>Unread / New</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <span>{kpiStats.newUnread}</span>
            {kpiStats.newUnread > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Awaiting staff response</div>
        </div>

        <div className="surface-card p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-1">
            <span>Resend Emails</span>
            <Mail className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
            {kpiStats.emailsSent}
          </div>
          <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400 mt-1">Branded HTML letterheads</div>
        </div>

        <div className="surface-card p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
            <span>WhatsApp (wa.me)</span>
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          </div>
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
            {kpiStats.whatsappSent}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-1">Direct click-to-chat</div>
        </div>

        <div className="surface-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Response Velocity</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpiStats.responseRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Handled inbound leads</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'INBOX', label: 'Inbox & Inbound Messages', icon: Inbox, count: kpiStats.newUnread },
          { id: 'COMPOSE', label: 'Compose & Dispatch', icon: Send },
          { id: 'TEMPLATES', label: 'Official Templates', icon: FileText, count: COMMUNICATION_TEMPLATES.length },
          { id: 'LOGS', label: 'Outbox & Delivery Logs', icon: Clock, count: allMessages.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id as TabView)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    tab.id === 'INBOX' && kpiStats.newUnread > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIFIED INBOX */}
      {activeTab === 'INBOX' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="surface-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages by client name, phone, email, subject, or lot reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {/* Channel Filter */}
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value as FilterChannel)}
                aria-label="Filter messages by communication channel"
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="WEB_INBOUND">Web Portal</option>
                <option value="EMAIL">Email (Resend)</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                aria-label="Filter messages by response status"
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New / Unread</option>
                <option value="CONTACTED">Contacted</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CONVERTED">Converted to Customer</option>
              </select>

              {/* Business Line Filter */}
              <select
                value={filterBusinessLine}
                onChange={(e) => setFilterBusinessLine(e.target.value as FilterBusinessLine)}
                aria-label="Filter messages by business trading line"
                className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Trading Lines</option>
                <option value="AUCTION">Auctions</option>
                <option value="DEALERSHIP">Car Dealership</option>
                <option value="LAND">Land Desk</option>
                <option value="PROPERTY">Property Units</option>
                <option value="GENERAL">General Inquiries</option>
              </select>
            </div>
          </div>

          {/* Inbox Split-Pane (Left: List, Right: Selected Thread Detail) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Thread List (5 cols) */}
            <div className="lg:col-span-5 surface-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col max-h-[720px] min-w-0">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Messages ({filteredMessages.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  {kpiStats.newUnread} unread
                </span>
              </div>

              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No messages matching current search criteria.
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isSelected = msg.id === selectedMessage?.id;
                    const isNew = msg.direction === 'INBOUND' && msg.status === 'RECEIVED';
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setUserSelectedId(msg.id)}
                        className={`p-3.5 transition-colors cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {msg.channel === 'EMAIL' ? (
                              <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            ) : msg.channel === 'WHATSAPP' ? (
                              <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366] shrink-0" />
                            ) : (
                              <Inbox className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {msg.customerName}
                            </span>
                            {isNew && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                          {msg.subject || 'Website Inquiry'}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/40 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {msg.businessLine || 'GENERAL'}
                          </span>
                          {msg.customerPhone && (
                            <span className="text-slate-400 font-mono">
                              {msg.customerPhone}
                            </span>
                          )}
                          <span
                            className={`ml-auto px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                              msg.direction === 'OUTBOUND'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : isNew
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {msg.direction === 'OUTBOUND' ? 'REPLIED' : isNew ? 'NEW' : 'READ'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Conversation & Action Pane (7 cols) */}
            <div className="lg:col-span-7 surface-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-5 min-w-0">
              {selectedMessage ? (
                <>
                  {/* Header Bar */}
                  <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {selectedMessage.customerName}
                        </h2>
                        {associatedCustomer?.kycVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                            <ShieldCheck className="h-3 w-3" />
                            KYC Verified
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase shrink-0">
                          {selectedMessage.businessLine || 'GENERAL'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        {selectedMessage.customerPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            {selectedMessage.customerPhone}
                          </span>
                        )}
                        {selectedMessage.customerEmail && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            {selectedMessage.customerEmail}
                          </span>
                        )}
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          {new Date(selectedMessage.createdAt).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Quick Channel Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 2xl:pt-0 shrink-0">
                      {selectedMessage.customerPhone && (
                        <a
                          href={`tel:${selectedMessage.customerPhone}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Phone className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>Call</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppReply(selectedMessage)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ring-1 ring-emerald-500/30 whitespace-nowrap"
                      >
                        <WhatsAppIcon className="h-4 w-4 shrink-0 text-white" />
                        <span>WhatsApp (wa.me)</span>
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenEmailReply(selectedMessage)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>Resend Email</span>
                      </Button>
                    </div>
                  </div>

                  {/* Asset Reference Notice */}
                  {selectedMessage.assetReference && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate-500 font-medium">Referenced Asset: </span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {selectedMessage.assetReference}
                        </strong>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Trading Line &bull; {selectedMessage.businessLine}
                      </span>
                    </div>
                  )}

                  {/* Message Quotation Surface */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Inbound Client Message</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Channel: {selectedMessage.channel}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      &quot;{selectedMessage.message}&quot;
                    </div>
                  </div>

                  {/* Customer Status Workflow Ribbon */}
                  {associatedCustomer && (
                    <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Lead Workflow Status
                        </span>
                        <span className="text-slate-500">
                          Current:{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            {associatedCustomer.leadStatus || 'NEW'}
                          </strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {(['NEW', 'CONTACTED', 'RESOLVED', 'CONVERTED'] as const).map((st) => {
                          const isCur = (associatedCustomer.leadStatus || 'NEW') === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateLeadStatus(st)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isCur
                                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-900'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Prior Interaction Thread / Outbound Replies */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Communication History for this Client
                    </h3>

                    {allMessages.filter(
                      (m) =>
                        m.customerId === selectedMessage.customerId ||
                        (m.customerPhone && m.customerPhone === selectedMessage.customerPhone)
                    ).length <= 1 ? (
                      <p className="text-xs text-slate-500 italic">
                        No previous replies logged yet. Use &quot;Resend Email&quot; or &quot;WhatsApp&quot; above to initiate direct contact.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {allMessages
                          .filter(
                            (m) =>
                              m.id !== selectedMessage.id &&
                              (m.customerId === selectedMessage.customerId ||
                                (m.customerPhone && m.customerPhone === selectedMessage.customerPhone))
                          )
                          .map((hist) => (
                            <div
                              key={hist.id}
                              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="flex items-center gap-1.5">
                                  {hist.channel === 'EMAIL' ? (
                                    <Mail className="h-3 w-3 text-indigo-500" />
                                  ) : hist.channel === 'WHATSAPP' ? (
                                    <WhatsAppIcon className="h-3 w-3 text-[#25D366]" />
                                  ) : (
                                    <Inbox className="h-3 w-3 text-amber-500" />
                                  )}
                                  <span className="uppercase text-slate-600 dark:text-slate-400">
                                    {hist.direction} &bull; {hist.channel}
                                  </span>
                                </span>
                                <span className="text-slate-400">
                                  {new Date(hist.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {hist.subject}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                                {hist.message}
                              </p>
                              {hist.resendMessageId && (
                                <div className="text-[10px] font-mono text-slate-400 pt-1">
                                  Resend ID: {hist.resendMessageId}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Select a message from the inbox to view full correspondence.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPOSE & QUICK SEND */}
      {activeTab === 'COMPOSE' && (
        <div className="surface-card p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Compose Outbound Communication
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatch official branded emails via Resend API or pre-formatted Ghanaian WhatsApp messages via wa.me.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Recipient Client (or type manual details below)
              </label>
              <select
                onChange={(e) => {
                  const cust = (customers ?? []).find((c) => c.id === e.target.value);
                  if (cust) {
                    setEmailTo(cust.email || '');
                    setWaPhone(cust.phone || '');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Existing Client / Inquiry --</option>
                {(customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone || c.email || 'No contact info'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pre-built Amen Mart Communication Template
              </label>
              <select
                value={selectedEmailTemplate}
                onChange={(e) => handleEmailTemplateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
              >
                {COMMUNICATION_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    [{tmpl.category}] {tmpl.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dual Action Dispatch Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Option A: Resend Email */}
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                <Mail className="h-4 w-4 text-indigo-600" />
                <span>Send via Resend API (Email)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. buyer@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  placeholder="Subject line..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={6}
                  value={emailBodyText}
                  onChange={(e) => setEmailBodyText(e.target.value)}
                  placeholder="Write email text here..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans"
                />
              </div>

              {emailSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
                  {emailSuccessMsg}
                </div>
              )}

              {emailErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300">
                  {emailErrorMsg}
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailTo}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <span>{isSendingEmail ? 'Dispatching via Resend...' : 'Dispatch Email (Resend API)'}</span>
              </Button>
            </div>

            {/* Option B: WhatsApp (wa.me) */}
            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                <span>Send via WhatsApp (wa.me)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghana Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0548517277 or 23324..."
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Message Content
                </label>
                <textarea
                  rows={9}
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  placeholder="Write WhatsApp message text here..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {waSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
                  {waSuccessMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!waPhone || !waMessageText}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-white" />
                <span>Launch WhatsApp (wa.me) &amp; Log Interaction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFFICIAL TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="surface-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Official Ghanaian Commercial Communication Templates
              </h2>
              <p className="text-xs text-slate-500">
                Standardized notices conforming to the Auctioneers Registration Board and Ghana business norms.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {COMMUNICATION_TEMPLATES.length} Pre-built Templates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMUNICATION_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="surface-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {tmpl.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Channel: {tmpl.channel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">{tmpl.description}</p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {tmpl.bodyText}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400">
                    Placeholders: {tmpl.placeholders.join(', ')}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tmpl.bodyText);
                        alert('Template text copied to clipboard!');
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                      title="Copy template text"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmailTemplate(tmpl.id);
                        setEmailSubject(tmpl.subject);
                        setEmailBodyText(tmpl.bodyText);
                        setTab('COMPOSE');
                      }}
                      className="text-xs font-bold"
                    >
                      <span>Use in Compose</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OUTBOX & DELIVERY LOGS */}
      {activeTab === 'LOGS' && (
        <div className="surface-card rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Comprehensive Communication Ledger & Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Log of all emails dispatched via Resend API and WhatsApp messages launched via wa.me.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchServerMessages}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Ledger</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Recipient / Sender</th>
                  <th className="px-4 py-3">Subject / Message</th>
                  <th className="px-4 py-3">Provider Ref (Resend ID)</th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allMessages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No communications recorded in the ledger yet.
                    </td>
                  </tr>
                ) : (
                  allMessages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(msg.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            msg.direction === 'INBOUND'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {msg.direction}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          {msg.channel === 'EMAIL' ? (
                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                          ) : msg.channel === 'WHATSAPP' ? (
                            <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                          ) : (
                            <Inbox className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          <span>{msg.channel}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {msg.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {msg.customerPhone || msg.customerEmail || '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {msg.subject}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {msg.message}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {msg.resendMessageId ? (
                          <span
                            className="text-indigo-600 dark:text-indigo-400"
                            title={msg.resendMessageId}
                          >
                            {msg.resendMessageId.substring(0, 18)}...
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {msg.operatorName || 'System'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Send Email via Resend API */}
      {isEmailModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsEmailModalOpen(false)}
          title={`Reply via Email (Resend API) • ${selectedMessage?.customerName}`}
          subtitle="Dispatches an official Amen Mart branded letterhead with statutory trust badges."
          maxWidth="lg"
        >
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Template
                </label>
                <select
                  value={selectedEmailTemplate}
                  onChange={(e) => handleEmailTemplateChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                >
                  {COMMUNICATION_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message Content
              </label>
              <textarea
                rows={8}
                required
                value={emailBodyText}
                onChange={(e) => setEmailBodyText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans leading-relaxed"
              />
            </div>

            {emailSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
                {emailSuccessMsg}
              </div>
            )}

            {emailErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300">
                {emailErrorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSendingEmail || !emailTo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                <Mail className="h-4 w-4" />
                <span>{isSendingEmail ? 'Sending via Resend...' : 'Send via Resend API'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Send WhatsApp via wa.me */}
      {isWaModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsWaModalOpen(false)}
          title={`WhatsApp (wa.me) • ${selectedMessage?.customerName}`}
          subtitle="Direct click-to-chat with pre-filled Ghanaian business template."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ghanaian Mobile / WhatsApp Number
              </label>
              <input
                type="text"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="0548517277 or 233..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Template Selector
              </label>
              <select
                value={selectedWaTemplate}
                onChange={(e) => handleWaTemplateChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
              >
                {COMMUNICATION_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Message Text
              </label>
              <textarea
                rows={8}
                value={waMessageText}
                onChange={(e) => setWaMessageText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans leading-relaxed"
              />
            </div>

            {waSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300">
                {waSuccessMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsWaModalOpen(false)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!waPhone || !waMessageText}
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-white" />
                <span>Open WhatsApp (wa.me) &amp; Log</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function CommunicationHubPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
          Loading Amen Mart Communication Hub...
        </div>
      }
    >
      <CommunicationHubContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Send,
  X,
  Phone,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  UserCheck,
  ChevronRight,
  MessageSquarePlus,
} from 'lucide-react';
import { db } from '@/lib/db';
import { recordInboundLead } from '@/lib/crm/leads';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import {
  generateAmenAiResponse,
  AMEN_MART_COMPANY_FACTS,
  type AmenAiResponse,
  type LiveInventorySnapshot,
} from '@/lib/ai/amenKnowledgeBase';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  userText?: string;
  aiResponse?: AmenAiResponse;
  timestamp: string;
}

const QUICK_TOPIC_CHIPS = [
  {
    label: '25% Deposit & 14-Day Rule',
    prompt: 'How do the 25% hammer deposit and 14-day balance settlement rules work?',
  },
  {
    label: 'Judicial & Govt Auctions',
    prompt: 'Explain the 3 auction categories: Judicial, Government, and Private auctions.',
  },
  {
    label: 'Showroom Cars (0% Fee)',
    prompt: 'What cars are available in the showroom and is there an auction fee on showroom cars?',
  },
  {
    label: 'Waybill vs. Transfer Deed',
    prompt: 'What documents do I get for Movable vs. Immovable assets after full payment?',
  },
  {
    label: 'Titled Land & Properties',
    prompt: 'How are your titled land parcels and properties verified at the Lands Commission?',
  },
  {
    label: 'Office Location & Hours',
    prompt: 'Where is the Amen Mart office and yard located, and what are your viewing hours and phone numbers?',
  },
  {
    label: 'Payment Modes & KYC',
    prompt: 'What payment methods do you accept and what ID is required for KYC?',
  },
  {
    label: 'Consign an Asset',
    prompt: 'How can I consign a vehicle or property for sale with Dr. Francis Kwaku Yeboah?',
  },
];

/**
 * Formats markdown-style bold (**text**) into React strong elements safely.
 */
function renderFormattedInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Renders multi-paragraph and bulleted AI responses cleanly.
 */
function FormattedAiAnswer({ content }: { content: string }) {
  const blocks = content.split('\n\n');
  return (
    <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
      {blocks.map((block, bIdx) => {
        if (block.trim() === '---') {
          return <hr key={bIdx} className="border-slate-200 dark:border-slate-700 my-2" />;
        }
        const lines = block.split('\n');
        return (
          <div key={bIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 shrink-0">
                      &bull;
                    </span>
                    <span>{renderFormattedInline(trimmed.slice(2))}</span>
                  </div>
                );
              }
              return <p key={lIdx}>{renderFormattedInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function AmenAiAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcomeHint, setShowWelcomeHint] = useState(true);

  // In-chat lead capture drawer state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadInterest, setLeadInterest] = useState('AUCTION_INQUIRY');
  const [leadMessage, setLeadMessage] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmittedSuccess, setLeadSubmittedSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCounterRef = useRef(1);

  // Live ERP Inventory query from Dexie IndexedDB
  const auctionLots = useLiveQuery(() => db.auctionLots.toArray(), []);
  const dealershipVehicles = useLiveQuery(() => db.dealershipVehicles.toArray(), []);
  const landParcels = useLiveQuery(() => db.landParcels.toArray(), []);
  const propertyUnits = useLiveQuery(() => db.propertyUnits.toArray(), []);

  const inventorySnapshot = useMemo<LiveInventorySnapshot>(
    () => ({
      auctionLots: (auctionLots || []).map((l) => ({
        id: l.id,
        lotNumber: l.lotNumber,
        title: l.title,
        category: l.category,
        assetType: l.assetType,
        startingBidGhs: l.startingBidGhs,
        currentBidGhs: l.currentBidGhs,
        reservePriceGhs: l.reservePriceGhs,
        status: l.status,
        yardLocation: l.yardLocation,
        conditionNotes: l.conditionNotes,
        make: l.make,
        model: l.model,
        year: l.year,
        fuelType: l.fuelType,
        courtCaseNumber: l.courtCaseNumber,
      })),
      dealershipVehicles: (dealershipVehicles || []).map((v) => ({
        id: v.id,
        stockNumber: v.stockNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        fuelType: v.fuelType,
        transmission: v.transmission,
        mileageKm: v.mileageKm,
        color: v.color,
        askingPriceGhs: v.askingPriceGhs,
        status: v.status,
        location: v.location,
        description: v.description,
      })),
      landParcels: (landParcels || []).map((l) => ({
        id: l.id,
        siteRef: l.siteRef,
        title: l.title,
        location: l.location,
        sizeAcres: l.sizeAcres,
        priceGhs: l.priceGhs,
        status: l.status,
        titleType: l.titleType,
        description: l.description,
      })),
      propertyUnits: (propertyUnits || []).map((p) => ({
        id: p.id,
        unitRef: p.unitRef,
        title: p.title,
        propertyType: p.propertyType,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        priceGhs: p.priceGhs,
        status: p.status,
        description: p.description,
      })),
    }),
    [auctionLots, dealershipVehicles, landParcels, propertyUnits]
  );

  // Initial welcome message
  const initialGreeting = useMemo<ChatMessage>(() => {
    const welcome = generateAmenAiResponse('hello', inventorySnapshot, pathname, {
      id: 'initial-welcome-ai',
      createdAt: '2026-10-25T08:00:00.000Z',
    });
    return {
      id: 'initial-welcome',
      sender: 'ASSISTANT',
      aiResponse: welcome,
      timestamp: 'Online 24/7',
    };
  }, [inventorySnapshot, pathname]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const displayedMessages = messages.length === 0 ? [initialGreeting] : messages;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, displayedMessages.length, isTyping, showLeadForm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isTyping) return;

    msgCounterRef.current += 1;
    const seq = msgCounterRef.current;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${seq}`,
      sender: 'USER',
      userText: trimmed,
      timestamp: nowTime,
    };

    setMessages((prev) => {
      const base = prev.length === 0 ? [initialGreeting] : prev;
      return [...base, userMsg];
    });
    setInputQuery('');
    setIsTyping(true);

    // Pre-fill lead inquiry message with user's latest question in case they open the callback form
    setLeadMessage((prev) => prev || trimmed);

    try {
      // Try API route first (which also supports optional Gemini enrichment), with instant client fallback
      let resolvedResponse: AmenAiResponse | null = null;
      try {
        const res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            inventory: inventorySnapshot,
            pathname,
          }),
        });
        if (res.ok) {
          resolvedResponse = (await res.json()) as AmenAiResponse;
        }
      } catch {
        // Offline or network drop: use local knowledge engine directly
      }

      if (!resolvedResponse) {
        resolvedResponse = generateAmenAiResponse(trimmed, inventorySnapshot, pathname);
      }

      const aiMsg: ChatMessage = {
        id: resolvedResponse.id,
        sender: 'ASSISTANT',
        aiResponse: resolvedResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSendQuery(inputQuery);
  };

  const handleResetChat = () => {
    setMessages([]);
    setShowLeadForm(false);
    setLeadSubmittedSuccess(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;

    setIsSubmittingLead(true);
    try {
      await recordInboundLead({
        fullName: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || undefined,
        inquiryType: leadInterest,
        inquirySubject: `Amen AI Assistant Inquiry (${leadInterest.replace(/_/g, ' ')})`,
        inquiryMessage:
          leadMessage.trim() ||
          'Requested callback and consultation via Amen AI Website Assistant.',
        leadSource: 'AI_ASSISTANT',
      });

      setLeadSubmittedSuccess(true);
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadMessage('');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const whatsappUrl = `https://wa.me/${AMEN_MART_COMPANY_FACTS.contacts.whatsappNumber}?text=${encodeURIComponent(
    'Hello Amen Mart Auctioning Services, I was chatting with the Amen AI Assistant on your website and would like to inquire further.'
  )}`;

  return (
    <>
      {/* Floating Launcher Cluster (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2.5 print:hidden">
        {/* Welcome Callout Pill when closed */}
        {!isOpen && showWelcomeHint && (
          <div className="hidden sm:flex items-center gap-2.5 pl-3.5 pr-2 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-800/80 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.16)] text-xs text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setShowWelcomeHint(false);
              }}
              className="text-left group cursor-pointer"
            >
              <span className="font-bold text-indigo-700 dark:text-indigo-400 group-hover:underline">
                Ask Amen AI
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {' '}
                &bull; Auctions, Cars, Land &amp; 14-Day Rules
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowWelcomeHint(false)}
              aria-label="Dismiss welcome hint"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Primary Floating Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowWelcomeHint(false);
          }}
          aria-label={isOpen ? 'Close Amen AI Assistant' : 'Open Amen AI Assistant'}
          className="group relative flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-2xl bg-gradient-to-r from-[#0B1F3A] via-indigo-950 to-indigo-700 hover:from-indigo-950 hover:to-indigo-600 text-white shadow-[0_14px_34px_-6px_rgba(30,27,75,0.45)] border border-indigo-400/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <div className="relative h-9 w-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm shrink-0">
            <Image
              src="/amenmart-icon-4k.png"
              alt="Amen AI"
              width={32}
              height={32}
              className="w-full h-full object-contain rounded-lg"
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0B1F3A]" />
            </span>
          </div>

          <div className="text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                Amen AI Assistant
              </span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-200 block">
              {isOpen ? 'Click to minimize' : '24/7 Auction & Showroom Advisor'}
            </span>
          </div>
        </button>
      </div>

      {/* Expandable Assistant Drawer / Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Amen AI Assistant Chat Window"
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.32)] overflow-hidden print:hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-10 rounded-3xl'
              : 'bottom-24 right-4 sm:right-5 w-[calc(100vw-2rem)] sm:w-[430px] h-[min(660px,calc(100vh-7.5rem))] rounded-3xl'
          }`}
        >
          {/* Top Brand Header */}
          <div className="bg-gradient-to-r from-[#0B1F3A] via-indigo-950 to-slate-900 text-white px-4 py-3.5 border-b border-indigo-900/60 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm shrink-0">
                  <Image
                    src="/amenmart-icon-4k.png"
                    alt="Amen Mart"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0B1F3A]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight text-white truncate">
                      Amen AI Concierge
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/30 text-[9px] font-bold uppercase tracking-wider text-indigo-200 shrink-0">
                      PNDCL 230 &bull; GAA
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200/90 truncate">
                    Trained on Amen Mart Rules, Live Catalog &amp; KYC
                  </p>
                </div>
              </div>

              {/* Header Utility Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp (0548517277)"
                  className="p-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors shadow-xs"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`tel:${AMEN_MART_COMPANY_FACTS.contacts.primaryPhone}`}
                  title="Call Gbawe Office (0548517277)"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? 'Restore Standard Size' : 'Expand Window'}
                  className="hidden sm:inline-flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Knowledge Topic Bar */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {QUICK_TOPIC_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSendQuery(chip.prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-indigo-500/40 border border-white/15 text-[11px] font-semibold text-indigo-100 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f3f6fa] dark:bg-slate-950">
            {displayedMessages.map((msg) => {
              if (msg.sender === 'USER') {
                return (
                  <div key={msg.id} className="flex flex-col items-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-4 py-2.5 text-xs sm:text-[13px] font-medium shadow-xs leading-relaxed">
                      {msg.userText}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              }

              const ai = msg.aiResponse;
              if (!ai) return null;

              return (
                <div key={msg.id} className="flex flex-col items-start space-y-2">
                  {/* Assistant Message Card */}
                  <div className="w-full sm:max-w-[94%] rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
                    {/* Topic Category Badge */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        <span>{ai.categoryLabel}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>

                    {/* Main Formatted Answer */}
                    <FormattedAiAnswer content={ai.answer} />

                    {/* Live Inventory Cards if present */}
                    {ai.inventoryItems && ai.inventoryItems.length > 0 && (
                      <div className="pt-1 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Matching Live Catalog Records
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {ai.inventoryItems.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="group block p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[9px] font-bold uppercase mb-1">
                                    {item.badgeText}
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                                    {item.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {item.subtitle}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] text-slate-400">{item.priceLabel}</div>
                                  <div className="text-xs font-black text-indigo-700 dark:text-indigo-300 font-mono">
                                    GH₵ {item.priceValueGhs.toLocaleString('en-GH')}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-indigo-500" />
                                  {item.location}
                                </span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                  View Listing <ChevronRight className="h-3 w-3" />
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Statutory Key Highlights Box */}
                    {ai.highlights && ai.highlights.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Key Statutory &amp; Operational Facts
                        </div>
                        <ul className="space-y-1">
                          {ai.highlights.map((hl, hIdx) => (
                            <li
                              key={hIdx}
                              className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Page Links */}
                    {ai.suggestedLinks && ai.suggestedLinks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {ai.suggestedLinks.map((lnk, lIdx) => (
                          <Link
                            key={lIdx}
                            href={lnk.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-bold transition-colors"
                          >
                            <span>{lnk.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                        {ai.suggestLeadCapture && !showLeadForm && (
                          <button
                            type="button"
                            onClick={() => setShowLeadForm(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white border border-amber-300/80 dark:border-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Request Staff Callback</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested Follow-Up Prompts */}
                  {ai.followUpPrompts && ai.followUpPrompts.length > 0 && (
                    <div className="w-full sm:max-w-[94%] pl-1 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Suggested Follow-Up Questions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ai.followUpPrompts.map((fp, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => void handleSendQuery(fp)}
                            className="text-left px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                          >
                            {fp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit shadow-2xs">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Amen AI is checking statutory rules &amp; catalog...
                </span>
              </div>
            )}

            {/* Embedded Staff Callback / CRM Lead Capture Card */}
            {showLeadForm && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/80 p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                      <MessageSquarePlus className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        Direct Inquiry to Amen Mart Desk
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Routes immediately to our Gbawe CRM &amp; Communication Hub
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {leadSubmittedSuccess ? (
                  <div className="py-4 text-center space-y-2">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Inquiry Logged in AmenDesk CRM!
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Our Gbawe Auction &amp; Showroom Desk has been notified and will reach out to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLeadSubmittedSuccess(false);
                        setShowLeadForm(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Continue Chatting
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="e.g. Kwame Boateng"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Phone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="054 XXX XXXX"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                          Department / Line
                        </label>
                        <select
                          value={leadInterest}
                          onChange={(e) => setLeadInterest(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        >
                          <option value="AUCTION_INQUIRY">Auctions (Judicial / Govt / Private)</option>
                          <option value="SHOWROOM_VEHICLE">Car Dealership Showroom</option>
                          <option value="LAND_PURCHASE">Titled Land Parcels</option>
                          <option value="PROPERTY_AUCTION">Residential &amp; Commercial Realty</option>
                          <option value="CONSIGNMENT">Consign Asset with Dr. Yeboah</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                        Your Request / Question
                      </label>
                      <textarea
                        rows={2}
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                        placeholder="Tell our team which lot, vehicle, or land parcel you are interested in..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLead}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      {isSubmittingLead ? 'Sending to AmenDesk CRM...' : 'Submit Inquiry to Staff'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Composer & Escalation Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about auctions, cars, land, 14-day rule, fees..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                aria-label="Send question"
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <span>Ask</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Footer Quick Escalation Strip */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
              <button
                type="button"
                onClick={() => {
                  setShowLeadForm((prev) => !prev);
                  setLeadSubmittedSuccess(false);
                }}
                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>{showLeadForm ? 'Hide Inquiry Form' : 'Leave an Inquiry for Staff'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1da850] dark:text-[#25D366] hover:underline"
                >
                  <WhatsAppIcon className="h-3 w-3" />
                  <span>WhatsApp Desk</span>
                </a>
                <span>&bull;</span>
                <a
                  href={`tel:${AMEN_MART_COMPANY_FACTS.contacts.primaryPhone}`}
                  className="font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                >
                  0548517277
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import type { Customer, CommunicationRecord, CommunicationBusinessLine } from '@/lib/types';
import { db, AmenDeskDB, LIVE_DB_NAME, SANDBOX_DB_NAME } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';

export type LeadSource =
  | 'CONTACT_PAGE'
  | 'SHOWROOM'
  | 'AUCTIONS'
  | 'LAND'
  | 'PROPERTY'
  | 'PORTAL'
  | 'AI_ASSISTANT'
  | 'DIRECT';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CONVERTED';

const LEAD_GHANA_CARD_MARKERS = [
  'WEB_GENERAL_CONTACT',
  'LAND_INQUIRY_LEAD',
  'PROPERTY_INQUIRY_LEAD',
  'PENDING_REGISTRATION_DESK',
  'PENDING_PORTAL_REGISTRATION',
  'ONLINE_PAYSTACK_HOLD',
];

/**
 * Checks whether a Customer record originated as an inbound website inquiry/lead.
 */
export function isCustomerInboundLead(cust: Customer): boolean {
  if (cust.leadSource && cust.leadSource !== 'DIRECT') {
    return true;
  }
  const card = (cust.ghanaCardNumber || '').toUpperCase().trim();
  if (LEAD_GHANA_CARD_MARKERS.some((marker) => card.includes(marker))) {
    return true;
  }
  const addr = (cust.address || '').toLowerCase();
  if (addr.includes('inbound') || addr.includes('web inquiry') || addr.includes('online')) {
    return true;
  }
  const notes = (cust.notes || '').toLowerCase();
  if (
    notes.startsWith('contact inbound') ||
    notes.startsWith('inquiry on') ||
    notes.startsWith('online bidder registration') ||
    notes.startsWith('online reservation') ||
    notes.startsWith('portal inquiry')
  ) {
    return true;
  }
  return false;
}

/**
 * Retrieves the normalized lead status for an inbound inquiry.
 */
export function getLeadStatus(cust: Customer): LeadStatus {
  if (cust.leadStatus) return cust.leadStatus;
  if (cust.kycVerified && cust.ghanaCardNumber?.startsWith('GHA-')) {
    return 'CONVERTED';
  }
  return 'NEW';
}

/**
 * Human-readable label for the origin/source of a lead.
 */
export function getLeadSourceLabel(cust: Customer): string {
  if (cust.leadSource === 'CONTACT_PAGE') return 'Contact Page';
  if (cust.leadSource === 'SHOWROOM') return 'Showroom Vehicle';
  if (cust.leadSource === 'LAND') return 'Land Desk';
  if (cust.leadSource === 'PROPERTY') return 'Property Desk';
  if (cust.leadSource === 'AUCTIONS') return 'Auction Desk';
  if (cust.leadSource === 'AI_ASSISTANT') return 'Amen AI Assistant';
  if (cust.leadSource === 'PORTAL') return 'Web Portal';

  const card = (cust.ghanaCardNumber || '').toUpperCase();
  if (card.includes('WEB_GENERAL_CONTACT')) return 'Contact Page';
  if (card.includes('LAND_INQUIRY')) return 'Land Desk';
  if (card.includes('PROPERTY_INQUIRY')) return 'Property Desk';
  if (card.includes('REGISTRATION_DESK')) return 'Auction Desk';
  if (card.includes('PAYSTACK_HOLD')) return 'Showroom Vehicle';

  const notes = (cust.notes || '').toLowerCase();
  if (notes.includes('land')) return 'Land Desk';
  if (notes.includes('property')) return 'Property Desk';
  if (notes.includes('vehicle') || notes.includes('showroom')) return 'Showroom Vehicle';
  if (notes.includes('auction') || notes.includes('bidder')) return 'Auction Desk';

  return 'Website Inquiry';
}

/**
 * Formats standard inquiry type identifiers into user-friendly names.
 */
export function formatInquiryType(inquiryType?: string): string {
  if (!inquiryType) return 'General Inquiry';
  switch (inquiryType.toUpperCase()) {
    case 'AUCTION_INQUIRY':
      return 'Live Auction Bidding';
    case 'ONLINE_BIDDING':
      return 'Online Bidding Platform';
    case 'PROPERTY_AUCTION':
      return 'Property & Real Estate';
    case 'SHOWROOM_VEHICLE':
      return 'Showroom Vehicle Purchase';
    case 'LAND_PURCHASE':
      return 'Titled Land Parcel';
    case 'CONSIGNMENT':
      return 'Asset Consignment / Advisory';
    default:
      return inquiryType.replace(/_/g, ' ');
  }
}

/**
 * Parses out clean inquiry subject and message body from customer notes if structured fields are absent.
 */
export function extractInquiryDetails(cust: Customer): {
  typeLabel: string;
  messageText: string;
} {
  if (cust.inquiryType || cust.inquiryMessage) {
    return {
      typeLabel: formatInquiryType(cust.inquiryType),
      messageText: cust.inquiryMessage || cust.notes || 'General inquiry requested via website.',
    };
  }

  const rawNotes = cust.notes || '';
  const match = rawNotes.match(/^Contact Inbound\s*\(([^)]+)\):\s*(.*)$/i);
  if (match) {
    return {
      typeLabel: formatInquiryType(match[1]),
      messageText: match[2].trim() || 'General inquiry requested via website contact form.',
    };
  }

  const landMatch = rawNotes.match(/^Inquiry on Land\s*([^:]+):\s*(.*)$/i);
  if (landMatch) {
    return {
      typeLabel: 'Titled Land Parcel',
      messageText: `Inquiry regarding parcel ${landMatch[1]}: ${landMatch[2]}`,
    };
  }

  const propMatch = rawNotes.match(/^Inquiry on Property\s*([^:]+):\s*(.*)$/i);
  if (propMatch) {
    return {
      typeLabel: 'Property Unit',
      messageText: `Inquiry regarding unit ${propMatch[1]}: ${propMatch[2]}`,
    };
  }

  const aucMatch = rawNotes.match(/^Online Bidder Registration for\s*([^:]+):\s*(.*)$/i);
  if (aucMatch) {
    return {
      typeLabel: 'Auction Bidder Registration',
      messageText: `Requested registration for lot ${aucMatch[1]}: ${aucMatch[2]}`,
    };
  }

  return {
    typeLabel: getLeadSourceLabel(cust),
    messageText: rawNotes || 'Inquiry registered through website portal.',
  };
}

export interface InboundLeadInput {
  fullName: string;
  phone: string;
  email?: string;
  inquiryType?: string;
  inquirySubject?: string;
  inquiryMessage?: string;
  leadSource?: LeadSource;
  address?: string;
  notes?: string;
  ghanaCardNumber?: string;
}

/**
 * Universal Inbound Lead Handler:
 * 1. Dispatches to Server API for cross-browser, cross-device, and mobile synchronization.
 * 2. Writes directly to the active client Dexie database.
 * 3. Writes to BOTH AmenDeskDB_live and AmenDeskDB_sandbox databases so the inquiry appears
 *    regardless of whether staff is reviewing Demo Yard or Live Production.
 * 4. Queues in the offline sync engine.
 * 5. Broadcasts across all active browser tabs in real time via BroadcastChannel.
 */
export async function recordInboundLead(data: InboundLeadInput): Promise<Customer> {
  const customerId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();
  const cleanName = data.fullName.trim();
  const cleanPhone = data.phone.trim();
  const cleanEmail = (data.email || '').trim();
  const cleanMessage = (data.inquiryMessage || '').trim();
  const inquiryType = data.inquiryType || 'AUCTION_INQUIRY';
  const leadSource = data.leadSource || 'CONTACT_PAGE';
  const ghanaCardNumber = data.ghanaCardNumber || 'WEB_GENERAL_CONTACT';
  const address = data.address || 'Contact Page Web Inbound';
  const notes =
    data.notes ||
    `Contact Inbound (${inquiryType}): ${cleanMessage || 'General inquiry requested via website contact form.'}`;

  const customerRecord: Customer = {
    id: customerId,
    fullName: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    ghanaCardNumber,
    address,
    customerType: 'INDIVIDUAL',
    kycVerified: false,
    leadSource,
    leadStatus: 'NEW',
    inquiryType,
    inquirySubject: data.inquirySubject || '',
    inquiryMessage: cleanMessage,
    notes,
    createdAt: nowIso,
  };

  const businessLine: CommunicationBusinessLine =
    leadSource === 'SHOWROOM'
      ? 'DEALERSHIP'
      : leadSource === 'AUCTIONS'
      ? 'AUCTION'
      : leadSource === 'LAND'
      ? 'LAND'
      : leadSource === 'PROPERTY'
      ? 'PROPERTY'
      : 'GENERAL';

  const commRecord: CommunicationRecord = {
    id: `comm-inbound-${customerId}`,
    customerId,
    customerName: cleanName,
    customerPhone: cleanPhone,
    customerEmail: cleanEmail || undefined,
    direction: 'INBOUND',
    channel: 'WEB_INBOUND',
    status: 'RECEIVED',
    subject: data.inquirySubject || `Inbound: ${formatInquiryType(inquiryType)}`,
    message: cleanMessage || notes,
    businessLine,
    assetReference: data.inquirySubject || undefined,
    createdAt: nowIso,
    syncStatus: 'SYNCED',
  };

  // 1. Post to Server API (persists for cross-browser, mobile, and remote staff terminals)
  try {
    await Promise.allSettled([
      fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerRecord),
      }),
      fetch('/api/communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commRecord),
      }),
    ]);
  } catch (err) {
    console.warn('Inbound inquiry could not reach server API (operating offline):', err);
  }

  // 2. Direct write to default active Dexie database
  try {
    await Promise.allSettled([
      db.customers.put(customerRecord),
      db.communications.put(commRecord),
    ]);
  } catch (err) {
    console.error('Failed to write inquiry to active Dexie database:', err);
  }

  // 3. Write to BOTH Live and Sandbox databases so inquiries never get lost between tenant environments
  try {
    const liveDb = new AmenDeskDB(LIVE_DB_NAME, 'LIVE');
    const sandboxDb = new AmenDeskDB(SANDBOX_DB_NAME, 'SANDBOX');
    await Promise.allSettled([
      liveDb.customers.put(customerRecord),
      liveDb.communications.put(commRecord),
      sandboxDb.customers.put(customerRecord),
      sandboxDb.communications.put(commRecord),
    ]);
  } catch (err) {
    console.warn('Dual-tenant local write fallback:', err);
  }

  // 4. Queue in offline background sync engine
  try {
    await Promise.allSettled([
      syncEngine.queueMutation('customers', customerId, 'CREATE', customerRecord),
      syncEngine.queueMutation('communications', commRecord.id, 'CREATE', commRecord),
    ]);
  } catch (err) {
    console.warn('Sync outbox queue warning:', err);
  }

  // 5. Broadcast in real time across browser tabs on the same origin
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('amendesk_leads_sync');
      channel.postMessage({ type: 'NEW_LEAD', customer: customerRecord, communication: commRecord });
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel errors in restricted contexts
  }

  return customerRecord;
}

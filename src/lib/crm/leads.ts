import type { Customer } from '@/lib/types';

export type LeadSource =
  | 'CONTACT_PAGE'
  | 'SHOWROOM'
  | 'AUCTIONS'
  | 'LAND'
  | 'PROPERTY'
  | 'PORTAL'
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

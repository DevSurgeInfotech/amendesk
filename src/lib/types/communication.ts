export type CommunicationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'WEB_INBOUND';

export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';

export type CommunicationStatus =
  | 'RECEIVED'
  | 'READ'
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED';

export type CommunicationBusinessLine =
  | 'AUCTION'
  | 'DEALERSHIP'
  | 'LAND'
  | 'PROPERTY'
  | 'GENERAL';

export interface CommunicationRecord {
  id: string; // e.g. "comm-1729864000-abcd"
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  direction: CommunicationDirection;
  channel: CommunicationChannel;
  status: CommunicationStatus;
  subject: string;
  message: string;
  htmlBody?: string;
  resendMessageId?: string;
  templateId?: string;
  assetReference?: string; // Lot #, VIN, Parcel siteRef, etc.
  businessLine?: CommunicationBusinessLine;
  operatorName?: string;
  operatorEmail?: string;
  isSimulated?: boolean;
  createdAt: string;
  updatedAt?: string;
  syncStatus?: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface CommunicationTemplate {
  id: string;
  title: string;
  description: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH';
  category: CommunicationBusinessLine;
  subject: string;
  bodyText: string;
  htmlTemplate?: string;
  placeholders: string[]; // e.g. ['customerName', 'assetReference', 'balanceAmount']
}

export interface SendEmailPayload {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  customerId?: string;
  templateId?: string;
  assetReference?: string;
  businessLine?: CommunicationBusinessLine;
  operatorName?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
  record?: CommunicationRecord;
}

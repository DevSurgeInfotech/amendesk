import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type {
  CommunicationRecord,
  CommunicationBusinessLine,
} from '@/lib/types/communication';
import type { Customer } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMM_FILE = path.join(DATA_DIR, 'communication-logs.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inbound-inquiries.json');

async function loadCommLogs(): Promise<CommunicationRecord[]> {
  try {
    const raw = await readFile(COMM_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Return empty list
  }
  return [];
}

async function saveCommLogs(logs: CommunicationRecord[]): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(COMM_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save comm logs:', err);
  }
}

async function loadInboundInquiries(): Promise<Customer[]> {
  try {
    const raw = await readFile(INQUIRIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Return empty list
  }
  return [];
}

function mapLeadSourceToBusinessLine(source?: string): CommunicationBusinessLine {
  if (!source) return 'GENERAL';
  switch (source.toUpperCase()) {
    case 'SHOWROOM':
      return 'DEALERSHIP';
    case 'AUCTIONS':
      return 'AUCTION';
    case 'LAND':
      return 'LAND';
    case 'PROPERTY':
      return 'PROPERTY';
    default:
      return 'GENERAL';
  }
}

export async function GET() {
  try {
    const [commLogs, inboundInquiries] = await Promise.all([
      loadCommLogs(),
      loadInboundInquiries(),
    ]);

    const existingInboundIds = new Set(
      commLogs
        .filter((c) => c.direction === 'INBOUND' && c.customerId)
        .map((c) => c.customerId)
    );

    const syntheticInboundRecords: CommunicationRecord[] = [];

    for (const inq of inboundInquiries) {
      if (!existingInboundIds.has(inq.id)) {
        syntheticInboundRecords.push({
          id: `comm-inbound-${inq.id}`,
          customerId: inq.id,
          customerName: inq.fullName,
          customerPhone: inq.phone,
          customerEmail: inq.email || undefined,
          direction: 'INBOUND',
          channel: 'WEB_INBOUND',
          status: inq.leadStatus === 'NEW' || !inq.leadStatus ? 'RECEIVED' : 'READ',
          subject: inq.inquirySubject || `Inbound: ${inq.inquiryType || 'General'}`,
          message:
            inq.inquiryMessage ||
            inq.notes ||
            'Client reached out via Amen Mart website portal.',
          businessLine: mapLeadSourceToBusinessLine(inq.leadSource),
          assetReference: inq.inquirySubject || undefined,
          createdAt: inq.createdAt || new Date().toISOString(),
          syncStatus: 'SYNCED',
        });
      }
    }

    const allMessages = [...commLogs, ...syntheticInboundRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, messages: allMessages });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errMessage || 'Failed to load messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CommunicationRecord = await request.json();

    if (!body.customerName || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Customer name and message are required.' },
        { status: 400 }
      );
    }

    const record: CommunicationRecord = {
      ...body,
      id: body.id || `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      syncStatus: 'SYNCED',
    };

    const logs = await loadCommLogs();
    const existingIndex = logs.findIndex((l) => l.id === record.id);
    if (existingIndex >= 0) {
      logs[existingIndex] = record;
    } else {
      logs.unshift(record);
    }
    await saveCommLogs(logs);

    // If this is a WhatsApp dispatch or reply to a customer, update their inquiry status
    if (record.customerId && record.direction === 'OUTBOUND') {
      try {
        const inquiries = await loadInboundInquiries();
        const target = inquiries.find((i) => i.id === record.customerId);
        if (target && (target.leadStatus === 'NEW' || !target.leadStatus)) {
          target.leadStatus = 'CONTACTED';
          await writeFile(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
        }
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ success: true, record });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errMessage || 'Failed to save communication log' },
      { status: 500 }
    );
  }
}

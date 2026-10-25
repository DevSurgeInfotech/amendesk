import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type {
  CommunicationRecord,
  SendEmailPayload,
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
    // Return empty array if file does not exist
  }
  return [];
}

async function saveCommLogs(logs: CommunicationRecord[]): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(COMM_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save communication logs to file:', err);
  }
}

async function markInboundLeadContacted(customerId: string): Promise<void> {
  try {
    const raw = await readFile(INQUIRIES_FILE, 'utf-8');
    const parsed: Customer[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let updated = false;
      for (const c of parsed) {
        if (c.id === customerId) {
          c.leadStatus = 'CONTACTED';
          updated = true;
          break;
        }
      }
      if (updated) {
        await writeFile(INQUIRIES_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    }
  } catch {
    // Non-blocking if file does not exist yet
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailPayload & { customApiKey?: string } = await request.json();

    if (!body.to || !body.subject || (!body.html && !body.text)) {
      return NextResponse.json(
        { success: false, error: 'Recipient email ("to"), subject, and email body are required.' },
        { status: 400 }
      );
    }

    const apiKey = body.customApiKey || process.env.RESEND_API_KEY;
    const defaultFrom =
      process.env.RESEND_FROM_EMAIL || 'Amen Mart <notifications@kehillahos.app>';

    let resendMessageId = '';
    let isSimulated = false;

    // Check whether Resend is configured for live SMTP dispatch
    const hasLiveKey = apiKey && apiKey.startsWith('re_') && apiKey.length > 10;

    if (hasLiveKey) {
      try {
        const resend = new Resend(apiKey);
        const { data, error } = await resend.emails.send({
          from: defaultFrom,
          to: [body.to.trim()],
          subject: body.subject.trim(),
          html: body.html || `<p>${body.text}</p>`,
          text: body.text,
          replyTo: body.replyTo || 'info@amenmart.com',
        });

        if (error) {
          console.error('Resend API execution error:', error);
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to dispatch email via Resend API.' },
            { status: 502 }
          );
        }

        resendMessageId = data?.id || `resend_${Date.now()}`;
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error('Resend client exception:', errMessage);
        return NextResponse.json(
          { success: false, error: `Resend dispatch exception: ${errMessage}` },
          { status: 500 }
        );
      }
    } else {
      // Offline-first or unconfigured Resend API: perform high-fidelity simulation
      isSimulated = true;
      resendMessageId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(
        `[Resend Simulated Dispatch] Dispatched to ${body.to} with subject "${body.subject}". (Set RESEND_API_KEY in .env.local for live SMTP delivery)`
      );
    }

    const commRecord: CommunicationRecord = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerId: body.customerId,
      customerName: body.recipientName || body.to,
      customerEmail: body.to,
      direction: 'OUTBOUND',
      channel: 'EMAIL',
      status: 'SENT',
      subject: body.subject,
      message: body.text || 'Branded HTML Email dispatched via Resend API.',
      htmlBody: body.html,
      resendMessageId,
      templateId: body.templateId,
      assetReference: body.assetReference,
      businessLine: body.businessLine || 'GENERAL',
      operatorName: body.operatorName || 'Cash Office / Relations Desk',
      isSimulated,
      createdAt: new Date().toISOString(),
      syncStatus: 'SYNCED',
    };

    // Save to persistent file storage
    const logs = await loadCommLogs();
    logs.unshift(commRecord);
    await saveCommLogs(logs);

    // If customerId is provided, mark inbound inquiry as CONTACTED
    if (body.customerId) {
      await markInboundLeadContacted(body.customerId);
    }

    return NextResponse.json({
      success: true,
      messageId: resendMessageId,
      isSimulated,
      record: commRecord,
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error('Error in communication send-email route:', err);
    return NextResponse.json(
      { success: false, error: errMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}

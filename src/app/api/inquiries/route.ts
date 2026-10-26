import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import type { Customer } from '@/lib/types';

// In-memory cache for ultra-fast response and serverless fallback
let inMemoryInquiries: Customer[] = [];

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'inbound-inquiries.json');

async function loadInquiriesFromFile(): Promise<Customer[]> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryInquiries = parsed;
      return inMemoryInquiries;
    }
  } catch {
    // Return in-memory list if file does not exist yet
  }
  return inMemoryInquiries;
}

async function saveInquiriesToFile(items: Customer[]): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save inbound inquiries to file:', err);
  }
}

export async function GET() {
  const inquiries = await loadInquiriesFromFile();
  return NextResponse.json({ success: true, inquiries });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.fullName || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Full name and phone number are required.' },
        { status: 400 }
      );
    }

    const current = await loadInquiriesFromFile();
    const existingIndex = body.id ? current.findIndex((c) => c.id === body.id) : -1;
    const existing = existingIndex >= 0 ? current[existingIndex] : null;

    const customerRecord: Customer = {
      id: body.id || `cust-${Date.now()}`,
      fullName: String(body.fullName).trim(),
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim() : (existing?.email || ''),
      ghanaCardNumber: body.ghanaCardNumber || existing?.ghanaCardNumber || 'WEB_GENERAL_CONTACT',
      address: body.address || existing?.address || 'Contact Page Web Inbound',
      customerType: 'INDIVIDUAL',
      kycVerified: false,
      leadSource: body.leadSource || existing?.leadSource || 'CONTACT_PAGE',
      leadStatus: body.leadStatus || existing?.leadStatus || 'NEW',
      inquiryType: body.inquiryType || existing?.inquiryType || 'AUCTION_INQUIRY',
      inquirySubject: body.inquirySubject || existing?.inquirySubject || '',
      inquiryMessage: (body.inquiryMessage || body.message || existing?.inquiryMessage || '').trim(),
      isRead: typeof body.isRead === 'boolean' ? body.isRead : (existing?.isRead || false),
      readAt: body.readAt || existing?.readAt,
      notes:
        body.notes ||
        existing?.notes ||
        `Contact Inbound (${body.inquiryType || 'General'}): ${(body.inquiryMessage || body.message || '').trim() || 'General inquiry requested via website.'}`,
      createdAt: body.createdAt || existing?.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      current[existingIndex] = customerRecord;
    } else {
      current.unshift(customerRecord);
    }
    inMemoryInquiries = current;
    await saveInquiriesToFile(current);

    return NextResponse.json({ success: true, lead: customerRecord });
  } catch (err) {
    console.error('Error handling inbound inquiry:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Inquiry ID required' }, { status: 400 });
    }

    const current = await loadInquiriesFromFile();
    const idx = current.findIndex((c) => c.id === body.id);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        ...body,
      };
      inMemoryInquiries = current;
      await saveInquiriesToFile(current);
      return NextResponse.json({ success: true, lead: current[idx] });
    }

    return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
  } catch (err) {
    console.error('Error updating inbound inquiry:', err);
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 500 });
  }
}

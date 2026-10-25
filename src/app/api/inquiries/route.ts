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

    const customerRecord: Customer = {
      id: body.id || `cust-${Date.now()}`,
      fullName: String(body.fullName).trim(),
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim() : '',
      ghanaCardNumber: body.ghanaCardNumber || 'WEB_GENERAL_CONTACT',
      address: body.address || 'Contact Page Web Inbound',
      customerType: 'INDIVIDUAL',
      kycVerified: false,
      leadSource: body.leadSource || 'CONTACT_PAGE',
      leadStatus: 'NEW',
      inquiryType: body.inquiryType || 'AUCTION_INQUIRY',
      inquirySubject: body.inquirySubject || '',
      inquiryMessage: (body.inquiryMessage || body.message || '').trim(),
      notes:
        body.notes ||
        `Contact Inbound (${body.inquiryType || 'General'}): ${(body.inquiryMessage || body.message || '').trim() || 'General inquiry requested via website.'}`,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const current = await loadInquiriesFromFile();
    const existingIndex = current.findIndex((c) => c.id === customerRecord.id);
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

import type {
  CommunicationTemplate,
  CommunicationBusinessLine,
} from '@/lib/types/communication';

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `233${digits.substring(1)}`;
  }
  if (digits.startsWith('233')) {
    return digits;
  }
  return digits;
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleaned = cleanPhoneForWhatsApp(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export function fillTemplatePlaceholders(
  text: string,
  values: Record<string, string>
): string {
  let result = text;
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, val || '');
  }
  return result;
}

export const COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tmpl-general-reply',
    title: 'Inbound Inquiry Official Response',
    description: 'Standard polite corporate acknowledgement and reply to inquiries submitted via the website or contact desk.',
    channel: 'BOTH',
    category: 'GENERAL',
    subject: 'Amen Mart Auctioning Services — Regarding Your Inbound Inquiry',
    bodyText: `Dear {customerName},

Thank you for contacting Amen Mart Auctioning Services regarding "{topic}".

We have reviewed your request, and our customer relations team is pleased to assist you. 

{customReply}

If you require immediate assistance or wish to speak with our front desk, please call us directly on 0548517277 or 0558314744. You are also welcome to visit our head office yard in Accra from Monday to Friday, 8:30 AM – 5:00 PM.

Warm regards,
{operatorName}
Customer Relations Desk
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'topic', 'customReply', 'operatorName'],
  },
  {
    id: 'tmpl-auction-bidder',
    title: 'Auction Lot Details & Bidder Guide',
    description: 'Official notice containing viewing dates, asset specifications, and Ghana Card registration rules for upcoming auctions.',
    channel: 'BOTH',
    category: 'AUCTION',
    subject: 'Amen Mart — Auction Information & Bidding Notice for {assetReference}',
    bodyText: `Dear {customerName},

Thank you for your interest in our upcoming auction featuring {assetReference}.

Official Auction Details:
• Category: {auctionCategory}
• Asset: {assetReference}
• Inspection/Viewing Days: Monday – Friday (8:30 AM – 4:30 PM) at Amen Mart Auction Yard, Accra.
• Statutory Compliance: All registered bidders must present a valid Ghana Card (NIA PIN) in accordance with the Auctioneers Registration Board.

Winning bids require an immediate statutory deposit, with a 14-day balance settlement window prior to disposal documentation (A5 Waybill for movable assets / Transfer Deed for immovable property).

{customReply}

Please let us know if you wish to pre-register your bidder paddle number.

Best regards,
{operatorName}
Auction Operations Team
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'assetReference', 'auctionCategory', 'customReply', 'operatorName'],
  },
  {
    id: 'tmpl-dealership-inspection',
    title: 'Dealership Vehicle Inspection Invitation',
    description: 'Invite vehicle buyers to inspect, test-drive, and review chassis/customs papers at the Amen Mart Showroom.',
    channel: 'BOTH',
    category: 'DEALERSHIP',
    subject: 'Amen Mart Showroom — Vehicle Availability & Inspection for {assetReference}',
    bodyText: `Hello {customerName},

Thank you for inquiring about the {assetReference} in our showroom inventory.

We are pleased to inform you that this vehicle is available for physical inspection, mechanical diagnostic checks, and test drives at our Accra Showroom:
• Vehicle: {assetReference}
• Stock Status: Available for Immediate Direct Sale (No 7% Auction Commission)
• Location: Amen Mart Showroom Yard, Accra
• Viewing Schedule: Monday – Saturday, 8:30 AM – 5:30 PM

All vehicle documentation, customs landed paperwork, and registration records are ready for your due diligence.

{customReply}

Would you like us to reserve a convenient morning or afternoon slot for your test drive?

Sincerely,
{operatorName}
Showroom Sales Desk
Amen Mart Car Dealership`,
    placeholders: ['customerName', 'assetReference', 'customReply', 'operatorName'],
  },
  {
    id: 'tmpl-land-sitevisit',
    title: 'Titled Land Parcel Briefing & Site Visit',
    description: 'Information package and guided site visit invitation for registered titled land parcels.',
    channel: 'BOTH',
    category: 'LAND',
    subject: 'Amen Mart Land Desk — Site Plan Briefing for Parcel {assetReference}',
    bodyText: `Dear {customerName},

Thank you for reaching out regarding our titled land parcel: {assetReference}.

Amen Mart guarantees litigation-free land parcels. Key details regarding this parcel:
• Parcel Reference: {assetReference}
• Documentation: Certified Cadastral Site Plan & Barcode Indenture available for inspection
• Title Verification: Clean Lands Commission search records

Our land officers conduct guided site inspections every Tuesday, Thursday, and Saturday at 10:00 AM. 

{customReply}

Please confirm your preferred date for a joint site inspection with our survey team.

Warm regards,
{operatorName}
Land & Property Registry Desk
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'assetReference', 'customReply', 'operatorName'],
  },
  {
    id: 'tmpl-property-viewing',
    title: 'Property Development Unit Walkthrough',
    description: 'Details and viewing appointment schedule for residential or commercial units.',
    channel: 'BOTH',
    category: 'PROPERTY',
    subject: 'Amen Mart Properties — Viewing Schedule for Unit {assetReference}',
    bodyText: `Hello {customerName},

Thank you for your inquiry on our property listing: {assetReference}.

We would be pleased to host you for a private architectural walkthrough and review of the purchase terms:
• Property Unit: {assetReference}
• Location: Accra Prime Area
• Terms: Direct Sale / Transfer with Statutory Documentation

{customReply}

Please let us know your availability so our property management team can receive you at the site.

Best regards,
{operatorName}
Property Development Team
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'assetReference', 'customReply', 'operatorName'],
  },
  {
    id: 'tmpl-settlement-reminder',
    title: '14-Day Hammer Settlement Balance Reminder',
    description: 'Statutory reminder for auction buyers or instalment clients with an approaching 14-day settlement deadline.',
    channel: 'BOTH',
    category: 'AUCTION',
    subject: 'Amen Mart Accounts — 14-Day Settlement Reminder: {assetReference}',
    bodyText: `URGENT PAYMENT REMINDER:

Dear {customerName},

This is an official communication from the Amen Mart Accounts & Cash Office regarding your winning bid / reservation on {assetReference}.

Settlement Summary:
• Asset: {assetReference}
• Outstanding Balance: GH₵ {balanceAmount}
• Due Date: {dueDate} (14-Day Statutory Settlement Deadline)

Payment Channels Accepted:
1. Direct Cash at Amen Mart Cash Office (Till Instant Receipting)
2. Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo via Hubtel)
3. Direct Bank Transfer to Amen Mart Operating Account

Upon full balance settlement, your official A5 Gate Release Waybill / Transfer Deed will be issued immediately.

{customReply}

For payment confirmation or extension inquiries, please reach the Cash Office immediately on 0548517277.

Accounts Department
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'assetReference', 'balanceAmount', 'dueDate', 'customReply'],
  },
  {
    id: 'tmpl-waybill-ready',
    title: 'Asset Released & Waybill Ready for Yard Collection',
    description: 'Notice to client that payment is fully cleared and movable asset can be driven or transported out of yard.',
    channel: 'BOTH',
    category: 'AUCTION',
    subject: 'Amen Mart — Clearance & Gate Waybill Ready for {assetReference}',
    bodyText: `Dear {customerName},

We are pleased to inform you that payment for {assetReference} has cleared in full.

Your official A5 Gate Release Waybill has been generated and approved by the yard marshal. You or your authorized driver may now pick up the asset at our main yard:
• Asset: {assetReference}
• Release Document: Official Amen Mart A5 Waybill
• Yard Location: Amen Mart Main Yard, Accra
• Gate Hours: Monday – Friday, 8:00 AM – 5:00 PM

Please bring your valid Ghana Card and official receipt upon arrival at the security gate.

Thank you for choosing Amen Mart Auctioning Services.

Yard Marshal & Dispatch Desk
Amen Mart Auctioning Services`,
    placeholders: ['customerName', 'assetReference'],
  },
];

export interface EmailHtmlOptions {
  recipientName: string;
  subjectTitle: string;
  messageHtml: string;
  assetReference?: string;
  businessLine?: CommunicationBusinessLine;
  actionUrl?: string;
  actionText?: string;
  senderOfficer?: string;
}

/**
 * Generates an executive, responsive HTML email matching Amen Mart's corporate branding.
 */
export function generateAmenMartEmailHtml(opts: EmailHtmlOptions): string {
  const lineLabel = opts.businessLine
    ? opts.businessLine === 'DEALERSHIP'
      ? 'Car Dealership Showroom'
      : opts.businessLine === 'AUCTION'
      ? 'Auctioning Services (Private, Government & Judicial)'
      : opts.businessLine === 'LAND'
      ? 'Titled Land & Parcels'
      : opts.businessLine === 'PROPERTY'
      ? 'Property Development'
      : 'Customer Relations'
    : 'Customer Relations & Auction Services';

  const actionButton = opts.actionUrl && opts.actionText ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${opts.actionUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 13px 28px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 0.5px;">
        ${opts.actionText}
      </a>
    </div>
  ` : '';

  const assetBadge = opts.assetReference ? `
    <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px;">Reference Asset</div>
      <div style="font-size: 15px; color: #0f172a; font-weight: 700; margin-top: 2px;">${opts.assetReference}</div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.subjectTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 620px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 32px; border-bottom: 3px solid #4f46e5;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      AMEN MART
                    </div>
                    <div style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">
                      AUCTIONING SERVICES &bull; ACCRA, GHANA
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(79, 70, 229, 0.25); color: #c7d2fe; border: 1px solid rgba(129, 140, 248, 0.4); padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      Authorized GAA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sub-header category bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 10px 32px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-weight: 600;">
              <span>${lineLabel}</span>
            </td>
          </tr>

          <!-- Main Message Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-size: 15px; color: #334155; margin-bottom: 18px;">
                Dear <strong>${opts.recipientName}</strong>,
              </div>

              ${assetBadge}

              <div style="font-size: 14px; color: #334155; line-height: 1.7;">
                ${opts.messageHtml}
              </div>

              ${actionButton}

              <!-- Officer Signoff -->
              <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
                <div>Warm regards,</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px;">
                  ${opts.senderOfficer || 'Amen Mart Customer Relations Desk'}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                  Amen Mart Auctioning Services Ltd.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer & Statutory Trust Information -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">
                AMEN MART AUCTIONING SERVICES
              </div>
              <div>
                Head Office & Main Auction Yard: Accra, Ghana
              </div>
              <div style="margin-top: 2px;">
                Telephone: <strong>+233 54 851 7277</strong> / <strong>+233 55 831 4744</strong> &bull; Email: <strong>info@amenmart.com</strong>
              </div>
              <div style="margin-top: 10px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                Ministry of the Interior Licensed &bull; Auctioneers Registration Board &bull; Ghana Auctioneers Association (GAA)
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

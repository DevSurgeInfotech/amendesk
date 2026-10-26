'use client';

import { db } from '@/lib/db';

export const NOTIF_DISMISSED_EVENT = 'amendesk:notification_dismissed';
export const NOTIF_CHANNEL_NAME = 'amendesk_notifs_sync';

/**
 * Returns the list of dismissed notification IDs stored in localStorage for the active tenant.
 */
export function getDismissedNotifIds(tenantId = 'amen-mart-sandbox'): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`amendesk_dismissed_notifs_${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Dismisses a notification by ID and broadcasts across all tabs and reactive components.
 */
export function dismissNotification(tenantId = 'amen-mart-sandbox', id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedNotifIds(tenantId);
    if (!current.includes(id)) {
      const next = [...current, id];
      localStorage.setItem(`amendesk_dismissed_notifs_${tenantId}`, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(NOTIF_DISMISSED_EVENT, { detail: { tenantId, id, dismissed: true } })
      );
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel(NOTIF_CHANNEL_NAME);
          bc.postMessage({ type: 'DISMISS_NOTIF', tenantId, id });
          bc.close();
        } catch {
          // Non-blocking
        }
      }
    }
  } catch (err) {
    console.error('Failed to dismiss notification:', err);
  }
}

/**
 * Dismisses a batch of notification IDs at once.
 */
export function dismissNotifications(tenantId = 'amen-mart-sandbox', ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const current = getDismissedNotifIds(tenantId);
    const next = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(`amendesk_dismissed_notifs_${tenantId}`, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent(NOTIF_DISMISSED_EVENT, { detail: { tenantId, ids, dismissed: true } })
    );
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(NOTIF_CHANNEL_NAME);
        bc.postMessage({ type: 'DISMISS_NOTIFS', tenantId, ids });
        bc.close();
      } catch {
        // Non-blocking
      }
    }
  } catch (err) {
    console.error('Failed to dismiss notifications:', err);
  }
}

/**
 * Undismisses a previously dismissed notification ID.
 */
export function undismissNotification(tenantId = 'amen-mart-sandbox', id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedNotifIds(tenantId);
    const next = current.filter((item) => item !== id);
    localStorage.setItem(`amendesk_dismissed_notifs_${tenantId}`, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent(NOTIF_DISMISSED_EVENT, { detail: { tenantId, id, dismissed: false } })
    );
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(NOTIF_CHANNEL_NAME);
        bc.postMessage({ type: 'UNDISMISS_NOTIF', tenantId, id });
        bc.close();
      } catch {
        // Non-blocking
      }
    }
  } catch (err) {
    console.error('Failed to undismiss notification:', err);
  }
}

/**
 * Marks an inbound customer inquiry as READ:
 * 1. Updates Dexie customer table (isRead: true, readAt)
 * 2. Updates Dexie communications table (status: 'READ')
 * 3. Notifies server API (/api/inquiries and /api/communication/messages)
 * 4. Dismisses the notification from Topbar Operational Alerts
 */
export async function markCustomerInquiryAsRead(
  customerId: string,
  tenantId = 'amen-mart-sandbox'
): Promise<void> {
  const nowIso = new Date().toISOString();

  // 1. Update Dexie customer record
  try {
    await db.customers.update(customerId, {
      isRead: true,
      readAt: nowIso,
    });
  } catch (err) {
    console.warn('Could not update customer isRead in Dexie:', err);
  }

  // 2. Update Dexie communication record
  const commId = `comm-inbound-${customerId}`;
  try {
    const existing = await db.communications.get(commId);
    if (existing) {
      await db.communications.update(commId, {
        status: 'READ',
        updatedAt: nowIso,
      });
    }
  } catch (err) {
    console.warn('Could not update communication record in Dexie:', err);
  }

  // 3. Dismiss Topbar operational alert
  dismissNotification(tenantId, `notif-lead-${customerId}`);

  // 4. Update Server API (non-blocking)
  try {
    void fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: customerId, isRead: true, readAt: nowIso }),
    }).catch(() => {});

    const cust = await db.customers.get(customerId);
    void fetch('/api/communication/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: commId,
        customerId,
        customerName: cust?.fullName || 'Website Inquirer',
        customerPhone: cust?.phone,
        customerEmail: cust?.email,
        direction: 'INBOUND',
        channel: 'WEB_INBOUND',
        status: 'READ',
        subject: cust?.inquirySubject || 'Inbound Inquiry',
        message: cust?.inquiryMessage || cust?.notes || 'Website Lead',
        updatedAt: nowIso,
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * Marks an inbound customer inquiry as UNREAD:
 * 1. Updates Dexie customer table (isRead: false)
 * 2. Updates Dexie communications table (status: 'RECEIVED')
 * 3. Undismisses the Topbar alert
 */
export async function markCustomerInquiryAsUnread(
  customerId: string,
  tenantId = 'amen-mart-sandbox'
): Promise<void> {
  // 1. Update Dexie customer record
  try {
    await db.customers.update(customerId, {
      isRead: false,
      readAt: undefined,
    });
  } catch (err) {
    console.warn('Could not update customer isRead in Dexie:', err);
  }

  // 2. Update Dexie communication record
  const commId = `comm-inbound-${customerId}`;
  try {
    const existing = await db.communications.get(commId);
    if (existing) {
      await db.communications.update(commId, {
        status: 'RECEIVED',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not update communication record in Dexie:', err);
  }

  // 3. Undismiss Topbar operational alert
  undismissNotification(tenantId, `notif-lead-${customerId}`);

  // 4. Update Server API
  try {
    void fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: customerId, isRead: false, readAt: null }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

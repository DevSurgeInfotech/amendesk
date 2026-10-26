import type { Customer } from '@/lib/types';
import { extractInquiryDetails } from '@/lib/crm/leads';

const NOTIF_PREF_KEY = 'amendesk_desktop_notifs_enabled';
const NOTIF_SOUND_KEY = 'amendesk_desktop_notifs_sound';
const NOTIF_PREF_EVENT = 'amendesk-notification-pref-change';

// In-memory cache of already notified inquiry IDs to avoid duplicate alerts during session
const notifiedInquiryIds = new Set<string>();

/**
 * Checks if the browser / platform supports the HTML5 Web Notification API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission status ('granted' | 'denied' | 'default' | 'unsupported').
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Check if the user has enabled desktop notifications in AmenDesk settings.
 * Defaults to true if permission is granted.
 */
export function isDesktopNotificationEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const saved = localStorage.getItem(NOTIF_PREF_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists the user's preference for desktop notifications.
 */
export function setDesktopNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIF_PREF_KEY, String(enabled));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIF_PREF_EVENT, { detail: { enabled } }));
    }
  } catch {
    // Ignore localStorage write errors
  }
}

/**
 * Checks if sound chime is enabled for notifications.
 * Defaults to true.
 */
export function isDesktopNotificationSoundEnabled(): boolean {
  try {
    const saved = localStorage.getItem(NOTIF_SOUND_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists the user's preference for notification audio chimes.
 */
export function setDesktopNotificationSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIF_SOUND_KEY, String(enabled));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIF_PREF_EVENT, { detail: { sound: enabled } }));
    }
  } catch {
    // Ignore localStorage write errors
  }
}

/**
 * Synthesizes an executive, pleasant two-tone chime via Web Audio API.
 * Runs completely offline with 0 external asset downloads.
 */
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: Fundamental warm bell tone (D5 ~587Hz -> A5 ~880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: Crisp harmonic sparkle (D6 ~1174Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
    gain2.gain.setValueAtTime(0.14, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch {
    // Web Audio may be restricted if user has not yet interacted with the window
  }
}

/**
 * Requests notification permission from the browser.
 */
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      setDesktopNotificationEnabled(true);
      // Play a confirmation chime on initial permission grant
      playNotificationChime();
    }
    return granted;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

export interface DesktopNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  url?: string;
  playChime?: boolean;
}

/**
 * Dispatches a native desktop / Windows notification.
 */
export function sendDesktopNotification(payload: DesktopNotificationPayload): boolean {
  if (!isDesktopNotificationEnabled()) return false;

  const { title, body, tag, icon, url, playChime = true } = payload;

  // 1. Play offline audio chime if sound preference is active
  if (playChime && isDesktopNotificationSoundEnabled()) {
    playNotificationChime();
  }

  // 2. Dispatch native Windows toast via Web Notification API
  try {
    const notif = new Notification(title, {
      body,
      tag,
      icon: icon || '/amenmart-app-icon-4k.png',
      badge: '/amenmart-app-icon-4k.png',
    });

    notif.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {
        // Window focus may be limited in some sandbox contexts
      }
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Native notification display failed:', err);
    return false;
  }
}

/**
 * Determines whether an inquiry lead has already triggered a notification.
 */
export function hasInquiryBeenNotified(leadId: string): boolean {
  if (notifiedInquiryIds.has(leadId)) return true;
  try {
    const stored = sessionStorage.getItem(`amendesk_notif_${leadId}`);
    if (stored) {
      notifiedInquiryIds.add(leadId);
      return true;
    }
  } catch {
    // Ignore sessionStorage errors
  }
  return false;
}

/**
 * Marks an inquiry lead as notified to prevent duplicate popups.
 */
export function markInquiryNotified(leadId: string): void {
  notifiedInquiryIds.add(leadId);
  try {
    sessionStorage.setItem(`amendesk_notif_${leadId}`, String(Date.now()));
  } catch {
    // Ignore sessionStorage errors
  }
}

/**
 * Universal dispatcher for inbound customer inquiry notifications.
 * Automatically checks deduplication, age limit, and triggers Windows notifications.
 */
export function notifyInboundInquiry(
  lead: Customer,
  options?: { force?: boolean; playChime?: boolean }
): boolean {
  if (!lead || !lead.id) return false;

  // Deduplication check
  if (!options?.force && hasInquiryBeenNotified(lead.id)) {
    return false;
  }

  // Age threshold check: ignore historical inquiries created over 15 minutes ago unless forced
  if (!options?.force && lead.createdAt) {
    const leadAgeMs = Date.now() - new Date(lead.createdAt).getTime();
    if (leadAgeMs > 15 * 60 * 1000) {
      // Mark as notified so we don't evaluate it on future syncs
      markInquiryNotified(lead.id);
      return false;
    }
  }

  // Extract clean details
  const details = extractInquiryDetails(lead);
  const title = `🔔 New Inquiry: ${lead.fullName || 'Prospective Client'}`;
  const phoneLine = lead.phone ? `Phone: ${lead.phone}` : '';
  const body = `[${details.typeLabel}] ${details.messageText}${phoneLine ? ` • ${phoneLine}` : ''}`;
  const url = `/desk/communication?leadId=${encodeURIComponent(lead.id)}`;

  markInquiryNotified(lead.id);

  return sendDesktopNotification({
    title,
    body,
    tag: `lead-${lead.id}`,
    icon: '/amenmart-app-icon-4k.png',
    url,
    playChime: options?.playChime ?? true,
  });
}

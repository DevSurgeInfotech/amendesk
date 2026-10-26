import type { Customer } from '@/lib/types';
import { extractInquiryDetails } from '@/lib/crm/leads';

const NOTIF_PREF_KEY = 'amendesk_desktop_notifs_enabled';
const NOTIF_SOUND_KEY = 'amendesk_desktop_notifs_sound';
const NOTIF_PREF_EVENT = 'amendesk-notification-pref-change';

// In-memory cache of already notified inquiry IDs to avoid duplicate alerts during session
const notifiedInquiryIds = new Set<string>();

// Singleton AudioContext for instant, zero-latency playback across ERP
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Auto-unlock AudioContext on first user interaction in the workspace
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
    } catch {
      // Ignore
    }
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
}

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
 * Synthesizes a prominent, notable, executive 3-tone chime via Web Audio API.
 * Combines fundamental warm bells + harmonic overtones for high presence and clarity across both laptop and desktop speakers.
 * Runs 100% offline with zero external audio assets.
 */
export function playNotificationChime(): void {
  if (!isDesktopNotificationSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Helper to play a harmonic bell tone
    const playBellTone = (
      freq: number,
      startTime: number,
      duration: number,
      volume: number,
      type: OscillatorType = 'sine'
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      // Subtle pitch envelope for metallic chime character
      osc.frequency.exponentialRampToValueAtTime(freq * 1.008, startTime + duration);

      // Volume envelope with immediate attack and musical exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Note 1: Clear strike (G5 ~783.99 Hz)
    playBellTone(783.99, now, 0.45, 0.35, 'sine');
    playBellTone(1567.98, now, 0.25, 0.12, 'triangle'); // 1st harmonic sparkle

    // Note 2: Uplifting chord step (B5 ~987.77 Hz)
    playBellTone(987.77, now + 0.11, 0.55, 0.38, 'sine');
    playBellTone(1975.53, now + 0.11, 0.3, 0.14, 'triangle');

    // Note 3: Executive crest & resolution bell (E6 ~1318.51 Hz) with resonant sustain
    playBellTone(1318.51, now + 0.22, 1.1, 0.42, 'sine');
    playBellTone(2637.02, now + 0.22, 0.65, 0.16, 'triangle'); // high shimmer
    playBellTone(659.25, now + 0.22, 1.2, 0.25, 'sine'); // warm fundamental body (E5)
  } catch {
    // Fallback or restriction handle
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
 * Dispatches a native desktop / Windows notification while also playing the notable ERP sound.
 * Explicitly sets `silent: false` so Windows Action Center sounds its system alert tone as well.
 */
export function sendDesktopNotification(payload: DesktopNotificationPayload): boolean {
  const { title, body, tag, icon, url, playChime = true } = payload;

  // 1. Play notable sound in ERP (as long as sound is enabled)
  if (playChime && isDesktopNotificationSoundEnabled()) {
    playNotificationChime();
  }

  // 2. Check if desktop notifications are enabled and permission granted
  if (!isDesktopNotificationEnabled()) {
    return false;
  }

  // 3. Dispatch native Windows toast via Web Notification API with notable Windows system sound
  try {
    const notif = new Notification(title, {
      body,
      tag,
      icon: icon || '/amenmart-app-icon-4k.png',
      badge: '/amenmart-app-icon-4k.png',
      // Explicitly tell Windows Action Center NOT to silence the system sound
      silent: false,
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
 * Guarantees a notable sound in BOTH ERP and Windows:
 * 1. Plays the executive Web Audio chime inside the ERP workspace.
 * 2. If Windows notifications are enabled, toasts in Windows Action Center with Windows system sound.
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

  // In ERP: Always play notable sound on new inbound inquiry (even if desktop toasts are not configured yet)
  if (options?.playChime ?? true) {
    playNotificationChime();
  }

  // In Windows: Send desktop notification (which triggers Windows notification chime & toast)
  return sendDesktopNotification({
    title,
    body,
    tag: `lead-${lead.id}`,
    icon: '/amenmart-app-icon-4k.png',
    url,
    playChime: false, // Already sounded above for ERP
  });
}

/**
 * Classifies and parses decoded QR payloads.
 *
 * Decoded QR text is untrusted input: anyone can print a code. Nothing here navigates
 * or evaluates it; `safeHttpUrl` is the only gate through which a payload may become a
 * clickable link, and it admits http(s) only (never javascript:, data:, file:, ...).
 */

export type QRContentType = 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'contact' | 'event' | 'geo' | 'text';

export const QR_TYPE_LABELS: Record<QRContentType, string> = {
  url: 'Website',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  wifi: 'Wi-Fi',
  contact: 'Contact',
  event: 'Event',
  geo: 'Location',
  text: 'Text',
};

/** Returns a normalised http(s) URL string, or null if `content` is not one. */
export const safeHttpUrl = (content: string): string | null => {
  const trimmed = content.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
};

export const detectQRType = (content: string): QRContentType => {
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  if (safeHttpUrl(trimmed)) return 'url';
  if (lower.startsWith('mailto:') || lower.startsWith('matmsg:')) return 'email';
  if (lower.startsWith('tel:')) return 'phone';
  if (lower.startsWith('sms:') || lower.startsWith('smsto:')) return 'sms';
  if (lower.startsWith('wifi:')) return 'wifi';
  if (lower.startsWith('begin:vcard') || lower.startsWith('mecard:')) return 'contact';
  if (lower.startsWith('begin:vevent') || lower.startsWith('begin:vcalendar')) return 'event';
  if (lower.startsWith('geo:')) return 'geo';
  return 'text';
};

export interface WifiDetails {
  ssid: string;
  security: string;
  password: string;
  hidden: boolean;
}

/** Splits on `;` while honouring the backslash escapes used by the WIFI: format. */
const splitEscaped = (body: string): string[] => {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && i + 1 < body.length) {
      current += body[++i];
    } else if (ch === ';') {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
};

/** Parses `WIFI:T:WPA;S:MyNetwork;P:secret;H:false;;`. Returns null if malformed. */
export const parseWifi = (content: string): WifiDetails | null => {
  const trimmed = content.trim();
  if (!/^wifi:/i.test(trimmed)) return null;
  const details: WifiDetails = { ssid: '', security: '', password: '', hidden: false };
  for (const field of splitEscaped(trimmed.slice(5))) {
    const sep = field.indexOf(':');
    if (sep < 1) continue;
    const key = field.slice(0, sep).toUpperCase();
    const value = field.slice(sep + 1);
    if (key === 'S') details.ssid = value;
    else if (key === 'T') details.security = value;
    else if (key === 'P') details.password = value;
    else if (key === 'H') details.hidden = value.toLowerCase() === 'true';
  }
  return details.ssid ? details : null;
};

/** Readable key/value pairs from a vCard or vEvent, skipping structural lines. */
export const parseKeyValueCard = (content: string): Array<{ key: string; value: string }> => {
  const labels: Record<string, string> = {
    FN: 'Name',
    N: 'Name',
    ORG: 'Organization',
    TITLE: 'Title',
    TEL: 'Phone',
    EMAIL: 'Email',
    ADR: 'Address',
    URL: 'Website',
    NOTE: 'Note',
    SUMMARY: 'Event',
    DTSTART: 'Starts',
    DTEND: 'Ends',
    LOCATION: 'Location',
    DESCRIPTION: 'Description',
  };
  const seen = new Set<string>();
  const rows: Array<{ key: string; value: string }> = [];
  // Unfold RFC 6350 continuation lines (a line starting with a space continues the previous one).
  const lines = content.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep < 1) continue;
    const rawKey = line.slice(0, sep).split(';')[0].toUpperCase();
    if (['BEGIN', 'END', 'VERSION', 'PRODID'].includes(rawKey)) continue;
    const label = labels[rawKey];
    if (!label) continue;
    // Structured values (N, ADR) use ';' between components.
    const value = line
      .slice(sep + 1)
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .join(rawKey === 'N' ? ' ' : ', ')
      .replace(/\\([,;\\])/g, '$1')
      .replace(/\\n/gi, ' ');
    if (!value) continue;
    // FN and N both map to "Name"; show whichever comes first.
    if (label === 'Name' && seen.has('Name')) continue;
    seen.add(label);
    rows.push({ key: label, value });
  }
  return rows;
};

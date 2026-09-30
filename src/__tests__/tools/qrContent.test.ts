import { describe, it, expect } from 'vitest';
import { detectQRType, parseKeyValueCard, parseWifi, safeHttpUrl } from '../../tools/lib/qrContent';

describe('safeHttpUrl', () => {
  it('accepts http and https only', () => {
    expect(safeHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeHttpUrl('HTTP://EXAMPLE.COM')).toBe('http://example.com/');
  });

  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['file:///etc/passwd'],
    ['mailto:a@b.com'],
    ['  javascript:alert(1)'],
    ['https://'],
    ['example.com'],
  ])('rejects %s', (input) => {
    expect(safeHttpUrl(input)).toBeNull();
  });
});

describe('detectQRType', () => {
  it.each([
    ['https://example.com', 'url'],
    ['mailto:a@b.com', 'email'],
    ['tel:+123', 'phone'],
    ['SMSTO:+123:hi', 'sms'],
    ['WIFI:T:WPA;S:Home;P:pw;;', 'wifi'],
    ['BEGIN:VCARD\nFN:Jane\nEND:VCARD', 'contact'],
    ['BEGIN:VEVENT\nSUMMARY:Party\nEND:VEVENT', 'event'],
    ['geo:1,2', 'geo'],
    ['javascript:alert(1)', 'text'],
    ['hello', 'text'],
  ])('%s -> %s', (content, type) => {
    expect(detectQRType(content)).toBe(type);
  });
});

describe('parseWifi', () => {
  it('parses fields and escapes', () => {
    expect(parseWifi('WIFI:T:WPA;S:My\\;Net;P:pa\\:ss;H:true;;')).toEqual({
      ssid: 'My;Net',
      security: 'WPA',
      password: 'pa:ss',
      hidden: true,
    });
  });

  it('returns null without an SSID', () => {
    expect(parseWifi('WIFI:T:WPA;;')).toBeNull();
  });
});

describe('parseKeyValueCard', () => {
  it('extracts readable fields from a vCard', () => {
    const rows = parseKeyValueCard('BEGIN:VCARD\nVERSION:3.0\nFN:Jane Doe\nN:Doe;Jane;;;\nTEL;TYPE=cell:+1 555\nEMAIL:j@x.com\nEND:VCARD');
    expect(rows).toEqual([
      { key: 'Name', value: 'Jane Doe' },
      { key: 'Phone', value: '+1 555' },
      { key: 'Email', value: 'j@x.com' },
    ]);
  });
});

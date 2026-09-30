import { describe, it, expect } from 'vitest';
import { validateTargetUrl } from '../../../api/shorten';

describe('validateTargetUrl (api/shorten)', () => {
  it.each([
    ['https://example.com/some/long/path?x=1'],
    ['http://sub.example.co.uk'],
    ['https://1.1.1.1/dns'],
    ['https://example.com:8443/'],
  ])('accepts %s', (url) => {
    expect(validateTargetUrl(url).ok).toBe(true);
  });

  it.each([
    [undefined],
    [42],
    [''],
    ['not a url'],
    ['ftp://example.com/file'],
    ['javascript:alert(1)'],
    ['https://user:pass@example.com'],
    ['http://localhost:3000'],
    ['http://app.localhost'],
    ['http://printer.local'],
    ['http://intranet'],
    ['http://127.0.0.1'],
    ['http://2130706433'], // decimal 127.0.0.1
    ['http://0x7f.1'], // hex 127.0.0.1
    ['http://10.0.0.5'],
    ['http://172.20.1.1'],
    ['http://192.168.1.1'],
    ['http://169.254.169.254/latest/meta-data'],
    ['http://100.64.0.1'],
    ['http://[::1]/'],
    ['http://[fd00::1]/'],
    ['http://[fe80::1]/'],
    ['http://[::ffff:127.0.0.1]/'],
    [`https://example.com/${'a'.repeat(2048)}`],
  ])('rejects %s', (url) => {
    expect(validateTargetUrl(url).ok).toBe(false);
  });
});

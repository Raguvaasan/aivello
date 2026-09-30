import { describe, it, expect } from 'vitest';
import {
  addDaysISO,
  calculateInvoiceTotals,
  formatCurrency,
  formatCurrencyForPdf,
  isBlankItem,
  lineAmount,
  parseISODate,
  parseNumber,
  roundMoney,
  toLocalISODate,
  validateInvoice,
  InvoiceValidationInput,
} from '../../tools/lib/invoiceMath';

describe('roundMoney', () => {
  it('rounds half away from zero despite binary floating point', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(1234.565)).toBe(1234.57);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(-1.005)).toBe(-1.01);
  });

  it('returns 0 for non-finite input and never -0', () => {
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
    expect(Object.is(roundMoney(-0.001), 0)).toBe(true);
  });
});

describe('parseNumber / lineAmount', () => {
  it('treats blank and invalid input as 0', () => {
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('  ')).toBe(0);
    expect(parseNumber('abc')).toBe(0);
    expect(parseNumber(' 2.5 ')).toBe(2.5);
  });

  it('multiplies quantity by rate and rounds to cents', () => {
    expect(lineAmount('3', '19.99')).toBe(59.97);
    expect(lineAmount('0.333', '3')).toBe(1);
    expect(lineAmount('-2', '10')).toBe(0);
  });
});

describe('calculateInvoiceTotals', () => {
  it('applies discount before tax and every figure adds up to the cent', () => {
    const totals = calculateInvoiceTotals(
      [
        { quantity: '2', rate: '49.99' },
        { quantity: '1', rate: '100.005' },
      ],
      '8.25',
      '10'
    );
    expect(totals.lineAmounts).toEqual([99.98, 100.01]);
    expect(totals.subtotal).toBe(199.99);
    expect(totals.discount).toBe(20);
    expect(totals.taxableAmount).toBe(179.99);
    expect(totals.tax).toBe(14.85);
    expect(totals.total).toBe(194.84);
    expect(roundMoney(totals.subtotal - totals.discount + totals.tax)).toBe(totals.total);
  });

  it('clamps rates to 0-100 and handles an empty invoice', () => {
    expect(calculateInvoiceTotals([], '', '').total).toBe(0);
    const totals = calculateInvoiceTotals([{ quantity: '1', rate: '50' }], '-5', '150');
    expect(totals.discountRate).toBe(100);
    expect(totals.taxRate).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe('currency formatting', () => {
  it('always shows two decimals', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(0, 'GBP')).toBe('£0.00');
  });

  it('uses Indian digit grouping for INR', () => {
    expect(formatCurrency(123456.789, 'INR')).toContain('1,23,456.79');
  });

  it('falls back to the ISO code in PDFs when the symbol cannot be drawn', () => {
    expect(formatCurrencyForPdf(10, 'INR')).toContain('INR');
    expect(formatCurrencyForPdf(10, 'USD')).toBe('$10.00');
  });
});

describe('dates', () => {
  it('formats the local calendar day, not the UTC one', () => {
    expect(toLocalISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('parses strictly and adds days across month ends', () => {
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('not a date')).toBeNull();
    expect(addDaysISO('2026-01-31', 30)).toBe('2026-03-02');
  });
});

describe('validateInvoice', () => {
  const valid: InvoiceValidationInput = {
    invoiceNumber: 'INV-1',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    companyName: 'Acme',
    companyEmail: '',
    clientName: 'Client',
    clientEmail: 'client@example.com',
    taxRate: '',
    discountRate: '',
    items: [
      { id: 'a', description: 'Work', quantity: '1', rate: '100' },
      { id: 'b', description: '', quantity: '1', rate: '' },
    ],
  };

  it('accepts a valid invoice and ignores untouched rows', () => {
    expect(isBlankItem(valid.items[1])).toBe(true);
    expect(validateInvoice(valid).valid).toBe(true);
  });

  it('reports field and item problems', () => {
    const result = validateInvoice({
      ...valid,
      invoiceNumber: ' ',
      dueDate: '2026-02-01',
      clientEmail: 'nope',
      taxRate: '120',
      items: [{ id: 'a', description: '', quantity: '1', rate: '10' }],
    });
    expect(result.valid).toBe(false);
    expect(result.fields.invoiceNumber).toBeDefined();
    expect(result.fields.dueDate).toMatch(/before/);
    expect(result.fields.clientEmail).toBeDefined();
    expect(result.fields.taxRate).toBeDefined();
    expect(result.items.a).toMatch(/description/);
  });

  it('requires at least one line item', () => {
    const result = validateInvoice({ ...valid, items: [{ id: 'x', description: '', quantity: '1', rate: '' }] });
    expect(result.fields.items).toBeDefined();
  });
});

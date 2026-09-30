import { describe, it, expect } from 'vitest';
import { buildResumeDocx, buildResumePdf } from '../../tools/lib/resumeBuilderExport';
import { buildInvoicePdf, invoiceFileName } from '../../tools/lib/invoicePdf';
import { calculateInvoiceTotals } from '../../tools/lib/invoiceMath';
import { TEMPLATES, createSampleResume } from '../../tools/lib/resumeBuilderData';

// 1x1 transparent PNG.
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const pdfHeader = (doc: { output: (type: 'arraybuffer') => ArrayBuffer }) =>
  new TextDecoder().decode(new Uint8Array(doc.output('arraybuffer')).slice(0, 5));

describe('resume PDF export', () => {
  it.each(TEMPLATES.map((t) => t.id))('renders the sample with the %s template', async (templateId) => {
    const template = TEMPLATES.find((t) => t.id === templateId)!;
    const doc = await buildResumePdf(createSampleResume(), {
      templateId,
      accent: template.accent,
      font: template.font,
    });
    expect(pdfHeader(doc)).toBe('%PDF-');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('adds pages for long content and survives a photo and non-Latin text', async () => {
    const form = createSampleResume();
    form.profilePhoto = PIXEL_PNG;
    form.name = `Alex ${String.fromCharCode(0xba4, 0xbae)}`; // includes Tamil letters
    form.experiences[0].description = Array.from({ length: 120 }, (_, i) => `- Achievement number ${i + 1}`).join('\n');
    const doc = await buildResumePdf(form, { templateId: 'creative', accent: 'purple', font: 'mono' });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});

describe('resume Word export', () => {
  it('produces a non-empty .docx blob', async () => {
    const form = createSampleResume();
    form.profilePhoto = PIXEL_PNG;
    const blob = await buildResumeDocx(form, { templateId: 'classic', accent: 'blue', font: 'sans' });
    expect(blob.size).toBeGreaterThan(1000);
  });
});

describe('invoice PDF export', () => {
  it('paginates long invoices', async () => {
    const items = Array.from({ length: 80 }, (_, i) => ({
      description: `Consulting session ${i + 1} with a fairly long description that needs wrapping onto a second line`,
      quantity: 1.5,
      rate: 120,
      amount: 180,
    }));
    const totals = calculateInvoiceTotals(
      items.map((i) => ({ quantity: i.quantity, rate: i.rate })),
      '18',
      '5'
    );
    const doc = await buildInvoicePdf({
      invoiceNumber: 'INV-2026/001',
      date: '2026-03-01',
      dueDate: '2026-03-31',
      from: { name: 'Acme Studio', address: '1 Main St\nSpringfield', email: 'billing@example.com', phone: '555-0100' },
      to: { name: 'Client Co', address: '', email: '' },
      items,
      totals,
      notes: 'Thank you for your business.',
      currency: 'INR',
    });
    expect(pdfHeader(doc)).toBe('%PDF-');
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(invoiceFileName('INV-2026/001')).toBe('invoice-INV-2026-001.pdf');
  });
});

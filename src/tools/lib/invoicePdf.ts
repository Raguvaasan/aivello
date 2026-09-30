/**
 * Invoice PDF rendering with jsPDF.
 *
 * jsPDF is imported lazily inside {@link buildInvoicePdf} so it is only downloaded
 * when the user actually exports; only its type is imported statically.
 */
import type { jsPDF as JsPDF } from 'jspdf';
import {
  CurrencyCode,
  InvoiceTotals,
  formatCurrencyForPdf,
  formatDisplayDate,
  formatQuantity,
} from './invoiceMath';
import { toPdfSafeText } from './pdfSafeText';

export interface InvoicePdfParty {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

export interface InvoicePdfLine {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  from: InvoicePdfParty;
  to: InvoicePdfParty;
  items: InvoicePdfLine[];
  totals: InvoiceTotals;
  notes: string;
  currency: CurrencyCode;
}

/** Brand accent (Tailwind violet-600). */
const ACCENT: [number, number, number] = [124, 58, 237];
const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];

const PAGE_MARGIN = 20;
const BOTTOM_LIMIT = 277; // A4 is 297mm tall; leave room for the page footer
const PT_TO_MM = 0.3528;

const lineHeight = (fontSize: number) => fontSize * PT_TO_MM * 1.35;

/** `invoice-INV-001.pdf`, with characters that are illegal in file names removed. */
export const invoiceFileName = (invoiceNumber: string): string => {
  const safe = invoiceNumber.trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `invoice-${safe || 'draft'}.pdf`;
};

export const buildInvoicePdf = async (data: InvoicePdfData): Promise<JsPDF> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - PAGE_MARGIN;
  const money = (n: number) => formatCurrencyForPdf(n, data.currency);
  const safe = (s: string) => toPdfSafeText(s);

  let y = PAGE_MARGIN;

  // ---- Header -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...ACCENT);
  doc.text('INVOICE', PAGE_MARGIN, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  const meta: Array<[string, string]> = [
    ['Invoice #', data.invoiceNumber],
    ['Date', formatDisplayDate(data.date, data.currency)],
  ];
  if (data.dueDate.trim()) meta.push(['Due date', formatDisplayDate(data.dueDate, data.currency)]);

  // Right-align the values and put the labels just left of the widest one, so a long
  // invoice number never runs into its label.
  doc.setFont('helvetica', 'bold');
  const widestValue = Math.max(...meta.map(([, value]) => doc.getTextWidth(safe(value))));
  const labelRight = right - Math.min(widestValue, 80) - 4;

  let metaY = y + 2;
  meta.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, labelRight, metaY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT);
    doc.text(safe(value), right, metaY, { align: 'right' });
    metaY += lineHeight(10) + 1;
  });

  y = Math.max(y + 18, metaY + 4);

  // ---- From / Bill to -----------------------------------------------------
  const columnWidth = (pageWidth - PAGE_MARGIN * 2 - 10) / 2;
  const renderParty = (title: string, party: InvoicePdfParty, x: number): number => {
    let py = y;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(title.toUpperCase(), x, py);
    py += lineHeight(9) + 1;

    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    const nameLines: string[] = doc.splitTextToSize(safe(party.name), columnWidth);
    doc.text(nameLines, x, py);
    py += nameLines.length * lineHeight(11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    const details = [party.address, party.email, party.phone ?? '']
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n');
    if (details) {
      const lines: string[] = doc.splitTextToSize(safe(details), columnWidth);
      doc.text(lines, x, py);
      py += lines.length * lineHeight(10);
    }
    return py;
  };

  const fromBottom = renderParty('From', data.from, PAGE_MARGIN);
  const toBottom = renderParty('Bill to', data.to, PAGE_MARGIN + columnWidth + 10);
  y = Math.max(fromBottom, toBottom) + 8;

  // ---- Line items ---------------------------------------------------------
  const col = {
    descX: PAGE_MARGIN + 2,
    descWidth: 86,
    qtyRight: PAGE_MARGIN + 110,
    rateRight: PAGE_MARGIN + 140,
    amountRight: right - 2,
  };

  const drawTableHeader = () => {
    doc.setFillColor(...ACCENT);
    doc.rect(PAGE_MARGIN, y, right - PAGE_MARGIN, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const baseline = y + 6;
    doc.text('Description', col.descX, baseline);
    doc.text('Qty', col.qtyRight, baseline, { align: 'right' });
    doc.text('Rate', col.rateRight, baseline, { align: 'right' });
    doc.text('Amount', col.amountRight, baseline, { align: 'right' });
    y += 9;
  };

  const newPage = () => {
    doc.addPage();
    y = PAGE_MARGIN;
  };

  drawTableHeader();
  doc.setFontSize(10);
  const rowLine = lineHeight(10);

  data.items.forEach((item, index) => {
    doc.setFont('helvetica', 'normal');
    const descLines: string[] = doc.splitTextToSize(safe(item.description), col.descWidth);
    const rowHeight = descLines.length * rowLine + 4;

    if (y + rowHeight > BOTTOM_LIMIT) {
      newPage();
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(PAGE_MARGIN, y, right - PAGE_MARGIN, rowHeight, 'F');
    }

    const baseline = y + 2 + rowLine * 0.8;
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(descLines, col.descX, baseline);
    doc.text(formatQuantity(item.quantity, data.currency), col.qtyRight, baseline, { align: 'right' });
    doc.text(money(item.rate), col.rateRight, baseline, { align: 'right' });
    doc.text(money(item.amount), col.amountRight, baseline, { align: 'right' });

    y += rowHeight;
    doc.setDrawColor(229, 231, 235);
    doc.line(PAGE_MARGIN, y, right, y);
  });

  // ---- Totals -------------------------------------------------------------
  const { totals } = data;
  const totalRows: Array<[string, string]> = [['Subtotal', money(totals.subtotal)]];
  if (totals.discount > 0) {
    totalRows.push([`Discount (${formatQuantity(totals.discountRate, data.currency)}%)`, `-${money(totals.discount)}`]);
  }
  if (totals.tax > 0) {
    totalRows.push([`Tax (${formatQuantity(totals.taxRate, data.currency)}%)`, money(totals.tax)]);
  }

  const totalsHeight = (totalRows.length + 1) * (lineHeight(10) + 2) + 12;
  if (y + totalsHeight + 6 > BOTTOM_LIMIT) newPage();
  y += 8;

  const labelX = right - 75;
  doc.setFontSize(10);
  totalRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, labelX, y);
    doc.setTextColor(...TEXT);
    doc.text(value, col.amountRight, y, { align: 'right' });
    y += lineHeight(10) + 2;
  });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(labelX, y - 2, col.amountRight, y - 2);
  doc.setLineWidth(0.2);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ACCENT);
  doc.text('Total', labelX, y);
  doc.text(money(totals.total), col.amountRight, y, { align: 'right' });
  y += lineHeight(13) + 6;

  // ---- Notes --------------------------------------------------------------
  if (data.notes.trim()) {
    if (y + 16 > BOTTOM_LIMIT) newPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('NOTES', PAGE_MARGIN, y);
    y += lineHeight(10) + 1;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    const noteLines: string[] = doc.splitTextToSize(safe(data.notes.trim()), right - PAGE_MARGIN);
    noteLines.forEach((line) => {
      if (y > BOTTOM_LIMIT) newPage();
      doc.text(line, PAGE_MARGIN, y);
      y += lineHeight(10);
    });
  }

  // ---- Page numbers -------------------------------------------------------
  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Page ${page} of ${pageCount}`, right, 290, { align: 'right' });
    }
  }

  return doc;
};

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFileInvoiceDollar, FaDownload, FaPlus, FaTrash, FaPrint, FaSpinner } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { logger } from '../utils/logger';
import {
  CURRENCIES,
  CurrencyCode,
  InvoiceField,
  addDaysISO,
  calculateInvoiceTotals,
  formatCurrency,
  formatDisplayDate,
  formatQuantity,
  isBlankItem,
  isCurrencyCode,
  lineAmount,
  parseNumber,
  toLocalISODate,
  validateInvoice,
} from './lib/invoiceMath';
import { hasUnsupportedPdfChars } from './lib/pdfSafeText';

interface InvoiceItem {
  id: string;
  description: string;
  /** Raw input text, so the field can be cleared and edited freely. */
  quantity: string;
  rate: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: CurrencyCode;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  items: InvoiceItem[];
  taxRate: string;
  discountRate: string;
  notes: string;
}

type TextField = Exclude<keyof InvoiceData, 'items' | 'currency'>;
type ItemField = Exclude<keyof InvoiceItem, 'id'>;

const createInitialInvoice = (): InvoiceData => {
  const today = toLocalISODate(new Date());
  return {
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: today,
    dueDate: addDaysISO(today, 30),
    currency: 'USD',
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    items: [{ id: 'item-1', description: '', quantity: '1', rate: '' }],
    taxRate: '',
    discountRate: '',
    notes: '',
  };
};

/* ---------------------------------------------------------------- styling */

const cardClass =
  'rounded-2xl bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-sm';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const sectionTitleClass = 'text-lg font-semibold text-gray-900 dark:text-white';

const inputClass = (hasError = false) =>
  [
    'w-full px-3 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-800/60',
    'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-purple-500/50 border',
    hasError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600',
  ].join(' ');

const errorProps = (id: string, error?: string) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  ) : null;

/* -------------------------------------------------------------- component */

export default function InvoiceGenerator() {
  const track = useToolTracking('invoice-generator', 'Invoice Generator');
  const baseId = useId();
  const fieldId = (name: string) => `${baseId}-${name}`;

  const [invoice, setInvoice] = useState<InvoiceData>(createInitialInvoice);
  const [attempted, setAttempted] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState<'download' | 'print' | null>(null);

  const nextItemId = useRef(2);
  const objectUrls = useRef<string[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const urls = objectUrls.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /* ------------------------------------------------------------ updates */

  const updateField = useCallback((field: TextField, value: string) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateItem = useCallback((id: string, field: ItemField, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  }, []);

  const addItem = useCallback(() => {
    const id = `item-${nextItemId.current++}`;
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { id, description: '', quantity: '1', rate: '' }],
    }));
    // Move focus to the new row so keyboard users can keep typing.
    requestAnimationFrame(() => document.getElementById(`${baseId}-${id}-description`)?.focus());
  }, [baseId]);

  const removeItem = useCallback((id: string) => {
    setInvoice((prev) =>
      prev.items.length <= 1 ? prev : { ...prev, items: prev.items.filter((item) => item.id !== id) }
    );
  }, []);

  /* ---------------------------------------------------------- derived data */

  const totals = useMemo(
    () => calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discountRate),
    [invoice.items, invoice.taxRate, invoice.discountRate]
  );

  const validation = useMemo(() => validateInvoice(invoice), [invoice]);

  const previewItems = useMemo(
    () =>
      invoice.items
        .map((item, index) => ({ item, amount: totals.lineAmounts[index] ?? 0 }))
        .filter(({ item }) => !isBlankItem(item)),
    [invoice.items, totals.lineAmounts]
  );

  const hasUnsupportedChars = useMemo(
    () =>
      hasUnsupportedPdfChars(
        [
          invoice.invoiceNumber,
          invoice.companyName,
          invoice.companyAddress,
          invoice.companyEmail,
          invoice.companyPhone,
          invoice.clientName,
          invoice.clientAddress,
          invoice.clientEmail,
          invoice.notes,
          ...invoice.items.map((item) => item.description),
        ].join('\n')
      ),
    [invoice]
  );

  const fieldError = (field: InvoiceField) => (attempted ? validation.fields[field] : undefined);
  const itemError = (id: string) => (attempted ? validation.items[id] : undefined);
  const money = (amount: number) => formatCurrency(amount, invoice.currency);

  /* -------------------------------------------------------------- export */

  const ensureValid = (): boolean => {
    setAttempted(true);
    if (validation.valid) {
      setFormError('');
      return true;
    }
    setFormError('Please fix the highlighted fields before exporting.');

    // Focus the first problem so keyboard and screen reader users land on it.
    const order: InvoiceField[] = [
      'invoiceNumber', 'date', 'dueDate', 'companyName', 'companyEmail',
      'clientName', 'clientEmail', 'items', 'taxRate', 'discountRate',
    ];
    const firstField = order.find((f) => validation.fields[f]);
    const firstItem = invoice.items.find((item) => validation.items[item.id]);
    const targetId =
      firstField && firstField !== 'items'
        ? fieldId(firstField)
        : `${baseId}-${(firstItem ?? invoice.items[0]).id}-description`;
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
    return false;
  };

  const buildDocument = async () => {
    const { buildInvoicePdf } = await import('./lib/invoicePdf');
    return buildInvoicePdf({
      invoiceNumber: invoice.invoiceNumber.trim(),
      date: invoice.date,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      from: {
        name: invoice.companyName,
        address: invoice.companyAddress,
        email: invoice.companyEmail,
        phone: invoice.companyPhone,
      },
      to: { name: invoice.clientName, address: invoice.clientAddress, email: invoice.clientEmail },
      items: invoice.items
        .filter((item) => !isBlankItem(item))
        .map((item) => ({
          description: item.description.trim(),
          quantity: parseNumber(item.quantity),
          rate: parseNumber(item.rate),
          amount: lineAmount(item.quantity, item.rate),
        })),
      totals,
      notes: invoice.notes,
    });
  };

  const handleDownload = async () => {
    if (busy || !ensureValid()) return;
    setBusy('download');
    try {
      const [{ invoiceFileName }, doc] = await Promise.all([import('./lib/invoicePdf'), buildDocument()]);
      doc.save(invoiceFileName(invoice.invoiceNumber));
      track('download');
      toast.success('Invoice PDF downloaded');
    } catch (error) {
      logger.error('Invoice PDF generation failed', error);
      if (mounted.current) setFormError('Could not generate the PDF. Please try again.');
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const handlePrint = async () => {
    if (busy || !ensureValid()) return;
    // Open the tab now, while the click still counts as a user gesture: popup blockers
    // reject a window.open() made after the awaits below.
    const printWindow = window.open('', '_blank');
    setBusy('print');
    try {
      const [{ invoiceFileName }, doc] = await Promise.all([import('./lib/invoicePdf'), buildDocument()]);
      doc.autoPrint();
      const url = URL.createObjectURL(doc.output('blob'));
      objectUrls.current.push(url);
      if (printWindow && !printWindow.closed) {
        printWindow.opener = null;
        printWindow.location.href = url;
      } else {
        doc.save(invoiceFileName(invoice.invoiceNumber));
        toast('Pop-ups are blocked, so the PDF was downloaded instead. Print it from there.');
      }
      track('use');
    } catch (error) {
      printWindow?.close();
      logger.error('Invoice print failed', error);
      if (mounted.current) setFormError('Could not prepare the invoice for printing. Please try again.');
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  /* -------------------------------------------------------------- render */

  const renderTextInput = (
    field: TextField,
    label: string,
    options: { type?: string; placeholder?: string; error?: InvoiceField; autoComplete?: string; maxLength?: number } = {}
  ) => {
    const id = fieldId(field);
    const error = options.error ? fieldError(options.error) : undefined;
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <input
          id={id}
          type={options.type ?? 'text'}
          value={invoice[field]}
          placeholder={options.placeholder}
          autoComplete={options.autoComplete ?? 'off'}
          maxLength={options.maxLength ?? 200}
          onChange={(e) => updateField(field, e.target.value)}
          className={inputClass(!!error)}
          {...errorProps(id, error)}
        />
        <FieldError id={id} message={error} />
      </div>
    );
  };

  const renderTextarea = (field: TextField, label: string, placeholder: string, rows = 2) => {
    const id = fieldId(field);
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <textarea
          id={id}
          value={invoice[field]}
          placeholder={placeholder}
          rows={rows}
          maxLength={1000}
          onChange={(e) => updateField(field, e.target.value)}
          className={`${inputClass()} resize-y`}
        />
      </div>
    );
  };

  const itemsError = fieldError('items');

  return (
    <ToolWrapper
      toolId="invoice-generator"
      toolName="Professional Invoice Generator"
      toolDescription="Create professional invoices instantly. Generate PDF invoices with itemized billing, tax calculations, and custom branding"
      toolCategory="Business"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className={`${cardClass} p-4 sm:p-6`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <IconWrapper icon={FaFileInvoiceDollar} className="text-xl" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Generator</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Fill in the details, check the preview, then download or print.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              >
                <IconWrapper icon={busy === 'download' ? FaSpinner : FaDownload} className={busy === 'download' ? 'animate-spin' : ''} />
                {busy === 'download' ? 'Generating…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              >
                <IconWrapper icon={busy === 'print' ? FaSpinner : FaPrint} className={busy === 'print' ? 'animate-spin' : ''} />
                {busy === 'print' ? 'Preparing…' : 'Print'}
              </button>
            </div>
          </div>

          <div aria-live="polite" className="space-y-3 mb-6 empty:hidden">
            {formError && (
              <div role="alert" className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                {formError}
              </div>
            )}
            {hasUnsupportedChars && (
              <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
                Some characters (for example non-Latin scripts or emoji) can’t be drawn by the PDF fonts
                and will appear as “?” in the downloaded invoice.
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* ---------------------------------------------------------- Form */}
            <div className="space-y-6 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderTextInput('invoiceNumber', 'Invoice number', { error: 'invoiceNumber', maxLength: 40 })}
                <div>
                  <label htmlFor={fieldId('currency')} className={labelClass}>
                    Currency
                  </label>
                  <select
                    id={fieldId('currency')}
                    value={invoice.currency}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (isCurrencyCode(next)) setInvoice((prev) => ({ ...prev, currency: next }));
                    }}
                    className={inputClass()}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-white dark:bg-gray-800">
                        {c.code} – {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {renderTextInput('date', 'Invoice date', { type: 'date', error: 'date' })}
                {renderTextInput('dueDate', 'Due date', { type: 'date', error: 'dueDate' })}
              </div>

              <fieldset className="space-y-3">
                <legend className={`${sectionTitleClass} mb-3`}>Your information</legend>
                {renderTextInput('companyName', 'Business name', {
                  placeholder: 'Your company or full name',
                  error: 'companyName',
                  autoComplete: 'organization',
                })}
                {renderTextarea('companyAddress', 'Address', 'Street, city, postcode')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderTextInput('companyEmail', 'Email', {
                    type: 'email',
                    placeholder: 'billing@yourcompany.com',
                    error: 'companyEmail',
                    autoComplete: 'email',
                  })}
                  {renderTextInput('companyPhone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className={`${sectionTitleClass} mb-3`}>Bill to</legend>
                {renderTextInput('clientName', 'Client name', { error: 'clientName' })}
                {renderTextarea('clientAddress', 'Client address', 'Street, city, postcode')}
                {renderTextInput('clientEmail', 'Client email', { type: 'email', error: 'clientEmail' })}
              </fieldset>

              {/* Line items */}
              <div
                role="group"
                aria-labelledby={fieldId('items-title')}
                aria-describedby={itemsError ? `${fieldId('items')}-error` : undefined}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 id={fieldId('items-title')} className={sectionTitleClass}>
                    Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                  >
                    <IconWrapper icon={FaPlus} />
                    Add item
                  </button>
                </div>

                <div aria-hidden="true" className="hidden sm:grid grid-cols-12 gap-2 px-1 mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                <div className="space-y-3">
                  {invoice.items.map((item, index) => {
                    const rowId = `${baseId}-${item.id}`;
                    const error = itemError(item.id);
                    const itemLabel = `item ${index + 1}`;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg p-3 sm:p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                      >
                        <div className="grid grid-cols-12 gap-2 items-end sm:items-center">
                          <div className="col-span-12 sm:col-span-5">
                            <label htmlFor={`${rowId}-description`} className="sm:sr-only block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Description ({itemLabel})
                            </label>
                            <input
                              id={`${rowId}-description`}
                              type="text"
                              placeholder="Description"
                              value={item.description}
                              maxLength={300}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className={inputClass(!!error)}
                              {...errorProps(rowId, error)}
                            />
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <label htmlFor={`${rowId}-quantity`} className="sm:sr-only block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Quantity ({itemLabel})
                            </label>
                            <input
                              id={`${rowId}-quantity`}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              className={inputClass(!!error)}
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <label htmlFor={`${rowId}-rate`} className="sm:sr-only block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Rate ({itemLabel})
                            </label>
                            <input
                              id={`${rowId}-rate`}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                              className={inputClass(!!error)}
                            />
                          </div>
                          <div
                            className="col-span-3 sm:col-span-2 pb-2.5 sm:pb-0 text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200 truncate"
                            title={money(totals.lineAmounts[index] ?? 0)}
                          >
                            <span className="sr-only">Amount: </span>
                            {money(totals.lineAmounts[index] ?? 0)}
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={invoice.items.length <= 1}
                              aria-label={`Remove ${itemLabel}`}
                              title={invoice.items.length <= 1 ? 'An invoice needs at least one row' : `Remove ${itemLabel}`}
                              className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                            >
                              <IconWrapper icon={FaTrash} />
                            </button>
                          </div>
                        </div>
                        <FieldError id={rowId} message={error} />
                      </div>
                    );
                  })}
                </div>
                <FieldError id={fieldId('items')} message={itemsError} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['taxRate', 'discountRate'] as const).map((field) => {
                  const id = fieldId(field);
                  const error = fieldError(field);
                  return (
                    <div key={field}>
                      <label htmlFor={id} className={labelClass}>
                        {field === 'taxRate' ? 'Tax rate (%)' : 'Discount (%)'}
                      </label>
                      <input
                        id={id}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="0"
                        value={invoice[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        className={inputClass(!!error)}
                        {...errorProps(id, error)}
                      />
                      <FieldError id={id} message={error} />
                    </div>
                  );
                })}
              </div>
              <p className="-mt-3 text-xs text-gray-500 dark:text-gray-400">
                The discount is applied first; tax is charged on the discounted amount.
              </p>

              {renderTextarea('notes', 'Notes', 'Payment terms, bank details, thank-you note…', 3)}
            </div>

            {/* ------------------------------------------------------- Preview */}
            <section aria-labelledby={fieldId('preview-title')} className="min-w-0">
              <h3 id={fieldId('preview-title')} className={`${sectionTitleClass} mb-4`}>
                Preview
              </h3>
              {/* The "paper" stays white with dark text in both themes: it represents the printed page. */}
              <div className="bg-white text-gray-900 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 min-h-96 lg:sticky lg:top-24">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-violet-600">INVOICE</p>
                    <p className="text-sm text-gray-600 break-all">#{invoice.invoiceNumber || '—'}</p>
                  </div>
                  <dl className="text-right text-sm text-gray-700 space-y-0.5">
                    <div>
                      <dt className="inline text-gray-500">Date: </dt>
                      <dd className="inline">{formatDisplayDate(invoice.date, invoice.currency) || '—'}</dd>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <dt className="inline text-gray-500">Due: </dt>
                        <dd className="inline">{formatDisplayDate(invoice.dueDate, invoice.currency)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-1">From</p>
                    <div className="text-gray-600 break-words whitespace-pre-line">
                      <p className="font-medium text-gray-900">{invoice.companyName || 'Your company'}</p>
                      {invoice.companyAddress && <p>{invoice.companyAddress}</p>}
                      {invoice.companyEmail && <p>{invoice.companyEmail}</p>}
                      {invoice.companyPhone && <p>{invoice.companyPhone}</p>}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-1">Bill to</p>
                    <div className="text-gray-600 break-words whitespace-pre-line">
                      <p className="font-medium text-gray-900">{invoice.clientName || 'Client name'}</p>
                      {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
                      {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-violet-600 text-white">
                        <th scope="col" className="text-left p-2 font-semibold">Description</th>
                        <th scope="col" className="text-right p-2 font-semibold">Qty</th>
                        <th scope="col" className="text-right p-2 font-semibold">Rate</th>
                        <th scope="col" className="text-right p-2 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            Add a line item to see it here.
                          </td>
                        </tr>
                      ) : (
                        previewItems.map(({ item, amount }) => (
                          <tr key={item.id} className="border-b border-gray-200 align-top">
                            <td className="p-2 break-words">{item.description || '—'}</td>
                            <td className="p-2 text-right tabular-nums">
                              {formatQuantity(parseNumber(item.quantity), invoice.currency)}
                            </td>
                            <td className="p-2 text-right tabular-nums whitespace-nowrap">{money(parseNumber(item.rate))}</td>
                            <td className="p-2 text-right tabular-nums whitespace-nowrap">{money(amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <dl className="w-full sm:w-72 space-y-2 text-sm" aria-live="polite">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">Subtotal</dt>
                      <dd className="tabular-nums">{money(totals.subtotal)}</dd>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Discount ({formatQuantity(totals.discountRate, invoice.currency)}%)</dt>
                        <dd className="tabular-nums">-{money(totals.discount)}</dd>
                      </div>
                    )}
                    {totals.tax > 0 && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">Tax ({formatQuantity(totals.taxRate, invoice.currency)}%)</dt>
                        <dd className="tabular-nums">{money(totals.tax)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 font-bold text-violet-600 text-lg border-t border-gray-200 pt-2">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{money(totals.total)}</dd>
                    </div>
                  </dl>
                </div>

                {invoice.notes.trim() && (
                  <div className="mt-6 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 mb-1">Notes</p>
                    <p className="text-gray-700 whitespace-pre-line break-words">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Pro tips</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Include clear payment terms and a due date.</li>
              <li>Double-check the client’s details and the totals before sending.</li>
              <li>Keep a copy of every invoice for your tax records.</li>
              <li>Follow up on overdue invoices promptly.</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Everything stays in your browser; nothing you type here is uploaded.
            </p>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

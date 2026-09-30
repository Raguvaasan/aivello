/**
 * Pure invoice logic: money rounding, totals, currency/date formatting and validation.
 *
 * Kept free of React and jsPDF so it can be unit tested and shared by the on-screen
 * preview and the PDF export - the two must never disagree about a total.
 */
import { hasUnsupportedPdfChars } from './pdfSafeText';

/* ------------------------------------------------------------------ numbers */

/** Parses a form value to a finite number; blank or invalid input counts as 0. */
export const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** True when `value` is blank or a finite number. */
export const isNumericInput = (value: string): boolean =>
  value.trim() === '' || Number.isFinite(Number(value.trim()));

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Rounds to 2 decimals, half away from zero, without binary floating point surprises:
 * `1.005 * 100` is `100.49999999999999`, so a naive `Math.round(x * 100) / 100` turns
 * 1.005 into 1.00. Trimming the product to 15 significant digits first fixes that.
 */
export const roundMoney = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const cents = Math.round(Number((Math.abs(value) * 100).toPrecision(15)));
  return (sign * cents) / 100 || 0; // `|| 0` turns -0 into 0
};

/* ------------------------------------------------------------------- totals */

export interface InvoiceLineInput {
  quantity: string | number;
  rate: string | number;
}

export interface InvoiceTotals {
  /** Rounded amount for each line, in the same order as the input. */
  lineAmounts: number[];
  subtotal: number;
  discountRate: number;
  discount: number;
  /** Subtotal after discount - the base tax is charged on. */
  taxableAmount: number;
  taxRate: number;
  tax: number;
  total: number;
}

/** quantity x rate, rounded to cents. Negative inputs are treated as 0. */
export const lineAmount = (quantity: string | number, rate: string | number): number =>
  roundMoney(Math.max(0, parseNumber(quantity)) * Math.max(0, parseNumber(rate)));

/**
 * Invoice totals. Every intermediate value is rounded to cents, so the figures printed
 * on the invoice always add up (subtotal - discount + tax === total, to the cent).
 *
 * Discount is applied before tax. Rates are percentages clamped to 0-100.
 */
export const calculateInvoiceTotals = (
  items: readonly InvoiceLineInput[],
  taxRate: string | number,
  discountRate: string | number
): InvoiceTotals => {
  const lineAmounts = items.map((item) => lineAmount(item.quantity, item.rate));
  const subtotal = roundMoney(lineAmounts.reduce((sum, amount) => sum + amount, 0));

  const discountPct = clamp(parseNumber(discountRate), 0, 100);
  const taxPct = clamp(parseNumber(taxRate), 0, 100);

  const discount = roundMoney((subtotal * discountPct) / 100);
  const taxableAmount = roundMoney(subtotal - discount);
  const tax = roundMoney((taxableAmount * taxPct) / 100);
  const total = roundMoney(taxableAmount + tax);

  return {
    lineAmounts,
    subtotal,
    discountRate: discountPct,
    discount,
    taxableAmount,
    taxRate: taxPct,
    tax,
    total,
  };
};

/* ---------------------------------------------------------------- currency */

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', locale: 'en-IE' },
  { code: 'GBP', label: 'British Pound', locale: 'en-GB' },
  { code: 'INR', label: 'Indian Rupee', locale: 'en-IN' },
  { code: 'CAD', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', label: 'UAE Dirham', locale: 'en-AE' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const isCurrencyCode = (value: string): value is CurrencyCode =>
  CURRENCIES.some((c) => c.code === value);

export const currencyLocale = (currency: CurrencyCode): string =>
  CURRENCIES.find((c) => c.code === currency)?.locale ?? 'en-US';

const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (key: string, factory: () => Intl.NumberFormat): Intl.NumberFormat => {
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = factory();
    formatterCache.set(key, formatter);
  }
  return formatter;
};

/** Formats a money amount with Intl.NumberFormat, always with exactly 2 decimals. */
export const formatCurrency = (
  amount: number,
  currency: CurrencyCode,
  currencyDisplay: 'symbol' | 'code' = 'symbol'
): string => {
  const locale = currencyLocale(currency);
  const formatter = getFormatter(`${currency}|${currencyDisplay}`, () =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
  return formatter.format(roundMoney(amount));
};

/**
 * Currency string safe for jsPDF's built-in fonts. Symbols the font cannot draw
 * (e.g. the rupee sign) fall back to the ISO code: "INR 1,234.00".
 */
export const formatCurrencyForPdf = (amount: number, currency: CurrencyCode): string => {
  const withSymbol = formatCurrency(amount, currency, 'symbol');
  return hasUnsupportedPdfChars(withSymbol) ? formatCurrency(amount, currency, 'code') : withSymbol;
};

/** Quantity / percentage display: up to 2 decimals, no trailing zeros. */
export const formatQuantity = (value: number, currency: CurrencyCode = 'USD'): string =>
  getFormatter(`qty|${currency}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), { maximumFractionDigits: 2 })
  ).format(value);

/* ------------------------------------------------------------------- dates */

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * `YYYY-MM-DD` for the user's LOCAL calendar day. `toISOString()` uses UTC, which
 * gives yesterday's or tomorrow's date for much of the world around midnight.
 */
export const toLocalISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Parses `YYYY-MM-DD` as a local date; returns null for anything else. */
export const parseISODate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
};

export const addDaysISO = (value: string, days: number): string => {
  const base = parseISODate(value) ?? new Date();
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toLocalISODate(next);
};

/** "12 Mar 2026" style date for display; returns the raw value if it cannot be parsed. */
export const formatDisplayDate = (value: string, currency: CurrencyCode = 'USD'): string => {
  const date = parseISODate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(currencyLocale(currency), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/* -------------------------------------------------------------- validation */

export interface InvoiceItemInput {
  id: string;
  description: string;
  quantity: string;
  rate: string;
}

export interface InvoiceValidationInput {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  companyName: string;
  companyEmail: string;
  clientName: string;
  clientEmail: string;
  taxRate: string;
  discountRate: string;
  items: readonly InvoiceItemInput[];
}

export type InvoiceField =
  | 'invoiceNumber'
  | 'date'
  | 'dueDate'
  | 'companyName'
  | 'companyEmail'
  | 'clientName'
  | 'clientEmail'
  | 'taxRate'
  | 'discountRate'
  | 'items';

export interface InvoiceValidationResult {
  fields: Partial<Record<InvoiceField, string>>;
  /** Per line-item errors keyed by item id. */
  items: Record<string, string>;
  valid: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());

export const MAX_QUANTITY = 1_000_000;
export const MAX_RATE = 1_000_000_000;

/** A row the user has not touched at all - ignored rather than reported. */
export const isBlankItem = (item: InvoiceItemInput): boolean =>
  !item.description.trim() && parseNumber(item.rate) === 0;

const validatePercent = (value: string, label: string): string | undefined => {
  if (!isNumericInput(value)) return `${label} must be a number.`;
  const n = parseNumber(value);
  if (n < 0 || n > 100) return `${label} must be between 0 and 100.`;
  return undefined;
};

export const validateInvoice = (input: InvoiceValidationInput): InvoiceValidationResult => {
  const fields: Partial<Record<InvoiceField, string>> = {};
  const items: Record<string, string> = {};

  if (!input.invoiceNumber.trim()) fields.invoiceNumber = 'Invoice number is required.';

  const issued = parseISODate(input.date);
  if (!issued) fields.date = 'Enter a valid invoice date.';

  if (input.dueDate.trim()) {
    const due = parseISODate(input.dueDate);
    if (!due) fields.dueDate = 'Enter a valid due date.';
    else if (issued && due < issued) fields.dueDate = 'Due date cannot be before the invoice date.';
  }

  if (!input.companyName.trim()) fields.companyName = 'Add your business or your name.';
  if (!input.clientName.trim()) fields.clientName = 'Add who the invoice is for.';
  if (input.companyEmail.trim() && !isValidEmail(input.companyEmail)) {
    fields.companyEmail = 'Enter a valid email address.';
  }
  if (input.clientEmail.trim() && !isValidEmail(input.clientEmail)) {
    fields.clientEmail = 'Enter a valid email address.';
  }

  const tax = validatePercent(input.taxRate, 'Tax rate');
  if (tax) fields.taxRate = tax;
  const discount = validatePercent(input.discountRate, 'Discount');
  if (discount) fields.discountRate = discount;

  const filled = input.items.filter((item) => !isBlankItem(item));
  if (filled.length === 0) {
    fields.items = 'Add at least one line item with a description.';
  }
  for (const item of filled) {
    const qty = item.quantity.trim();
    const rate = item.rate.trim();
    if (!item.description.trim()) items[item.id] = 'Add a description.';
    else if (!isNumericInput(qty) || parseNumber(qty) <= 0) items[item.id] = 'Quantity must be greater than 0.';
    else if (parseNumber(qty) > MAX_QUANTITY) items[item.id] = 'Quantity is too large.';
    else if (!isNumericInput(rate) || parseNumber(rate) < 0) items[item.id] = 'Rate must be 0 or more.';
    else if (parseNumber(rate) > MAX_RATE) items[item.id] = 'Rate is too large.';
  }

  return {
    fields,
    items,
    valid: Object.keys(fields).length === 0 && Object.keys(items).length === 0,
  };
};

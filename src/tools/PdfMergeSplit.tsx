import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import toast from 'react-hot-toast';
import type { PDFDocument } from 'pdf-lib';
import { FiArrowDown, FiArrowUp, FiFileText, FiLayers, FiScissors, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { formatPageList, parsePageRanges } from '../utils/tools/pageRanges';
import { MB, baseName, bytesToBlob, downloadBlob, formatBytes, hasPdfSignature, moveItem, validateFile, type FileRule } from '../utils/tools/fileUtils';

const TOOL_ID = 'pdf-merge-split';
const TOOL_NAME = 'PDF Merge & Split';

const MAX_FILES = 20;
const MAX_PDF_BYTES = 25 * MB;
const PDF_RULE: FileRule = { mimeTypes: ['application/pdf'], extensions: ['pdf'], maxBytes: MAX_PDF_BYTES, label: 'PDF' };
const PDF_ACCEPT = 'application/pdf,.pdf';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full min-w-0 min-h-[44px] bg-white dark:bg-gray-800/60 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-5 py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';
const PILL =
  'flex items-center justify-center min-h-[44px] px-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 dark:peer-checked:bg-purple-500/20 dark:peer-checked:text-purple-100 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50 peer-disabled:opacity-50';
const UPLOAD_LABEL = `${PRIMARY_BTN} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900 peer-disabled:opacity-50 peer-disabled:pointer-events-none`;

/* ------------------------------------------------------------ pdf helpers */

type PdfLib = typeof import('pdf-lib');

let pdfLibPromise: Promise<PdfLib> | null = null;

/** pdf-lib is ~500KB, so it is only fetched the first time a PDF is opened. */
function loadPdfLib(): Promise<PdfLib> {
  if (!pdfLibPromise) {
    pdfLibPromise = import('pdf-lib').catch((err: unknown) => {
      pdfLibPromise = null;
      throw err;
    });
  }
  return pdfLibPromise;
}

class PdfOpenError extends Error {}

async function openPdf(lib: PdfLib, file: File): Promise<PDFDocument> {
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new PdfOpenError(`"${file.name}" could not be read from your device.`);
  }
  if (!hasPdfSignature(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 1024)))) {
    throw new PdfOpenError(`"${file.name}" is not a valid PDF file.`);
  }
  let doc: PDFDocument;
  try {
    doc = await lib.PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err instanceof lib.EncryptedPDFError || (err instanceof Error && /encrypt/i.test(err.message))) {
      throw new PdfOpenError(
        `"${file.name}" is password-protected or encrypted. Remove the protection first (for example open it and use "Print to PDF"), then try again.`
      );
    }
    throw new PdfOpenError(`"${file.name}" could not be opened - it may be damaged.`);
  }
  if (doc.getPageCount() === 0) throw new PdfOpenError(`"${file.name}" has no pages.`);
  return doc;
}

const errorMessage = (err: unknown, fallback: string) => (err instanceof PdfOpenError ? err.message : fallback);

const pluralPages = (n: number) => `${n} page${n === 1 ? '' : 's'}`;

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/* ------------------------------------------------------------- merge panel */

interface MergeItem {
  id: number;
  file: File;
  status: 'loading' | 'ready' | 'error';
  pages: number | null;
  error: string | null;
}

function MergePanel({ onDone }: { onDone: () => void }) {
  const uid = useId();
  const nextId = useRef(1);
  const moveButtons = useRef(new Map<number, { up: HTMLButtonElement | null; down: HTMLButtonElement | null }>());
  const [items, setItems] = useState<MergeItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [progress, setProgress] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null;

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const problems: string[] = [];
    const accepted: MergeItem[] = [];
    let slots = MAX_FILES - items.length;

    for (const file of incoming) {
      const problem = validateFile(file, PDF_RULE);
      if (problem) {
        problems.push(problem);
      } else if (slots <= 0) {
        problems.push(`"${file.name}" was skipped - you can merge up to ${MAX_FILES} files at once.`);
      } else {
        slots -= 1;
        accepted.push({ id: nextId.current++, file, status: 'loading', pages: null, error: null });
      }
    }
    setRejections(problems);
    if (accepted.length === 0) return;
    setItems((prev) => [...prev, ...accepted]);

    let lib: PdfLib;
    try {
      lib = await loadPdfLib();
    } catch {
      const message = 'The PDF engine failed to load. Check your connection and try again.';
      setItems((prev) => prev.map((it) => (accepted.some((a) => a.id === it.id) ? { ...it, status: 'error', error: message } : it)));
      return;
    }

    // Opened one at a time to keep memory use predictable with large files.
    for (const item of accepted) {
      try {
        const doc = await openPdf(lib, item.file);
        const pages = doc.getPageCount();
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'ready', pages } : it)));
      } catch (err) {
        const error = errorMessage(err, `"${item.file.name}" could not be opened.`);
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'error', error } : it)));
      }
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void addFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!busy) void addFiles(e.dataTransfer.files);
  };

  const move = (index: number, direction: 'up' | 'down') => {
    const item = items[index];
    const to = direction === 'up' ? index - 1 : index + 1;
    if (!item || to < 0 || to >= items.length) return;
    const next = moveItem(items, index, to);
    // Commit synchronously so focus can follow the moved row to its new position.
    flushSync(() => setItems(next));
    const buttons = moveButtons.current.get(item.id);
    const preferred = buttons?.[direction];
    const other = buttons?.[direction === 'up' ? 'down' : 'up'];
    (preferred && !preferred.disabled ? preferred : other)?.focus();
    setAnnouncement(`${item.file.name} moved to position ${to + 1} of ${next.length}.`);
  };

  const remove = (index: number) => {
    const item = items[index];
    if (!item) return;
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setAnnouncement(`${item.file.name} removed.`);
  };

  const readyCount = items.filter((it) => it.status === 'ready').length;
  const hasProblems = items.some((it) => it.status !== 'ready');
  const totalPages = items.reduce((sum, it) => sum + (it.pages ?? 0), 0);
  const canMerge = !busy && items.length >= 2 && !hasProblems;

  const merge = async () => {
    if (!canMerge) return;
    try {
      setProgress('Loading PDF engine...');
      const lib = await loadPdfLib();
      const out = await lib.PDFDocument.create();
      for (let i = 0; i < items.length; i += 1) {
        setProgress(`Adding file ${i + 1} of ${items.length}...`);
        const src = await openPdf(lib, items[i].file);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((page) => out.addPage(page));
      }
      setProgress('Saving merged PDF...');
      const bytes = await out.save();
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), 'merged.pdf');
      toast.success(`Merged ${items.length} files (${pluralPages(out.getPageCount())})`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Merging failed. One of the files may be damaged.'));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <IconWrapper icon={FiLayers} className="mx-auto mb-2 h-10 w-10 text-purple-600 dark:text-purple-300" />
        <p className="font-semibold text-gray-900 dark:text-white">Drop PDFs here</p>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Up to {MAX_FILES} files, {formatBytes(MAX_PDF_BYTES)} each
        </p>
        <input
          id={`${uid}-files`}
          type="file"
          accept={PDF_ACCEPT}
          multiple
          disabled={busy || items.length >= MAX_FILES}
          onChange={onFileChange}
          className="peer sr-only"
        />
        <label htmlFor={`${uid}-files`} className={UPLOAD_LABEL}>
          <IconWrapper icon={FiUpload} className="w-4 h-4" />
          {items.length ? 'Add more PDFs' : 'Choose PDFs'}
        </label>
      </div>

      {rejections.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          <ul className="list-disc pl-5 space-y-1">
            {rejections.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white" id={`${uid}-order`}>
              Merge order
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {items.length} file{items.length === 1 ? '' : 's'}
              {readyCount === items.length && ` · ${pluralPages(totalPages)}`}
            </p>
          </div>
          <ol aria-labelledby={`${uid}-order`} className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  item.status === 'error'
                    ? 'border-red-300 dark:border-red-400/40 bg-red-50 dark:bg-red-500/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40'
                }`}
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold text-gray-500 dark:text-gray-400" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className={`text-xs ${item.status === 'error' ? 'text-red-700 dark:text-red-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.status === 'loading' && `${formatBytes(item.file.size)} · checking...`}
                    {item.status === 'ready' && `${formatBytes(item.file.size)} · ${pluralPages(item.pages ?? 0)}`}
                    {item.status === 'error' && item.error}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    ref={(el) => {
                      const entry = moveButtons.current.get(item.id) ?? { up: null, down: null };
                      entry.up = el;
                      moveButtons.current.set(item.id, entry);
                    }}
                    onClick={() => move(index, 'up')}
                    disabled={busy || index === 0}
                    aria-label={`Move ${item.file.name} up`}
                    className={SECONDARY_BTN}
                  >
                    <IconWrapper icon={FiArrowUp} className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    ref={(el) => {
                      const entry = moveButtons.current.get(item.id) ?? { up: null, down: null };
                      entry.down = el;
                      moveButtons.current.set(item.id, entry);
                    }}
                    onClick={() => move(index, 'down')}
                    disabled={busy || index === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                    className={SECONDARY_BTN}
                  >
                    <IconWrapper icon={FiArrowDown} className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={busy}
                    aria-label={`Remove ${item.file.name}`}
                    className={`${SECONDARY_BTN} hover:!bg-red-100 hover:!text-red-700 dark:hover:!bg-red-500/20 dark:hover:!text-red-200`}
                  >
                    <IconWrapper icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={merge} disabled={!canMerge} className={`${PRIMARY_BTN} flex-1`}>
              <IconWrapper icon={FiLayers} className="w-4 h-4" />
              {busy ? 'Merging...' : 'Merge & download'}
            </button>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setRejections([]);
              }}
              disabled={busy}
              className={SECONDARY_BTN}
            >
              <IconWrapper icon={FiX} className="w-4 h-4" />
              Clear all
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
            {progress ??
              (items.length < 2
                ? 'Add at least two PDFs to merge.'
                : hasProblems
                  ? items.some((it) => it.status === 'error')
                    ? 'Remove the files marked in red before merging.'
                    : 'Checking files...'
                  : 'Files are combined top to bottom.')}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- split panel */

interface SplitSource {
  file: File;
  pages: number;
}

function SplitPanel({ onDone }: { onDone: () => void }) {
  const uid = useId();
  const cancelRef = useRef(false);
  const [source, setSource] = useState<SplitSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'ranges' | 'every'>('ranges');
  const [ranges, setRanges] = useState('');
  const [progress, setProgress] = useState<string | null>(null);
  const busy = progress !== null || loading;

  const parsed = useMemo(() => (source ? parsePageRanges(ranges, source.pages) : null), [ranges, source]);
  const showRangeError = mode === 'ranges' && ranges.trim() !== '' && parsed !== null && !parsed.ok;

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateFile(file, PDF_RULE);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const lib = await loadPdfLib();
      const doc = await openPdf(lib, file);
      setSource({ file, pages: doc.getPageCount() });
      setRanges('');
    } catch (err) {
      setSource(null);
      setError(errorMessage(err, 'The PDF engine failed to load. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void pickFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const extract = async () => {
    if (!source || !parsed?.ok) return;
    try {
      setProgress('Extracting pages...');
      const lib = await loadPdfLib();
      const src = await openPdf(lib, source.file);
      const out = await lib.PDFDocument.create();
      const pages = await out.copyPages(
        src,
        parsed.pages.map((p) => p - 1)
      );
      pages.forEach((page) => out.addPage(page));
      const bytes = await out.save();
      const label = formatPageList(parsed.pages);
      const suffix = label.length <= 40 ? `pages-${label.replace(/,/g, '_')}` : 'extract';
      downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${baseName(source.file.name, 'document')}-${suffix}.pdf`);
      toast.success(`Extracted ${pluralPages(parsed.pages.length)}`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Extracting pages failed.'));
    } finally {
      setProgress(null);
    }
  };

  const splitEvery = async () => {
    if (!source) return;
    cancelRef.current = false;
    let saved = 0;
    try {
      setProgress('Opening PDF...');
      const lib = await loadPdfLib();
      const src = await openPdf(lib, source.file);
      const name = baseName(source.file.name, 'document');
      const digits = String(source.pages).length;
      for (let i = 0; i < source.pages; i += 1) {
        if (cancelRef.current) break;
        setProgress(`Saving page ${i + 1} of ${source.pages}...`);
        const out = await lib.PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const bytes = await out.save();
        downloadBlob(bytesToBlob(bytes, 'application/pdf'), `${name}-page-${String(i + 1).padStart(digits, '0')}.pdf`);
        saved += 1;
        // Browsers drop downloads fired in a tight loop; space them out.
        await sleep(350);
      }
      if (saved === source.pages) toast.success(`Saved ${pluralPages(saved)} as separate files`);
      else toast(`Stopped after ${pluralPages(saved)}.`);
      if (saved > 0) onDone();
    } catch (err) {
      toast.error(errorMessage(err, 'Splitting failed.'));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      {!source ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <IconWrapper icon={FiScissors} className="mx-auto mb-2 h-10 w-10 text-purple-600 dark:text-purple-300" />
          <p className="font-semibold text-gray-900 dark:text-white">Choose a PDF to split</p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">One file, up to {formatBytes(MAX_PDF_BYTES)}</p>
          <input id={`${uid}-file`} type="file" accept={PDF_ACCEPT} disabled={busy} onChange={onFileChange} className="peer sr-only" />
          <label htmlFor={`${uid}-file`} className={UPLOAD_LABEL}>
            <IconWrapper icon={FiUpload} className="w-4 h-4" />
            {loading ? 'Opening...' : 'Choose PDF'}
          </label>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
            <IconWrapper icon={FiFileText} className="h-6 w-6 shrink-0 text-purple-600 dark:text-purple-300" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-white" title={source.file.name}>
                {source.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatBytes(source.file.size)} · {pluralPages(source.pages)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSource(null);
                setRanges('');
              }}
              disabled={busy}
              aria-label="Remove PDF and choose another"
              className={SECONDARY_BTN}
            >
              <IconWrapper icon={FiX} className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={busy}>
            <legend className="mb-2 font-semibold text-gray-900 dark:text-white">How do you want to split it?</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  ['ranges', 'Extract page ranges'],
                  ['every', 'Split every page'],
                ] as const
              ).map(([m, label]) => (
                <div key={m}>
                  <input
                    type="radio"
                    id={`${uid}-mode-${m}`}
                    name={`${uid}-mode`}
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="peer sr-only"
                  />
                  <label htmlFor={`${uid}-mode-${m}`} className={PILL}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          {mode === 'ranges' ? (
            <div>
              <label htmlFor={`${uid}-ranges`} className="mb-2 block font-semibold text-gray-900 dark:text-white">
                Pages to extract
              </label>
              <input
                id={`${uid}-ranges`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                disabled={busy}
                placeholder={source.pages >= 10 ? 'e.g. 1-3,5,8-10' : `e.g. 1-${Math.min(2, source.pages)}`}
                aria-invalid={showRangeError}
                aria-describedby={`${uid}-ranges-help`}
                className={`${INPUT} ${showRangeError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              />
              <div id={`${uid}-ranges-help`} className="mt-1 text-sm">
                {showRangeError && parsed && !parsed.ok ? (
                  <p role="alert" className="text-red-600 dark:text-red-400">
                    {parsed.error}
                  </p>
                ) : parsed?.ok ? (
                  <p className="text-gray-600 dark:text-gray-300" aria-live="polite">
                    {pluralPages(parsed.pages.length)} selected: {formatPageList(parsed.pages)}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Pages 1-{source.pages}. Use commas and dashes; &quot;8-&quot; means page 8 to the end. Pages keep the order you type.
                  </p>
                )}
              </div>
              <button type="button" onClick={extract} disabled={busy || !parsed?.ok} className={`${PRIMARY_BTN} mt-4 w-full`}>
                <IconWrapper icon={FiScissors} className="w-4 h-4" />
                {progress ?? 'Extract & download'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Downloads {pluralPages(source.pages)} as separate PDF files, one after another. Your browser may ask you to allow multiple
                downloads.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={splitEvery} disabled={busy} className={`${PRIMARY_BTN} flex-1`}>
                  <IconWrapper icon={FiScissors} className="w-4 h-4" />
                  {progress ?? `Split into ${source.pages} files`}
                </button>
                {progress && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelRef.current = true;
                    }}
                    className={SECONDARY_BTN}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {progress ?? ''}
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- page */

type TabId = 'merge' | 'split';
const TABS: { id: TabId; label: string }[] = [
  { id: 'merge', label: 'Merge PDFs' },
  { id: 'split', label: 'Split PDF' },
];

export default function PdfMergeSplit() {
  const uid = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const [activeTab, setActiveTab] = useState<TabId>('merge');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ merge: null, split: null });

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const tab = TABS[next].id;
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const onDone = () => track('convert');

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Merge several PDFs into one or split a PDF into page ranges or single pages - free, private, and processed entirely in your browser."
      toolCategory="Document"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">🗂️</span> PDF Merge &amp; Split
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Combine PDFs in any order, or pull out exactly the pages you need. Files never leave your device.
          </p>
        </div>

        <div className={CARD}>
          <div role="tablist" aria-label="PDF tool mode" className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-900/40 p-1 mb-6">
            {TABS.map((tab, index) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${uid}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                  className={`min-h-[44px] rounded-lg px-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                    selected
                      ? 'bg-white dark:bg-white/15 text-purple-700 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {TABS.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${uid}-panel-${tab.id}`}
              aria-labelledby={`${uid}-tab-${tab.id}`}
              hidden={activeTab !== tab.id}
              tabIndex={0}
              className="focus:outline-none"
            >
              {tab.id === 'merge' ? <MergePanel onDone={onDone} /> : <SplitPanel onDone={onDone} />}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Password-protected PDFs can&apos;t be processed. Form fields and bookmarks may not carry over to the new file.
        </p>
      </div>
    </ToolWrapper>
  );
}

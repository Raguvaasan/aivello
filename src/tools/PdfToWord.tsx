import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaFilePdf, FaFileWord, FaDownload, FaSpinner, FaUpload, FaRedo, FaTimes } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { logger } from '../utils/logger';
import {
  MAX_PDF_SIZE,
  classifyPdfError,
  countWords,
  formatFileSize,
  hasPdfSignature,
  isPdfCandidate,
  outputBaseName,
  textItemsToPageText,
} from './lib/pdfToWordText';

/**
 * pdf.js worker. Served from our own origin (copied into public/), so the version can
 * never drift from pdfjs-dist and user PDFs never touch a third-party origin.
 */
const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

interface ExtractedPage {
  pageNumber: number;
  text: string;
}

type Status = 'idle' | 'extracting' | 'ready' | 'converting';

interface Destroyable {
  destroy: () => Promise<void>;
}

const PREVIEW_CHARS = 800;

const cardClass = 'rounded-2xl bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-sm';

export default function PdfToWord() {
  const track = useToolTracking('pdf-to-word', 'PDF to Word Converter');
  const inputId = useId();
  const statusId = useId();

  const [status, setStatus] = useState<Status>('idle');
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Incremented to cancel an in-flight extraction (new file, reset, unmount). */
  const runId = useRef(0);
  const loadingTask = useRef<Destroyable | null>(null);
  const mounted = useRef(true);

  const destroyLoadingTask = useCallback(() => {
    const task = loadingTask.current;
    loadingTask.current = null;
    if (task) task.destroy().catch(() => undefined);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      runId.current += 1;
      destroyLoadingTask();
    };
  }, [destroyLoadingTask]);

  const clearFileInput = () => {
    // Lets the user pick the same file again after an error or reset.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = useCallback(
    async (file: File) => {
      setError('');

      if (!isPdfCandidate(file)) {
        setError('Please choose a PDF file (.pdf).');
        return;
      }
      if (file.size === 0) {
        setError('This file is empty.');
        return;
      }
      if (file.size > MAX_PDF_SIZE) {
        setError(`This PDF is ${formatFileSize(file.size)}. The maximum size is ${formatFileSize(MAX_PDF_SIZE)}.`);
        return;
      }

      runId.current += 1;
      const id = runId.current;
      destroyLoadingTask();

      setStatus('extracting');
      setPages([]);
      setTotalPages(0);
      setProgress(null);
      setFileName(file.name);

      const isCurrent = () => mounted.current && id === runId.current;

      try {
        const data = new Uint8Array(await file.arrayBuffer());
        if (!hasPdfSignature(data)) {
          const invalid = new Error('No PDF header');
          invalid.name = 'InvalidPDFException';
          throw invalid;
        }

        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        if (!isCurrent()) return;

        // pdf.js >= 5.7 has no eval-based font path, so the old isEvalSupported: false guard is gone.
        const task = pdfjs.getDocument({ data });
        loadingTask.current = task;
        const pdf = await task.promise;
        if (!isCurrent()) return;

        const total = pdf.numPages;
        setTotalPages(total);
        setProgress({ current: 0, total });

        const extracted: ExtractedPage[] = [];
        for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          page.cleanup();
          if (!isCurrent()) return;

          const text = textItemsToPageText(content.items);
          if (text) extracted.push({ pageNumber, text });
          setProgress({ current: pageNumber, total });
        }

        if (extracted.length === 0) {
          setError(
            'No selectable text was found. This PDF appears to contain only scanned images, which need OCR - this tool converts text-based PDFs.'
          );
          setStatus('idle');
          return;
        }

        setPages(extracted);
        setStatus('ready');
      } catch (err) {
        if (!isCurrent()) return;
        const kind = classifyPdfError(err);
        if (kind === 'password') {
          setError(
            'This PDF is password-protected. Remove the password (for example open it and use "Print to PDF") and try again.'
          );
        } else if (kind === 'invalid') {
          setError('This file is not a valid PDF or it is corrupted.');
        } else {
          logger.error('PDF text extraction failed', err);
          setError('Could not read this PDF. Please try another file.');
        }
        setStatus('idle');
        setFileName('');
      } finally {
        if (id === runId.current) {
          destroyLoadingTask();
          if (mounted.current) setProgress(null);
        }
        clearFileInput();
      }
    },
    [destroyLoadingTask]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (status === 'extracting' || status === 'converting') return;
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const resetTool = useCallback(() => {
    runId.current += 1;
    destroyLoadingTask();
    setStatus('idle');
    setPages([]);
    setTotalPages(0);
    setProgress(null);
    setFileName('');
    setError('');
    clearFileInput();
  }, [destroyLoadingTask]);

  const handleDownload = async () => {
    if (pages.length === 0 || status !== 'ready') return;
    setStatus('converting');
    setError('');

    try {
      const [{ Document, Packer, Paragraph, TextRun }, { saveAs }] = await Promise.all([
        import('docx'),
        import('file-saver'),
      ]);

      const baseName = outputBaseName(fileName);
      // One Word paragraph per extracted line keeps headings and lists recognisable;
      // each PDF page starts on a new Word page.
      const children = pages.flatMap((page, pageIndex) =>
        page.text.split('\n').map(
          (line, lineIndex) =>
            new Paragraph({
              children: line ? [new TextRun(line)] : [],
              pageBreakBefore: pageIndex > 0 && lineIndex === 0,
              spacing: { after: 120 },
            })
        )
      );

      const doc = new Document({
        creator: 'Aivello PDF to Word',
        title: baseName,
        styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${baseName}.docx`);
      track('convert');
      toast.success('Word document downloaded');
    } catch (err) {
      logger.error('Word document generation failed', err);
      if (mounted.current) setError('Could not create the Word document. Please try again.');
    } finally {
      if (mounted.current) setStatus('ready');
    }
  };

  const stats = useMemo(
    () => ({
      words: pages.reduce((sum, page) => sum + countWords(page.text), 0),
      characters: pages.reduce((sum, page) => sum + page.text.length, 0),
    }),
    [pages]
  );

  const busy = status === 'extracting' || status === 'converting';
  const emptyPages = totalPages - pages.length;
  const progressPct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <ToolWrapper
      toolId="pdf-to-word"
      toolName="PDF to Word Converter"
      toolDescription="Convert PDF files to editable Word documents online. Extract text from PDF and create downloadable DOCX files"
      toolCategory="Document"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className={`${cardClass} p-4 sm:p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaFilePdf} className="text-3xl text-red-600 dark:text-red-400 shrink-0" />
            <IconWrapper icon={FaFileWord} className="text-3xl text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PDF to Word Converter</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Converted in your browser - your file is never uploaded.
              </p>
            </div>
          </div>

          {/* Upload */}
          {status !== 'ready' && status !== 'converting' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className="mb-6"
            >
              <input
                ref={fileInputRef}
                id={inputId}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputChange}
                disabled={busy}
                className="sr-only peer"
              />
              <label
                htmlFor={inputId}
                className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-10 rounded-xl border-2 border-dashed text-center transition-colors
                  peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50
                  ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
              >
                <IconWrapper icon={FaUpload} className="text-3xl text-purple-600 dark:text-purple-400" />
                <span className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
                  Choose a PDF
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">or drag and drop it here</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Text-based PDFs up to {formatFileSize(MAX_PDF_SIZE)}
                </span>
              </label>
            </div>
          )}

          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
            >
              {error}
            </motion.div>
          )}

          {/* Progress */}
          <div id={statusId} aria-live="polite" className="empty:hidden">
            {status === 'extracting' && (
              <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 min-w-0">
                    <IconWrapper icon={FaSpinner} className="animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">
                      {progress
                        ? `Reading page ${progress.current} of ${progress.total}…`
                        : `Opening ${fileName || 'PDF'}…`}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={resetTool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                  >
                    <IconWrapper icon={FaTimes} />
                    Cancel
                  </button>
                </div>
                <div
                  role="progressbar"
                  aria-label="Text extraction progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPct}
                  className="h-2 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-[width] duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {pages.length > 0 && (status === 'ready' || status === 'converting') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 min-w-0 break-all">
                  <span className="font-medium text-gray-900 dark:text-white">{fileName}</span>
                </p>
                <button
                  type="button"
                  onClick={resetTool}
                  disabled={status === 'converting'}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                >
                  <IconWrapper icon={FaRedo} />
                  Convert another PDF
                </button>
              </div>

              <dl className="grid grid-cols-3 gap-2 sm:gap-4 text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                {[
                  { label: 'Pages', value: totalPages },
                  { label: 'Words', value: stats.words },
                  { label: 'Characters', value: stats.characters },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 flex flex-col-reverse">
                    <dt className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{stat.label}</dt>
                    <dd className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums truncate">
                      {stat.value.toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>

              {emptyPages > 0 && (
                <p className="text-sm p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
                  {emptyPages === 1 ? '1 page has' : `${emptyPages} pages have`} no selectable text (probably
                  scanned images) and will be skipped.
                </p>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={status === 'converting'}
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                >
                  <IconWrapper
                    icon={status === 'converting' ? FaSpinner : FaDownload}
                    className={status === 'converting' ? 'animate-spin' : ''}
                  />
                  {status === 'converting' ? 'Creating Word document…' : 'Download as Word (.docx)'}
                </button>
              </div>

              <section aria-labelledby={`${statusId}-preview`} className="space-y-3">
                <h3 id={`${statusId}-preview`} className="text-lg font-semibold text-gray-900 dark:text-white">
                  Text preview
                </h3>
                {/* Modern browsers make scrollable regions keyboard-focusable on their own. */}
                <div
                  role="region"
                  aria-label="Extracted text preview"
                  className="max-h-96 overflow-y-auto space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                >
                  {pages.map((page) => (
                    <div
                      key={page.pageNumber}
                      className="border-b border-gray-200 dark:border-white/10 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          Page {page.pageNumber}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({countWords(page.text).toLocaleString()} words)
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line break-words">
                        {page.text.length > PREVIEW_CHARS ? `${page.text.slice(0, PREVIEW_CHARS)}…` : page.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-2">How to use</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Choose or drop a PDF (up to {formatFileSize(MAX_PDF_SIZE)}).</li>
              <li>Check the extracted text in the preview.</li>
              <li>Download it as an editable Word document (.docx); each PDF page starts a new Word page.</li>
              <li>Works with text-based PDFs. Scanned images and password-protected files are not supported.</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

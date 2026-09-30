import React, { useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  MAX_DIFF_LINES,
  diffLines,
  splitLines,
  toUnifiedPatch,
  type DiffLine,
  type DiffSegment,
  type SideBySideRow,
} from '../utils/tools/textDiff';

const TOOL_ID = 'text-diff-checker';
const TOOL_NAME = 'Text Diff Checker';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';

const ADDED = 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
const REMOVED = 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
const ADDED_WORD = 'bg-green-300/70 dark:bg-green-400/40 rounded-sm';
const REMOVED_WORD = 'bg-red-300/70 dark:bg-red-400/40 rounded-sm line-through decoration-red-700/40 dark:decoration-red-300/40';
const EQUAL = 'text-gray-800 dark:text-gray-200';
const CONTEXT_LINES = 3;

async function copyToClipboard(text: string, message = 'Copied to clipboard'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error('Copy failed - your browser blocked clipboard access');
    return false;
  }
}

type View = 'split' | 'unified';
const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'split', label: 'Side by side' },
  { id: 'unified', label: 'Unified' },
];

type Collapsed<T> = { kind: 'item'; item: T; index: number } | { kind: 'gap'; count: number; index: number };

/** Replaces long runs of unchanged items with a gap marker, keeping `context` items around changes. */
function collapseUnchanged<T>(items: T[], isEqual: (item: T) => boolean, context: number): Collapsed<T>[] {
  const keep = new Uint8Array(items.length);
  for (let i = 0; i < items.length; i++) {
    if (!isEqual(items[i])) {
      for (let k = Math.max(0, i - context); k <= Math.min(items.length - 1, i + context); k++) keep[k] = 1;
    }
  }
  const out: Collapsed<T>[] = [];
  let i = 0;
  while (i < items.length) {
    if (keep[i]) {
      out.push({ kind: 'item', item: items[i], index: i });
      i++;
    } else {
      const start = i;
      while (i < items.length && !keep[i]) i++;
      out.push({ kind: 'gap', count: i - start, index: start });
    }
  }
  return out;
}

function Segments({ line }: { line: DiffLine }) {
  if (!line.segments) return <>{line.text === '' ? ' ' : line.text}</>;
  const wordClass = line.type === 'insert' ? ADDED_WORD : REMOVED_WORD;
  return (
    <>
      {line.segments.map((seg: DiffSegment, i) =>
        seg.changed ? (
          <span key={i} className={wordClass}>
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

const lineClass = (line: DiffLine | null): string =>
  !line ? 'bg-gray-50 dark:bg-white/5' : line.type === 'insert' ? ADDED : line.type === 'delete' ? REMOVED : EQUAL;

const marker = (line: DiffLine | null): string => (!line ? '' : line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' ');

function GapRow({ count, colSpanClass }: { count: number; colSpanClass: string }) {
  return (
    <div className={`${colSpanClass} bg-purple-50 px-3 py-1 text-center text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-300`}>
      ⋯ {count.toLocaleString()} unchanged line{count === 1 ? '' : 's'} hidden ⋯
    </div>
  );
}

function SplitCell({ line, side }: { line: DiffLine | null; side: 'left' | 'right' }) {
  const number = line ? (side === 'left' ? line.oldNumber : line.newNumber) : null;
  return (
    <div className={`flex min-w-0 ${lineClass(line)} ${side === 'left' ? 'border-r border-gray-200 dark:border-white/10' : ''}`}>
      <span className="w-8 sm:w-10 shrink-0 select-none px-1 text-right text-gray-400 dark:text-gray-500" aria-hidden="true">
        {number ?? ''}
      </span>
      <span className="w-4 shrink-0 select-none text-center" aria-hidden="true">
        {marker(line)}
      </span>
      {line && line.type !== 'equal' && <span className="sr-only">{line.type === 'insert' ? 'Added: ' : 'Removed: '}</span>}
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pr-2">{line ? <Segments line={line} /> : ''}</span>
    </div>
  );
}

export default function TextDiffChecker() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [hideUnchanged, setHideUnchanged] = useState(false);
  const [view, setView] = useState<View>('split');
  const [committed, setCommitted] = useState<{ oldText: string; newText: string } | null>(null);

  const ids = {
    old: `${baseId}-old`,
    new: `${baseId}-new`,
    ws: `${baseId}-ws`,
    case: `${baseId}-case`,
    hide: `${baseId}-hide`,
    panel: `${baseId}-panel`,
  };

  const oldCount = useMemo(() => splitLines(oldText).length, [oldText]);
  const newCount = useMemo(() => splitLines(newText).length, [newText]);

  const result = useMemo(
    () => (committed ? diffLines(committed.oldText, committed.newText, { ignoreWhitespace, ignoreCase }) : null),
    [committed, ignoreWhitespace, ignoreCase]
  );
  const stale = committed !== null && (committed.oldText !== oldText || committed.newText !== newText);

  const splitItems = useMemo(
    () =>
      result && result.ok
        ? hideUnchanged
          ? collapseUnchanged<SideBySideRow>(result.rows, (r) => r.type === 'equal', CONTEXT_LINES)
          : result.rows.map((item, index): Collapsed<SideBySideRow> => ({ kind: 'item', item, index }))
        : [],
    [result, hideUnchanged]
  );
  const unifiedItems = useMemo(
    () =>
      result && result.ok
        ? hideUnchanged
          ? collapseUnchanged<DiffLine>(result.lines, (l) => l.type === 'equal', CONTEXT_LINES)
          : result.lines.map((item, index): Collapsed<DiffLine> => ({ kind: 'item', item, index }))
        : [],
    [result, hideUnchanged]
  );

  const handleCompare = () => {
    setCommitted({ oldText, newText });
    track('analyze');
  };

  const handleSwap = () => {
    setOldText(newText);
    setNewText(oldText);
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % VIEWS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = VIEWS.length - 1;
    if (next >= 0) {
      event.preventDefault();
      setView(VIEWS[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  const patch = useMemo(() => (result && result.ok ? toUnifiedPatch(result, { oldName: 'original', newName: 'changed' }) : ''), [result]);

  const handleCopyPatch = async () => {
    if (patch && (await copyToClipboard(patch, 'Unified diff copied'))) track('copy');
  };

  const handleDownloadPatch = () => {
    if (!patch) return;
    saveAs(new Blob([patch], { type: 'text/x-diff;charset=utf-8' }), 'changes.diff');
    track('download');
  };

  const checkbox = (id: string, checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <div className="flex min-h-[44px] items-center gap-2">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 rounded accent-purple-600" />
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
    </div>
  );

  const tooMany = oldCount > MAX_DIFF_LINES || newCount > MAX_DIFF_LINES;

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Compare two texts and highlight the differences line by line and word by word. Side-by-side or unified view, ignore whitespace or case - free and private."
      toolCategory="Writing"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            🆚
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Text Diff Checker
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Paste two versions and see exactly what was added, removed or changed. Your text stays in your browser.
          </p>
        </div>

        <div className={`${CARD} mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={ids.old} className="mb-2 block font-semibold text-gray-900 dark:text-white">
                Original text
              </label>
              <textarea
                id={ids.old}
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                spellCheck={false}
                placeholder="Paste the original version…"
                className={`${FIELD} h-56 p-3 font-mono text-sm resize-y`}
              />
              <p className={`mt-1 text-xs ${oldCount > MAX_DIFF_LINES ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {oldCount.toLocaleString()} line{oldCount === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <label htmlFor={ids.new} className="mb-2 block font-semibold text-gray-900 dark:text-white">
                Changed text
              </label>
              <textarea
                id={ids.new}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                spellCheck={false}
                placeholder="Paste the new version…"
                className={`${FIELD} h-56 p-3 font-mono text-sm resize-y`}
              />
              <p className={`mt-1 text-xs ${newCount > MAX_DIFF_LINES ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {newCount.toLocaleString()} line{newCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6">
            {checkbox(ids.ws, ignoreWhitespace, setIgnoreWhitespace, 'Ignore whitespace')}
            {checkbox(ids.case, ignoreCase, setIgnoreCase, 'Ignore case')}
            {checkbox(ids.hide, hideUnchanged, setHideUnchanged, 'Hide unchanged lines')}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
            <button type="button" className={PRIMARY_BTN} onClick={handleCompare} disabled={!oldText && !newText}>
              Compare
            </button>
            <button type="button" className={SECONDARY_BTN} onClick={handleSwap} disabled={!oldText && !newText}>
              <span aria-hidden="true">⇄</span> Swap
            </button>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => {
                setOldText('');
                setNewText('');
                setCommitted(null);
              }}
              disabled={!oldText && !newText && !committed}
            >
              Clear
            </button>
          </div>
          {tooMany && (
            <p className="mt-3 text-sm text-red-700 dark:text-red-300">
              Each side is limited to {MAX_DIFF_LINES.toLocaleString()} lines to keep your browser responsive.
            </p>
          )}
        </div>

        {result && !result.ok && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {result.message}
          </p>
        )}

        {result && result.ok && (
          <div className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {result.identical ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-500/20 dark:text-green-300">
                    <span aria-hidden="true">✓ </span>No differences{ignoreWhitespace || ignoreCase ? ' (with current options)' : ''}
                  </span>
                ) : (
                  <>
                    <span className={`rounded-full px-3 py-1 ${ADDED}`}>+{result.stats.added.toLocaleString()} added</span>
                    <span className={`rounded-full px-3 py-1 ${REMOVED}`}>−{result.stats.removed.toLocaleString()} removed</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                      {result.stats.unchanged.toLocaleString()} unchanged
                    </span>
                  </>
                )}
              </div>
              <div role="tablist" aria-label="Diff view" className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/10">
                {VIEWS.map((v, i) => (
                  <button
                    key={v.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${v.id}`}
                    aria-selected={view === v.id}
                    aria-controls={ids.panel}
                    tabIndex={view === v.id ? 0 : -1}
                    onClick={() => setView(v.id)}
                    onKeyDown={(e) => onTabKeyDown(e, i)}
                    className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                      view === v.id
                        ? 'bg-white text-purple-700 shadow dark:bg-white/20 dark:text-white'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {stale && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                The text changed since this comparison - press Compare to update.
              </p>
            )}
            {result.timedOut && (
              <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
                These inputs are very different, so part of the diff was simplified to keep the page responsive.
              </p>
            )}

            {!result.identical && (
              <div
                role="tabpanel"
                id={ids.panel}
                aria-labelledby={`${baseId}-tab-${view}`}
                className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-gray-200 font-mono text-xs sm:text-sm dark:border-white/10"
              >
                {view === 'split' ? (
                  <div className="grid grid-cols-2">
                    <div className="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-100 px-3 py-2 font-sans text-xs font-semibold text-gray-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200">
                      Original
                    </div>
                    <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100 px-3 py-2 font-sans text-xs font-semibold text-gray-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200">
                      Changed
                    </div>
                    {splitItems.map((entry) =>
                      entry.kind === 'gap' ? (
                        <GapRow key={`gap-${entry.index}`} count={entry.count} colSpanClass="col-span-2" />
                      ) : (
                        <React.Fragment key={entry.index}>
                          <SplitCell line={entry.item.left} side="left" />
                          <SplitCell line={entry.item.right} side="right" />
                        </React.Fragment>
                      )
                    )}
                  </div>
                ) : (
                  <div>
                    {unifiedItems.map((entry) =>
                      entry.kind === 'gap' ? (
                        <GapRow key={`gap-${entry.index}`} count={entry.count} colSpanClass="" />
                      ) : (
                        <div key={entry.index} className={`flex ${lineClass(entry.item)}`}>
                          <span className="w-10 shrink-0 select-none px-1 text-right text-gray-400 dark:text-gray-500" aria-hidden="true">
                            {entry.item.oldNumber ?? ''}
                          </span>
                          <span className="w-10 shrink-0 select-none px-1 text-right text-gray-400 dark:text-gray-500" aria-hidden="true">
                            {entry.item.newNumber ?? ''}
                          </span>
                          <span className="w-4 shrink-0 select-none text-center" aria-hidden="true">
                            {marker(entry.item)}
                          </span>
                          <span className="sr-only">
                            {entry.item.type === 'insert' ? 'Added: ' : entry.item.type === 'delete' ? 'Removed: ' : ''}
                          </span>
                          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pr-2">
                            <Segments line={entry.item} />
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {!result.identical && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={SECONDARY_BTN} onClick={handleCopyPatch}>
                  <span aria-hidden="true">📋</span> Copy unified diff
                </button>
                <button type="button" className={SECONDARY_BTN} onClick={handleDownloadPatch}>
                  <span aria-hidden="true">⬇️</span> Download .diff
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolWrapper>
  );
}

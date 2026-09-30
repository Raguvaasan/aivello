/**
 * Parsing of page-range expressions such as "1-3, 5, 8-10" for the PDF splitter.
 *
 * Accepted tokens (comma separated, whitespace ignored):
 *   "5"      a single page
 *   "1-3"    an inclusive range (en/em dashes are accepted too)
 *   "8-"     page 8 to the last page
 * Pages keep the order they were typed in; repeats are dropped.
 */

export interface PageRangeGroup {
  /** 1-based, inclusive */
  start: number;
  /** 1-based, inclusive */
  end: number;
}

export type PageRangeResult =
  | { ok: true; pages: number[]; groups: PageRangeGroup[] }
  | { ok: false; error: string };

const MAX_EXPRESSION_LENGTH = 1000;

export function parsePageRanges(input: string, pageCount: number): PageRangeResult {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return { ok: false, error: 'The document has no pages.' };
  }
  const expression = input.replace(/[–—]/g, '-').trim();
  if (!expression) return { ok: false, error: 'Enter at least one page or range, e.g. 1-3,5.' };
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return { ok: false, error: 'That page list is too long.' };
  }

  const pages: number[] = [];
  const seen = new Set<number>();
  const groups: PageRangeGroup[] = [];
  const outOfRange = (page: number) =>
    `Page ${page} is out of range - this document has ${pageCount} page${pageCount === 1 ? '' : 's'}.`;

  for (const rawToken of expression.split(',')) {
    // Spaces around the dash are fine; "1 2" is ambiguous and must not become page 12.
    const token = rawToken.trim().replace(/\s*-\s*/g, '-');
    if (!token) continue;

    const match = /^(\d+)(?:(-)(\d*))?$/.exec(token);
    if (!match) return { ok: false, error: `"${rawToken.trim()}" is not a page number or range.` };

    const start = Number(match[1]);
    const end = match[2] ? (match[3] ? Number(match[3]) : pageCount) : start;

    if (start < 1 || end < 1) return { ok: false, error: 'Page numbers start at 1.' };
    if (start > pageCount) return { ok: false, error: outOfRange(start) };
    if (end > pageCount) return { ok: false, error: outOfRange(end) };
    if (end < start) {
      return { ok: false, error: `"${token}" is backwards - write it as ${end}-${start}.` };
    }

    groups.push({ start, end });
    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        seen.add(page);
        pages.push(page);
      }
    }
  }

  if (pages.length === 0) return { ok: false, error: 'Enter at least one page or range, e.g. 1-3,5.' };
  return { ok: true, pages, groups };
}

/** Compact label for a set of 1-based pages: [1,2,3,5] -> "1-3,5". */
export function formatPageList(pages: readonly number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < pages.length) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j += 1;
    parts.push(i === j ? `${pages[i]}` : `${pages[i]}-${pages[j]}`);
    i = j + 1;
  }
  return parts.join(',');
}

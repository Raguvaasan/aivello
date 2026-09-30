/**
 * Client-side extractive text analysis used by the AI Text Summarizer and the AI Study
 * Notes Generator. Pure functions only: no DOM, no network, no randomness.
 *
 * The approach is classic frequency-based extractive summarization: content words are
 * stemmed and counted, every sentence is scored by the weight of the words it contains,
 * and the best sentences are returned in their original order.
 */

export const STOPWORDS: ReadonlySet<string> = new Set(
  (
    'a about above after again against all also am an and any are aren as at be because been before being below ' +
    'between both but by can cannot could couldn did didn do does doesn doing don down during each either else ever ' +
    'every few for from further get gets got had hadn has hasn have haven having he her here hers herself him himself ' +
    'his how however i if in into is isn it its itself just let like made make makes many may me might more most much ' +
    'must my myself near need no nor not now of off often on once one only onto or other others our ours ourselves out ' +
    'over own per perhaps quite rather really said same say says see seem seems several shall she should shouldn since ' +
    'so some such than that the their theirs them themselves then there therefore these they this those though through ' +
    'thus to too toward towards under until up upon us use used uses using very via was wasn way we well were weren ' +
    'what whatever when whenever where whereas wherever whether which while who whom whose why will with within without ' +
    'won would wouldn yet you your yours yourself yourselves also another around because become becomes began begin ' +
    'called come comes done even first go goes going gone good great however instead known less lot lots mostly new ' +
    'next old put second show shows take takes thing things three two usually want wants whole yes etc eg ie'
  ).split(/\s+/)
);

/** Words ending a sentence-final period that do not end a sentence. */
const ABBREVIATIONS: ReadonlySet<string> = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'e.g', 'i.e', 'inc', 'ltd', 'co', 'corp',
  'fig', 'no', 'approx', 'dept', 'est', 'u.s', 'u.k', 'a.m', 'p.m', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul',
  'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'mt', 'gen', 'gov', 'vol', 'pp', 'ca', 'cf', 'al',
]);

const WORD_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const BULLET_RE = /^\s*(?:[-*•●▪◦‣⁃]+|\d{1,3}[.)])\s+/u;

/** Lowercased word tokens (Unicode aware, so non-English text still tokenizes). */
export const tokenize = (text: string): string[] => text.toLowerCase().match(WORD_RE) ?? [];

/** Count of whitespace-separated words; 0 for blank input. */
export const countWords = (text: string): number => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

/**
 * A deliberately light English stemmer: strips one common suffix so that "manage",
 * "managed", "management" and "managing" all collapse to the same key. Both sides of
 * every comparison go through the same function, so over-stemming is harmless.
 */
const SUFFIXES = [
  'izations', 'ization', 'ational', 'fulness', 'iveness', 'ibility', 'ability', 'ations', 'ation', 'ative',
  'ments', 'ment', 'ities', 'ity', 'ings', 'ing', 'ness', 'ions', 'ion', 'ized', 'izes', 'ize', 'ated', 'ates',
  'ate', 'able', 'ible', 'ship', 'ful', 'ive', 'ers', 'er', 'ies', 'ied', 'ed', 'es', 'ly', 's',
];

export const stem = (word: string): string => {
  let w = word.toLowerCase().replace(/['’]s$/, '');
  if (w.length <= 3 || /\d/.test(w)) return w;
  for (const suffix of SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      w = w.slice(0, -suffix.length) + (suffix === 'ies' || suffix === 'ied' ? 'y' : '');
      break;
    }
  }
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  // "planning" -> "plann" -> "plan", but keep "skill", "class", "buzz".
  if (w.length > 3 && /([b-df-hj-kmnp-rtv-z])\1$/.test(w) && !/(ll|ss|zz|ff)$/.test(w)) {
    w = w.slice(0, -1);
  }
  return w;
};

export const isContentWord = (token: string): boolean =>
  token.length >= 3 && !STOPWORDS.has(token) && !/^\d+$/.test(token);

const splitLineIntoSentences = (line: string): string[] => {
  const out: string[] = [];
  const boundary = /[.!?…]+["'”’)\]]*(?=\s|$)/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(line)) !== null) {
    const end = match.index + match[0].length;
    if (match[0].startsWith('.')) {
      const before = line.slice(start, match.index);
      const lastWord = (before.match(/(\S+)$/)?.[1] ?? '').toLowerCase().replace(/^[("'“‘[]+/, '');
      const next = line.slice(end).trimStart();
      const isAbbreviation = ABBREVIATIONS.has(lastWord) || /^\p{L}$/u.test(lastWord);
      const continuesLowercase = next.length > 0 && /^[a-z]/.test(next);
      if (isAbbreviation || continuesLowercase) continue;
    }
    const sentence = line.slice(start, end).trim();
    if (sentence) out.push(sentence);
    start = end;
  }
  const rest = line.slice(start).trim();
  if (rest) out.push(rest);
  return out;
};

/**
 * Splits text into sentences. Line breaks are treated as hard boundaries (headings and
 * bullet points rarely end with a period) and bullet markers are removed. Decimals
 * ("3.5"), initials and common abbreviations ("e.g.", "Dr.") do not end a sentence.
 */
export const splitSentences = (text: string): string[] =>
  text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((line) => line.replace(BULLET_RE, '').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .flatMap(splitLineIntoSentences);

/** Paragraphs separated by blank lines, each as a list of sentences. */
export const splitParagraphs = (text: string): string[][] =>
  text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => splitSentences(p))
    .filter((p) => p.length > 0);

export interface Keyword {
  /** Most common surface form, e.g. "photosynthesis" or "Isaac Newton". */
  term: string;
  count: number;
  /** 0..1 relative to the strongest keyword. */
  weight: number;
}

export interface ScoredSentence {
  text: string;
  /** Position in the original text. */
  index: number;
  score: number;
  stems: string[];
}

export interface TextAnalysis {
  sentences: ScoredSentence[];
  keywords: Keyword[];
  wordCount: number;
}

const CUE_WORDS = /\b(important|importantly|key|main|significant|crucial|essential|major|primary|therefore|in conclusion|in summary|overall|as a result|consequently|notably|in short|the goal|the purpose)\b/i;

const PROPER_PHRASE_RE = /\b(?:[A-Z][\p{L}'’-]+|[A-Z]{2,}\d*)(?:\s+(?:of|the|de|von|van|and)\s+[A-Z][\p{L}'’-]+|\s+(?:[A-Z][\p{L}'’-]+|[A-Z]{2,}\d*|[IVX]+\b))*/gu;

/**
 * Chooses how to display a stem: the most common lowercase spelling if the word ever
 * appears in lowercase ("photosynthesis", even though it also starts sentences),
 * otherwise the most common spelling as written ("Calvin", "ATP").
 */
const pickSurfaceForm = (forms: Map<string, number>): string => {
  let pool = Array.from(forms.entries());
  const lowercase = pool.filter(([form]) => form === form.toLowerCase());
  if (lowercase.length > 0) pool = lowercase;
  pool.sort((a, b) => b[1] - a[1] || a[0].length - b[0].length);
  return pool[0]?.[0] ?? '';
};

/**
 * Scores sentences and extracts keywords. Proper-noun phrases that recur ("World War II",
 * "Isaac Newton") and repeated two-word phrases ("carbon dioxide") are kept whole.
 */
export const analyzeText = (text: string, keywordLimit = 12): TextAnalysis => {
  const rawSentences = splitSentences(text);
  const stemCounts = new Map<string, number>();
  const stemForms = new Map<string, Map<string, number>>();
  const bigramCounts = new Map<string, number>();
  const bigramForms = new Map<string, Map<string, number>>();

  const sentenceStems = rawSentences.map((sentence) => {
    const stems: string[] = [];
    // Punctuation inside a sentence ends a phrase: "ATP, oxygen" is not a bigram.
    sentence.split(/[,;:()[\]"“”]+/).forEach((segment) => {
      let prev: { stem: string; form: string } | null = null;
      for (const original of segment.match(WORD_RE) ?? []) {
        const lower = original.toLowerCase();
        if (!isContentWord(lower)) {
          prev = null;
          continue;
        }
        const s = stem(lower);
        stems.push(s);
        stemCounts.set(s, (stemCounts.get(s) ?? 0) + 1);
        const forms = stemForms.get(s) ?? new Map<string, number>();
        forms.set(original, (forms.get(original) ?? 0) + 1);
        stemForms.set(s, forms);
        if (prev) {
          const key = `${prev.stem} ${s}`;
          bigramCounts.set(key, (bigramCounts.get(key) ?? 0) + 1);
          const bForms = bigramForms.get(key) ?? new Map<string, number>();
          const form = `${prev.form} ${original}`;
          bForms.set(form, (bForms.get(form) ?? 0) + 1);
          bigramForms.set(key, bForms);
        }
        prev = { stem: s, form: original };
      }
    });
    return stems;
  });

  // Proper-noun phrases, ignoring the first word of each sentence (always capitalized).
  const properCounts = new Map<string, number>();
  rawSentences.forEach((sentence) => {
    const firstSpace = sentence.indexOf(' ');
    const body = firstSpace === -1 ? '' : sentence.slice(firstSpace + 1);
    for (const m of body.matchAll(PROPER_PHRASE_RE)) {
      const phrase = m[0].trim();
      if (phrase.length < 3 || STOPWORDS.has(phrase.toLowerCase())) continue;
      properCounts.set(phrase, (properCounts.get(phrase) ?? 0) + 1);
    }
  });

  const maxCount = Math.max(1, ...Array.from(stemCounts.values()));
  const stemWeight = (s: string): number => (stemCounts.get(s) ?? 0) / maxCount;

  const sentences: ScoredSentence[] = rawSentences.map((sentence, index) => {
    const stems = sentenceStems[index];
    const wordTotal = countWords(sentence);
    let score = 0;
    if (stems.length > 0) {
      const unique = Array.from(new Set(stems));
      score = unique.reduce((sum, s) => sum + stemWeight(s), 0) / Math.sqrt(unique.length);
    }
    if (index === 0) score *= 1.2;
    if (CUE_WORDS.test(sentence)) score *= 1.15;
    if (/\d/.test(sentence)) score *= 1.05;
    if (wordTotal < 5) score *= 0.4;
    else if (wordTotal > 45) score *= 0.75;
    return { text: sentence, index, score, stems };
  });

  // Candidate keywords: repeated proper phrases, repeated bigrams, then unigrams.
  type Candidate = { term: string; count: number; score: number; stems: string[] };
  const candidates: Candidate[] = [];
  properCounts.forEach((count, phrase) => {
    const words = tokenize(phrase).filter(isContentWord).map(stem);
    if (words.length === 0) return;
    if (count >= 2 || (words.length > 1 && count >= 1)) {
      candidates.push({ term: phrase, count, score: count * (words.length > 1 ? 1.8 : 1.3), stems: words });
    }
  });
  bigramCounts.forEach((count, key) => {
    if (count < 2) return;
    const forms = bigramForms.get(key);
    if (!forms) return;
    candidates.push({ term: pickSurfaceForm(forms), count, score: count * 1.6, stems: key.split(' ') });
  });
  stemCounts.forEach((count, s) => {
    const forms = stemForms.get(s);
    if (!forms) return;
    candidates.push({ term: pickSurfaceForm(forms), count, score: count, stems: [s] });
  });

  candidates.sort((a, b) => b.score - a.score || b.term.length - a.term.length);

  const chosen: Candidate[] = [];
  const covered = new Set<string>();
  for (const c of candidates) {
    if (chosen.length >= keywordLimit) break;
    // Skip a unigram already represented by a chosen phrase, and duplicate phrases.
    if (c.stems.every((s) => covered.has(s))) continue;
    if (chosen.some((k) => k.term.toLowerCase() === c.term.toLowerCase())) continue;
    chosen.push(c);
    c.stems.forEach((s) => covered.add(s));
  }

  const topScore = chosen[0]?.score ?? 1;
  const keywords: Keyword[] = chosen.map((c) => ({
    term: c.term,
    count: c.count,
    weight: Math.round((c.score / topScore) * 100) / 100,
  }));

  return { sentences, keywords, wordCount: countWords(text) };
};

const jaccard = (a: string[], b: string[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((x) => {
    if (setB.has(x)) inter += 1;
  });
  return inter / (setA.size + setB.size - inter);
};

/**
 * Picks the `count` best sentences, skipping near-duplicates, and returns them in the
 * order they appeared in the source.
 */
export const selectTopSentences = (sentences: ScoredSentence[], count: number): ScoredSentence[] => {
  const ranked = [...sentences].sort((a, b) => b.score - a.score || a.index - b.index);
  const picked: ScoredSentence[] = [];
  for (const s of ranked) {
    if (picked.length >= count) break;
    if (s.score <= 0) continue;
    if (picked.some((p) => jaccard(p.stems, s.stems) > 0.6)) continue;
    picked.push(s);
  }
  return picked.sort((a, b) => a.index - b.index);
};

export type SummaryFormat = 'bullet' | 'paragraph' | 'structured';
export type SummaryLength = 'short' | 'medium' | 'long';

export const SUMMARY_RATIOS: Record<SummaryLength, number> = { short: 0.2, medium: 0.35, long: 0.55 };

export const MIN_SUMMARY_SENTENCES = 3;
export const MAX_SUMMARY_INPUT = 50000;

export interface SummaryResult {
  text: string;
  keywords: Keyword[];
  sentenceCount: number;
  selectedCount: number;
}

/** Ensures a sentence ends with terminal punctuation. */
export const withPeriod = (sentence: string): string =>
  /[.!?…]["'”’)\]]*$/.test(sentence) ? sentence : `${sentence}.`;

export const summarizeText = (text: string, format: SummaryFormat, length: SummaryLength): SummaryResult => {
  const analysis = analyzeText(text, 8);
  const total = analysis.sentences.length;
  const target = Math.min(total, Math.max(1, Math.round(total * SUMMARY_RATIOS[length])));
  const picked = selectTopSentences(analysis.sentences, target);
  const lines = picked.map((s) => withPeriod(s.text));

  let out: string;
  if (format === 'bullet') {
    out = lines.map((l) => `• ${l}`).join('\n');
  } else if (format === 'paragraph') {
    out = lines.join(' ');
  } else {
    const main = [...picked].sort((a, b) => b.score - a.score)[0];
    const rest = picked.filter((s) => s !== main).map((s) => `• ${withPeriod(s.text)}`);
    const parts = [`Main idea:\n${main ? withPeriod(main.text) : ''}`];
    if (rest.length > 0) parts.push(`Key points:\n${rest.join('\n')}`);
    if (analysis.keywords.length > 0) {
      parts.push(`Keywords:\n${analysis.keywords.map((k) => k.term).join(', ')}`);
    }
    out = parts.join('\n\n');
  }

  return { text: out, keywords: analysis.keywords, sentenceCount: total, selectedCount: picked.length };
};

/** Shortens text to at most `max` characters on a word boundary. */
export const truncateWords = (text: string, max: number): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`;
};

export const titleCase = (text: string): string => {
  const small = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'as', 'vs']);
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => {
      if (/[A-Z]/.test(word.slice(1)) || /\d/.test(word)) return word; // acronyms, iPhone, COVID-19
      const lower = word.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

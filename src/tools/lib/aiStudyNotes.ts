/**
 * Builds study notes (summary, detailed notes, flashcards, mind map, quiz) from the
 * user's own material. Everything is extracted from the input text: no placeholder
 * answers, no fixed "correct answer: D".
 */
import {
  analyzeText,
  countWords,
  selectTopSentences,
  splitParagraphs,
  stem,
  titleCase,
  tokenize,
  truncateWords,
  withPeriod,
  type Keyword,
  type ScoredSentence,
  type TextAnalysis,
} from './aiTextSummarizer';

export type NotesType = 'summary' | 'detailed' | 'flashcards' | 'mindmap' | 'quiz';

export const MIN_STUDY_WORDS = 30;
export const MIN_STUDY_SENTENCES = 3;
export const MAX_STUDY_INPUT = 30000;

const RULE = '━'.repeat(30);

export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  source: string;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Deterministic PRNG so the same material always yields the same quiz. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const termRegex = (term: string): RegExp =>
  new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(term)})(?=$|[^\\p{L}\\p{N}])`, 'iu');

const mentions = (s: ScoredSentence, term: string): boolean => {
  if (termRegex(term).test(s.text)) return true;
  const termStems = tokenize(term).map(stem);
  return termStems.length > 0 && termStems.every((t) => s.stems.includes(t));
};

/** First sentence that mentions the term, used as its in-context explanation. */
const findContext = (term: string, sentences: ScoredSentence[]): ScoredSentence | undefined =>
  sentences.find((s) => mentions(s, term));

// Longer verb phrases first so "is known as" wins over "is".
const DEFINITION_RE =
  /^(.{2,70}?)\s+(is defined as|are defined as|is known as|are known as|was known as|refers to|means|describes|represents|is|are|was|were)\s+(.{8,})$/i;
const PRONOUN_START =
  /^(it|this|that|these|those|they|he|she|there|which|we|you|i|here|such|one|each|some|many|most|all)\b/i;

const DEFINITION_OBJECT = /^(a|an|the|one of|any|each|some kind of|a kind of|a type of|a form of)\b/i;

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** "Photosynthesis is the process by which..." -> Q: What is photosynthesis? */
export const extractDefinitions = (sentences: ScoredSentence[]): Flashcard[] => {
  const cards: Flashcard[] = [];
  const seen = new Set<string>();
  for (const s of sentences) {
    const text = s.text.replace(/[.!?…]+$/, '');
    const m = text.match(DEFINITION_RE);
    if (!m) continue;
    const subject = m[1].replace(/^(the|a|an)\s+/i, '').trim();
    const verb = m[2].toLowerCase();
    const rest = m[3].trim();
    if (PRONOUN_START.test(subject) || countWords(subject) > 6 || /[,;:]/.test(subject)) continue;
    // "X is a/the ..." is a definition; "X is essential" or "X is released" is not.
    if (/^(is|are|was|were)$/.test(verb) && !DEFINITION_OBJECT.test(rest)) continue;
    if (seen.has(subject.toLowerCase())) continue;
    seen.add(subject.toLowerCase());
    if (verb.includes('known as')) {
      cards.push({ question: `What is known as ${rest}?`, answer: withPeriod(capitalize(subject)) });
      continue;
    }
    let question: string;
    if (verb === 'refers to') question = `What does "${subject}" refer to?`;
    else if (verb === 'means' || verb === 'describes' || verb === 'represents') {
      question = `What does "${subject}" ${verb.replace(/s$/, '')}?`;
    } else question = `What ${verb.split(' ')[0]} ${subject}?`;
    cards.push({ question, answer: withPeriod(capitalize(rest)) });
  }
  return cards;
};

/** Replaces the first mention of `term` in the sentence with a blank. */
const blankOut = (sentence: string, term: string): string | null => {
  const re = termRegex(term);
  if (!re.test(sentence)) return null;
  return sentence.replace(re, (_all: string, lead: string) => `${lead}_____`);
};

interface Cloze {
  prompt: string;
  term: string;
  source: string;
}

const buildClozes = (sentences: ScoredSentence[], keywords: Keyword[], max: number): Cloze[] => {
  const out: Cloze[] = [];
  const termUse = new Map<string, number>();
  const ranked = [...sentences].sort((a, b) => b.score - a.score);
  for (const s of ranked) {
    if (out.length >= max) break;
    if (countWords(s.text) < 6) continue;
    for (const k of keywords) {
      if ((termUse.get(k.term) ?? 0) >= 2) continue;
      const prompt = blankOut(s.text, k.term);
      if (!prompt) continue;
      out.push({ prompt: withPeriod(prompt), term: k.term, source: s.text });
      termUse.set(k.term, (termUse.get(k.term) ?? 0) + 1);
      break;
    }
  }
  return out;
};

const shuffle = <T,>(items: T[], rand: () => number): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const buildQuiz = (analysis: TextAnalysis, seedText: string, max = 8): QuizQuestion[] => {
  const { sentences, keywords } = analysis;
  const clozes = buildClozes(sentences, keywords, max);
  const rand = mulberry32(hashString(seedText));
  const pool = keywords.map((k) => k.term);
  const results: QuizQuestion[] = [];
  clozes.forEach((c) => {
    const isProper = /^[A-Z]/.test(c.term);
    const distractors = shuffle(
      // A distractor already visible in the question would give the answer away.
      pool.filter((t) => t.toLowerCase() !== c.term.toLowerCase() && !c.prompt.toLowerCase().includes(t.toLowerCase())),
      rand
    )
      // Prefer distractors of the same "shape" (proper noun vs common term).
      .sort((a, b) => Number(/^[A-Z]/.test(b) === isProper) - Number(/^[A-Z]/.test(a) === isProper))
      .slice(0, 3);
    if (distractors.length === 0) return;
    const options = shuffle([c.term, ...distractors], rand);
    results.push({ prompt: c.prompt, options, answerIndex: options.indexOf(c.term), source: c.source });
  });
  return results;
};

export const buildFlashcards = (analysis: TextAnalysis, max = 10): Flashcard[] => {
  const { sentences, keywords } = analysis;
  const cards: Flashcard[] = extractDefinitions(sentences).slice(0, max);
  const seen = new Set(cards.map((c) => c.answer.toLowerCase()));
  for (const c of buildClozes(sentences, keywords, max)) {
    if (cards.length >= max) break;
    if (seen.has(c.term.toLowerCase())) continue;
    cards.push({ question: `Fill in the blank: ${c.prompt}`, answer: c.term });
    seen.add(c.term.toLowerCase());
  }
  return cards;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const formatSummary = (subject: string, analysis: TextAnalysis): string => {
  const { sentences, wordCount } = analysis;
  const keywords = analysis.keywords.slice(0, 6);
  const top = selectTopSentences(sentences, Math.min(8, Math.max(3, Math.round(sentences.length * 0.4))));
  const overview = top.slice(0, 3);
  const points = top.slice(3);
  const main = [...top].sort((a, b) => b.score - a.score)[0];
  const lines: string[] = [`STUDY SUMMARY: ${subject}`, RULE, '', 'Overview'];
  overview.forEach((s) => lines.push(`• ${withPeriod(s.text)}`));
  if (points.length > 0) {
    lines.push('', 'Key Points');
    points.forEach((s, i) => lines.push(`${i + 1}. ${withPeriod(s.text)}`));
  }
  if (keywords.length > 0) {
    lines.push('', 'Key Terms');
    keywords.forEach((k) => {
      const ctx = findContext(k.term, sentences);
      lines.push(`• ${k.term}${ctx ? ` — ${truncateWords(withPeriod(ctx.text), 140)}` : ''}`);
    });
  }
  if (main) lines.push('', 'Main Takeaway', withPeriod(main.text));
  lines.push(
    '',
    'Study Statistics',
    `• Words: ${wordCount}`,
    `• Sentences: ${sentences.length}`,
    `• Estimated study time: ${Math.max(5, Math.ceil(wordCount / 100))} minutes`
  );
  return lines.join('\n');
};

const formatDetailed = (subject: string, text: string, analysis: TextAnalysis): string => {
  const all = analysis.sentences;
  // Use the author's paragraphs when there are several; otherwise chunk by 4 sentences.
  const paragraphs = splitParagraphs(text);
  const groups: ScoredSentence[][] = [];
  if (paragraphs.length > 1) {
    let cursor = 0;
    paragraphs.forEach((p) => {
      groups.push(all.slice(cursor, cursor + p.length));
      cursor += p.length;
    });
  } else {
    for (let i = 0; i < all.length; i += 4) groups.push(all.slice(i, i + 4));
  }

  const lines: string[] = [`DETAILED NOTES: ${subject}`, RULE];
  groups
    .filter((g) => g.length > 0)
    .forEach((group, i) => {
      const local = analyzeText(group.map((s) => s.text).join('\n'), 2).keywords.map((k) => k.term);
      const heading = local.length > 0 ? titleCase(local.join(' & ')) : `Part ${i + 1}`;
      const best = [...group].sort((a, b) => b.score - a.score)[0];
      lines.push('', `Section ${i + 1}: ${heading}`);
      group.forEach((s) => lines.push(`  • ${withPeriod(s.text)}`));
      if (group.length > 1 && best) lines.push(`  → Key idea: ${truncateWords(withPeriod(best.text), 160)}`);
    });

  if (analysis.keywords.length > 0) {
    lines.push('', 'Review Checklist');
    analysis.keywords
      .slice(0, 6)
      .forEach((k) => lines.push(`☐ Can I explain "${k.term}" without looking at my notes?`));
  }
  return lines.join('\n');
};

const formatFlashcards = (subject: string, cards: Flashcard[]): string => {
  const lines: string[] = [`FLASHCARDS: ${subject}`, RULE, ''];
  cards.forEach((c, i) => {
    lines.push(`Card ${i + 1}`, `  Q: ${c.question}`, `  A: ${c.answer}`, '');
  });
  lines.push(
    'How to study these:',
    '• Cover the answers and test yourself',
    '• Re-review the cards you missed tomorrow, then again in 3 days'
  );
  return lines.join('\n');
};

const formatMindMap = (subject: string, analysis: TextAnalysis): string => {
  const { sentences } = analysis;
  const branches = analysis.keywords.filter((k) => k.term.toLowerCase() !== subject.toLowerCase()).slice(0, 5);
  const lines: string[] = [`MIND MAP: ${subject}`, RULE, '', subject];
  branches.forEach((k, bi) => {
    const lastBranch = bi === branches.length - 1;
    lines.push(`${lastBranch ? '└' : '├'}── ${titleCase(k.term)}`);
    const related = sentences
      .filter((s) => mentions(s, k.term))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const indent = lastBranch ? '    ' : '│   ';
    related.forEach((s, li) => {
      const branch = li === related.length - 1 ? '└' : '├';
      lines.push(`${indent}${branch}── ${truncateWords(s.text.replace(/[.!?]+$/, ''), 90)}`);
    });
  });
  lines.push('', 'Tip: redraw this map from memory, then check it against your notes.');
  return lines.join('\n');
};

const formatQuiz = (subject: string, quiz: QuizQuestion[]): string => {
  const lines: string[] = [`PRACTICE QUIZ: ${subject}`, RULE, `Questions: ${quiz.length}`, ''];
  quiz.forEach((q, i) => {
    lines.push(`Question ${i + 1}`, q.prompt);
    q.options.forEach((o, oi) => lines.push(`  ${LETTERS[oi]}) ${o}`));
    lines.push('');
  });
  lines.push(RULE, 'ANSWER KEY');
  quiz.forEach((q, i) => lines.push(`${i + 1}. ${LETTERS[q.answerIndex]}) ${q.options[q.answerIndex]}`));
  return lines.join('\n');
};

export interface NotesResult {
  /** Empty when the material is too thin for the chosen format. */
  text: string;
  subject: string;
}

export const generateStudyNotes = (content: string, subjectInput: string, type: NotesType): NotesResult => {
  const text = content.trim();
  const analysis = analyzeText(text, 16);
  // Default subject: the most frequently mentioned key term.
  const mostMentioned = [...analysis.keywords].sort((x, y) => y.count - x.count)[0]?.term;
  const subject = subjectInput.trim() || titleCase(mostMentioned ?? 'Study Notes');
  switch (type) {
    case 'summary':
      return { text: formatSummary(subject, analysis), subject };
    case 'detailed':
      return { text: formatDetailed(subject, text, analysis), subject };
    case 'flashcards': {
      const cards = buildFlashcards(analysis, 10);
      return { text: cards.length > 0 ? formatFlashcards(subject, cards) : '', subject };
    }
    case 'mindmap':
      return { text: analysis.keywords.length > 0 ? formatMindMap(subject, analysis) : '', subject };
    case 'quiz': {
      const quiz = buildQuiz(analysis, text, 8);
      return { text: quiz.length > 0 ? formatQuiz(subject, quiz) : '', subject };
    }
    default:
      return { text: '', subject };
  }
};

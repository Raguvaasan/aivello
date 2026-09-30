/**
 * ATS-style resume analysis against a job description. Pure functions: the component
 * handles files and state. Scores are heuristics a recruiter-screening system commonly
 * weighs (keyword coverage, standard sections, contact details, measurable results),
 * each shown to the user as a transparent breakdown rather than a magic number.
 */
import { STOPWORDS, countWords, stem, splitSentences } from './aiTextSummarizer';

export const MIN_RESUME_WORDS = 50;
export const MIN_JOB_WORDS = 15;
export const MAX_TEXT_LENGTH = 30000;

/** Job-ad filler that is never a useful ATS keyword. */
const JD_STOPWORDS = new Set([
  'ability', 'able', 'across', 'additional', 'apply', 'applicant', 'applicants', 'based', 'benefits', 'best', 'candidate',
  'candidates', 'company', 'competitive', 'day', 'days', 'degree', 'desired', 'duties', 'eg', 'employer', 'equal', 'etc',
  'excellent', 'experience', 'experienced', 'familiarity', 'field', 'full', 'good', 'great', 'help', 'highly', 'ideal',
  'including', 'individual', 'job', 'join', 'knowledge', 'least', 'level', 'looking', 'minimum', 'must', 'nice', 'opportunity',
  'part', 'plus', 'position', 'preferred', 'proven', 'related', 'relevant', 'required', 'requirement', 'requirements',
  'responsibilities', 'responsible', 'role', 'salary', 'seeking', 'skill', 'skills', 'strong', 'successful', 'team', 'time',
  'understanding', 'work', 'working', 'year', 'years', 'you', 'your', 'our', 'will', 'within', 'wide', 'range', 'various',
  'etc', 'e.g', 'i.e', 'hiring', 'hire', 'location', 'remote', 'hybrid', 'office', 'per', 'hour', 'week', 'month',
  'include', 'includes', 'ensure', 'provide', 'support', 'across', 'environment', 'demonstrated', 'solid', 'etc.',
]);

/** Short tokens that are real skills. */
const SHORT_SKILLS = new Set(['ai', 'ml', 'ui', 'ux', 'qa', 'go', 'r', 'c', 'bi', 'hr', 'pr', 'seo', 'sql', 'aws', 'gcp', 'api', 'ios', 'css', 'php', 'crm', 'erp', 'etl', 'kpi', 'b2b', 'b2c', 'cad', 'nlp']);

export const ACTION_VERBS = [
  'achieved', 'analyzed', 'architected', 'automated', 'built', 'coached', 'collaborated', 'conducted', 'coordinated',
  'created', 'cut', 'decreased', 'delivered', 'designed', 'developed', 'directed', 'drove', 'engineered', 'established',
  'exceeded', 'executed', 'expanded', 'generated', 'grew', 'headed', 'implemented', 'improved', 'increased', 'initiated',
  'introduced', 'launched', 'led', 'managed', 'mentored', 'migrated', 'negotiated', 'optimized', 'organized', 'overhauled',
  'owned', 'pioneered', 'planned', 'produced', 'published', 'raised', 'redesigned', 'reduced', 'resolved', 'revamped',
  'saved', 'scaled', 'shipped', 'simplified', 'spearheaded', 'streamlined', 'supervised', 'trained', 'transformed', 'won',
];

const WEAK_PHRASES = ['responsible for', 'duties included', 'worked on', 'helped with', 'assisted with', 'tasked with', 'in charge of'];

const SECTION_PATTERNS: Array<{ name: string; weight: number; re: RegExp }> = [
  { name: 'Work experience', weight: 7, re: /\b(work experience|professional experience|experience|employment|work history|career history)\b/i },
  { name: 'Education', weight: 5, re: /\b(education|academic|qualifications?|university|college|bachelor|master'?s|degree|diploma)\b/i },
  { name: 'Skills', weight: 5, re: /\b(skills|technical skills|core competencies|competencies|technologies|tech stack|expertise|tools)\b/i },
  { name: 'Summary / profile', weight: 3, re: /\b(summary|profile|objective|about me|professional summary)\b/i },
];

const TOKEN_RE = /[a-z0-9][a-z0-9+#]*(?:[./-][a-z0-9+#]+)*/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const LINKEDIN_RE = /linkedin\.com\/(?:in|pub)\/[\w-]+/i;
const PHONE_CANDIDATE_RE = /\+?\(?\d[\d\s().-]{6,18}\d/g;
const YEAR_RANGE_RE = /^(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}$/;
/** Emoji, dingbats, and private-use glyphs from icon fonts: ATS parsers drop or garble them. */
const ICON_GLYPH_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{E000}-\u{F8FF}\u{FFFD}]/u;
/** Percentages, money, multipliers and counted things ("12 engineers"); bare numbers like years or phone digits do not count. */
const METRIC_RE =
  /(?:[$€£₹]\s?\d[\d,.]*\s*[kmb]?|\b\d[\d,.]*\s?(?:%|percent\b|x\b|k\b|\+)|\b\d[\d,.]*\s+(?:users|customers|clients|people|employees|engineers|developers|members|projects|accounts|hours|days|weeks|months|leads|sales|transactions|downloads|countries|stores|students|reports|features|servers|requests|tickets|partners|products|campaigns|locations)\b)/gi;

export interface ScoreItem {
  label: string;
  score: number;
  max: number;
}

export interface ResumeAnalysis {
  score: number;
  keywordMatch: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sections: Array<{ name: string; found: boolean }>;
  contact: { email: boolean; phone: boolean; linkedin: boolean };
  metricsCount: number;
  actionVerbs: string[];
  weakPhrases: string[];
  wordCount: number;
  readability: number;
  formatIssues: string[];
  suggestions: string[];
  breakdown: ScoreItem[];
}

const isJdKeyword = (token: string): boolean => {
  if (/^\d+$/.test(token)) return false;
  if (STOPWORDS.has(token) || JD_STOPWORDS.has(token)) return false;
  if (token.length < 3) return SHORT_SKILLS.has(token);
  return true;
};

interface KeywordCandidate {
  term: string;
  stems: string[];
  weight: number;
}

/**
 * Ranks job-description keywords by frequency, keeping repeated two-word phrases
 * ("project management", "machine learning") whole and boosting acronyms / tech tokens.
 */
export const extractJobKeywords = (jobDescription: string, limit = 25): KeywordCandidate[] => {
  const acronyms = new Set((jobDescription.match(/\b[A-Z][A-Z0-9+#.]{1,}\b/g) ?? []).map((a) => a.toLowerCase()));
  const unigram = new Map<string, { count: number; forms: Map<string, number> }>();
  const bigram = new Map<string, { count: number; form: string; stems: string[] }>();

  splitSentences(jobDescription).forEach((sentence) => {
    // Punctuation (commas, colons, slashes between words) breaks a phrase.
    sentence
      .toLowerCase()
      .split(/[,;:()|]+|\s[-–—]\s/)
      .forEach((segment) => {
        const tokens = segment.match(TOKEN_RE) ?? [];
        let prev: { token: string; stem: string } | null = null;
        tokens.forEach((token) => {
          if (!isJdKeyword(token)) {
            prev = null;
            return;
          }
          const s = stem(token);
          const entry = unigram.get(s) ?? { count: 0, forms: new Map<string, number>() };
          entry.count += 1;
          entry.forms.set(token, (entry.forms.get(token) ?? 0) + 1);
          unigram.set(s, entry);
          if (prev) {
            const key = `${prev.stem} ${s}`;
            const b = bigram.get(key) ?? { count: 0, form: `${prev.token} ${token}`, stems: [prev.stem, s] };
            b.count += 1;
            bigram.set(key, b);
          }
          prev = { token, stem: s };
        });
      });
  });

  const candidates: KeywordCandidate[] = [];
  bigram.forEach((b) => {
    if (b.count >= 2) candidates.push({ term: b.form, stems: b.stems, weight: b.count * 1.5 + 1 });
  });
  unigram.forEach((u, s) => {
    let form = '';
    let best = -1;
    u.forms.forEach((c, f) => {
      if (c > best) {
        best = c;
        form = f;
      }
    });
    const techy = /[+#.]/.test(form) || acronyms.has(form) || SHORT_SKILLS.has(form);
    candidates.push({ term: form, stems: [s], weight: u.count + (techy ? 1.5 : 0) });
  });
  candidates.sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term));

  const chosen: KeywordCandidate[] = [];
  const phraseStems = new Map<string, number>();
  for (const c of candidates) {
    if (chosen.length >= limit) break;
    if (c.stems.length === 1) {
      // Drop a unigram that only ever appears inside an already-chosen phrase.
      const inPhrases = phraseStems.get(c.stems[0]) ?? 0;
      const own = unigram.get(c.stems[0])?.count ?? 0;
      if (inPhrases > 0 && own <= inPhrases) continue;
    } else {
      c.stems.forEach((s) => phraseStems.set(s, (phraseStems.get(s) ?? 0) + (bigram.get(c.stems.join(' '))?.count ?? 0)));
    }
    chosen.push(c);
  }
  return chosen;
};

const resumeStemIndex = (resume: string): { unigrams: Set<string>; bigrams: Set<string> } => {
  const unigrams = new Set<string>();
  const bigrams = new Set<string>();
  const tokens = resume.toLowerCase().match(TOKEN_RE) ?? [];
  let prev: string | null = null;
  tokens.forEach((t) => {
    const s = stem(t);
    unigrams.add(s);
    // Keep stopwords out of bigrams so "management of projects" still loosely matches.
    if (STOPWORDS.has(t)) return;
    if (prev) bigrams.add(`${prev} ${s}`);
    prev = s;
  });
  return { unigrams, bigrams };
};

const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
};

/** Flesch Reading Ease, clamped to 0..100. */
export const readabilityScore = (text: string): number => {
  const words = text.match(/[A-Za-z]+(?:'[a-z]+)?/g) ?? [];
  if (words.length === 0) return 0;
  const sentences = Math.max(1, splitSentences(text).length);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length);
  return Math.round(Math.min(100, Math.max(0, score)));
};

const hasPhone = (text: string): boolean => {
  for (const m of text.matchAll(PHONE_CANDIDATE_RE)) {
    const candidate = m[0].trim();
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15 && !YEAR_RANGE_RE.test(candidate)) return true;
  }
  return false;
};

export const analyzeResume = (resume: string, jobDescription: string): ResumeAnalysis => {
  const keywords = extractJobKeywords(jobDescription);
  const index = resumeStemIndex(resume);
  const matched: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let foundWeight = 0;
  keywords.forEach((k) => {
    totalWeight += k.weight;
    const found = k.stems.length === 1 ? index.unigrams.has(k.stems[0]) : index.bigrams.has(k.stems.join(' '));
    if (found) {
      foundWeight += k.weight;
      matched.push(k.term);
    } else {
      missing.push(k.term);
    }
  });
  const keywordMatch = totalWeight > 0 ? Math.round((foundWeight / totalWeight) * 100) : 0;

  const sections = SECTION_PATTERNS.map((s) => ({ name: s.name, found: s.re.test(resume), weight: s.weight }));
  const contact = { email: EMAIL_RE.test(resume), phone: hasPhone(resume), linkedin: LINKEDIN_RE.test(resume) };
  const metricsCount = (resume.match(METRIC_RE) ?? []).length;
  const lower = resume.toLowerCase();
  const actionVerbs = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`).test(lower));
  const weakPhrases = WEAK_PHRASES.filter((p) => lower.includes(p));
  const wordCount = countWords(resume);

  const formatIssues: string[] = [];
  if (ICON_GLYPH_RE.test(resume)) {
    formatIssues.push('Contains emoji or icon-font symbols that many ATS parsers drop or garble. Use plain text labels instead.');
  }
  const tokens = resume.split(/\s+/).filter(Boolean);
  const singleChars = tokens.filter((t) => t.length === 1 && /[a-z]/i.test(t)).length;
  if (tokens.length > 40 && singleChars / tokens.length > 0.2) {
    formatIssues.push('The text looks broken into single letters. The file may use unusual fonts or text boxes, and an ATS will read it the same way.');
  }
  if (!contact.email) formatIssues.push('No email address detected.');
  if (!contact.phone) formatIssues.push('No phone number detected.');
  if (wordCount < 200) formatIssues.push(`Only ${wordCount} words. Most resumes need 300–800 words to describe experience well.`);
  if (wordCount > 1200) formatIssues.push(`${wordCount} words is long. Aim for 1–2 pages (roughly 400–1000 words).`);

  const sectionScore = sections.reduce((sum, s) => sum + (s.found ? s.weight : 0), 0);
  const contactScore = (contact.email ? 4 : 0) + (contact.phone ? 4 : 0) + (contact.linkedin ? 2 : 0);
  const lengthScore = wordCount >= 200 && wordCount <= 1200 ? 5 : wordCount >= 100 && wordCount <= 1600 ? 3 : 0;
  const glyphPenalty = formatIssues.filter((i) => i.startsWith('Contains') || i.startsWith('The text looks')).length * 2.5;
  const breakdown: ScoreItem[] = [
    { label: 'Keyword match', score: Math.round((keywordMatch / 100) * 45), max: 45 },
    { label: 'Standard sections', score: sectionScore, max: 20 },
    { label: 'Contact details', score: contactScore, max: 10 },
    { label: 'Measurable results', score: Math.min(5, metricsCount) * 2, max: 10 },
    { label: 'Action verbs', score: Math.min(5, actionVerbs.length), max: 5 },
    { label: 'Length', score: lengthScore, max: 5 },
    { label: 'ATS-safe formatting', score: Math.max(0, Math.round(5 - glyphPenalty)), max: 5 },
  ];
  const score = Math.min(100, breakdown.reduce((sum, b) => sum + b.score, 0));

  const suggestions: string[] = [];
  if (missing.length > 0) {
    suggestions.push(
      `Where they truthfully apply, work these job-description keywords into your bullets or skills list: ${missing.slice(0, 10).join(', ')}.`
    );
  }
  sections.filter((s) => !s.found).forEach((s) => suggestions.push(`Add a clearly labelled "${s.name}" section heading.`));
  if (metricsCount < 3) {
    suggestions.push('Quantify results: add numbers such as percentages, revenue, time saved, or team size (e.g. "cut load time by 40%").');
  }
  if (actionVerbs.length < 5) {
    suggestions.push('Start bullets with strong action verbs (led, built, improved, reduced, launched) instead of descriptions of duties.');
  }
  if (weakPhrases.length > 0) {
    suggestions.push(`Replace passive phrases like "${weakPhrases[0]}" with what you achieved.`);
  }
  if (!contact.linkedin) suggestions.push('Add your LinkedIn profile URL to the header.');
  if (suggestions.length === 0) suggestions.push('Strong match. Tailor your summary to the job title and re-check before applying.');

  return {
    score,
    keywordMatch,
    matchedKeywords: matched,
    missingKeywords: missing,
    sections: sections.map(({ name, found }) => ({ name, found })),
    contact,
    metricsCount,
    actionVerbs,
    weakPhrases,
    wordCount,
    readability: readabilityScore(resume),
    formatIssues,
    suggestions,
    breakdown,
  };
};

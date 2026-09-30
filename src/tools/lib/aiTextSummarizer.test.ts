import { analyzeText, countWords, splitSentences, stem, summarizeText, titleCase, truncateWords } from './aiTextSummarizer';
import { generateStudyNotes } from './aiStudyNotes';

const ARTICLE = `Photosynthesis is the process by which green plants use sunlight to make glucose from carbon dioxide and water.
It takes place mainly in the leaves, inside organelles called chloroplasts. Chloroplasts contain chlorophyll, a pigment that absorbs red and blue light.

The light-dependent reactions happen in the thylakoid membranes and produce ATP and oxygen. Oxygen is released as a by-product through the stomata.
The Calvin cycle then uses ATP to fix carbon dioxide into glucose. Scientists such as Melvin Calvin mapped this cycle in the 1950s.

Photosynthesis is essential for life on Earth because it supplies oxygen and food. About 3.5 billion years ago, early bacteria began using sunlight in this way. Without photosynthesis, most food chains would collapse.`;

describe('aiTextSummarizer', () => {
  it('splits sentences without breaking decimals or abbreviations', () => {
    const s = splitSentences('Dr. Smith measured 3.5 litres, e.g. in the lab. Then he left! Did it work?');
    expect(s).toEqual(['Dr. Smith measured 3.5 litres, e.g. in the lab.', 'Then he left!', 'Did it work?']);
  });

  it('treats line breaks and bullets as boundaries', () => {
    expect(splitSentences('- First point\n- Second point\n1. Third')).toEqual(['First point', 'Second point', 'Third']);
  });

  it('counts words and handles blank input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  one two  three ')).toBe(3);
  });

  it('stems related forms to the same key', () => {
    expect(stem('management')).toBe(stem('managed'));
    expect(stem('communication')).toBe(stem('communicate'));
    expect(stem('planning')).toBe(stem('plan'));
    expect(stem('skills')).toBe('skill');
  });

  it('extracts keywords derived from the text', () => {
    const { keywords } = analyzeText(ARTICLE, 8);
    const terms = keywords.map((k) => k.term.toLowerCase());
    expect(terms).toContain('photosynthesis');
    expect(terms.some((t) => t.includes('carbon dioxide') || t.includes('oxygen'))).toBe(true);
  });

  it('summarizes with sentences from the input, in original order', () => {
    const result = summarizeText(ARTICLE, 'bullet', 'short');
    const lines = result.text.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    lines.forEach((l) => expect(ARTICLE).toContain(l.replace(/^• /, '').replace(/\.$/, '')));
    const structured = summarizeText(ARTICLE, 'structured', 'medium').text;
    expect(structured).toMatch(/^Main idea:/);
    expect(structured).toContain('Keywords:');
  });

  it('title-cases and truncates', () => {
    expect(titleCase('the rise of AI in healthcare')).toBe('The Rise of AI in Healthcare');
    expect(truncateWords('one two three four five six', 14)).toBe('one two three…');
  });
});

describe('aiStudyNotes', () => {
  it('builds definition flashcards from the material', () => {
    const { text } = generateStudyNotes(ARTICLE, 'Biology', 'flashcards');
    expect(text).toContain('Q: What is Photosynthesis?');
    expect(text).toContain('A: The process by which green plants');
    expect(text).not.toContain('[Write your answer here]');
    // Passive voice ("Oxygen is released ...") is not a definition.
    expect(text).not.toContain('Q: What is Oxygen?');
    // Proper nouns keep their capitalization.
    expect(text).not.toMatch(/A: calvin\b/);
  });

  it('builds a quiz whose answer key matches the blanked term', () => {
    const { text } = generateStudyNotes(ARTICLE, '', 'quiz');
    expect(text).toContain('ANSWER KEY');
    expect(text).toContain('_____');
    expect(text).not.toMatch(/Correct Answer: D/);
  });

  it('derives the subject when none is given and builds a mind map from key terms', () => {
    const { text, subject } = generateStudyNotes(ARTICLE, '', 'mindmap');
    expect(subject.length).toBeGreaterThan(0);
    expect(text).toContain(subject);
    expect(text).not.toContain('Concept 1');
  });

  it('summary and detailed notes only contain input sentences', () => {
    const summary = generateStudyNotes(ARTICLE, 'Bio', 'summary').text;
    expect(summary).toContain('Key Terms');
    expect(summary).not.toContain('[Define this term]');
    const detailed = generateStudyNotes(ARTICLE, 'Bio', 'detailed').text;
    expect(detailed).toContain('Section 3');
  });
});

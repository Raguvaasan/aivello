import { describe, it, expect } from 'vitest';
import {
  addSuggestedSkills,
  analyzeResume,
  createEmptyResume,
  createSampleResume,
  displayUrl,
  extractKeywords,
  hasResumeContent,
  isAccentId,
  keywordCoverage,
  normalizeUrl,
  resumeFileBase,
  sanitizeResume,
  skillLevelLabel,
  splitDescription,
} from '../../tools/lib/resumeBuilderData';

describe('normalizeUrl', () => {
  it('adds https and keeps http(s) links', () => {
    expect(normalizeUrl('linkedin.com/in/alex')).toBe('https://linkedin.com/in/alex');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    expect(displayUrl('https://www.example.com/a/')).toBe('example.com/a');
  });

  it('rejects dangerous or meaningless values', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,hi')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});

describe('empty and sample resumes', () => {
  it('starts empty so real users never see pre-filled personal data', () => {
    const empty = createEmptyResume();
    expect(hasResumeContent(empty)).toBe(false);
    expect(empty.name).toBe('');
  });

  it('uses only reserved example domains in the sample', () => {
    const sample = createSampleResume();
    expect(sample.email.endsWith('@example.com')).toBe(true);
    expect(hasResumeContent(sample)).toBe(true);
  });
});

describe('analyzeResume', () => {
  it('scores an empty resume 0 and a complete one 100', () => {
    expect(analyzeResume(createEmptyResume()).score).toBe(0);
    expect(analyzeResume(createSampleResume()).score).toBe(100);
  });

  it('ignores empty rows when scoring', () => {
    const form = createEmptyResume();
    form.skills = [
      { id: '1', name: '', level: 3 },
      { id: '2', name: 'React', level: 4 },
    ];
    expect(analyzeResume(form).score).toBe(10);
  });
});

describe('skills', () => {
  it('adds only missing industry skills and drops empty rows', () => {
    const form = createEmptyResume();
    form.skills = [{ id: '1', name: 'react', level: 5 }, { id: '2', name: '', level: 3 }];
    const { skills, added } = addSuggestedSkills(form, 3);
    expect(added).not.toContain('React');
    expect(added).toHaveLength(3);
    expect(skills.map((s) => s.name)).toEqual(['react', ...added]);
  });

  it('labels out-of-range levels safely', () => {
    expect(skillLevelLabel(4)).toBe('Advanced');
    expect(skillLevelLabel(9)).toBe('Expert');
    expect(skillLevelLabel(Number.NaN)).toBe('Intermediate');
  });
});

describe('keywords', () => {
  it('extracts frequent meaningful terms and keeps tech tokens', () => {
    const keywords = extractKeywords('We need React and Node.js. React experience with C++ is a plus. React!');
    expect(keywords[0]).toBe('react');
    expect(keywords).toContain('node.js');
    expect(keywords).toContain('c++');
    expect(keywords).not.toContain('experience');
  });

  it('reports which keywords the resume already covers', () => {
    const coverage = keywordCoverage(createSampleResume(), ['react', 'kubernetes']);
    expect(coverage.present).toEqual(['react']);
    expect(coverage.missing).toEqual(['kubernetes']);
  });
});

describe('splitDescription', () => {
  it('turns -, * and numbered lines into bullets', () => {
    expect(splitDescription('Intro\n- one\n* two\n1. three\n\n')).toEqual([
      { bullet: false, text: 'Intro' },
      { bullet: true, text: 'one' },
      { bullet: true, text: 'two' },
      { bullet: true, text: 'three' },
    ]);
  });
});

describe('sanitizeResume', () => {
  it('rejects non-objects', () => {
    expect(sanitizeResume(null)).toBeNull();
    expect(sanitizeResume('x')).toBeNull();
    expect(sanitizeResume([])).toBeNull();
  });

  it('keeps known fields, fixes bad types and refuses non-image photos', () => {
    const result = sanitizeResume({
      name: 'Alex',
      email: 42,
      careerLevel: 'wizard',
      industry: 'Nope',
      profilePhoto: 'javascript:alert(1)',
      skills: [{ name: 'Go', level: 99 }, 'junk'],
      experiences: 'not a list',
    });
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Alex');
    expect(result?.email).toBe('');
    expect(result?.careerLevel).toBe('entry');
    expect(result?.industry).toBe('Technology');
    expect(result?.profilePhoto).toBe('');
    expect(result?.skills).toHaveLength(1);
    expect(result?.skills[0].level).toBe(5);
    expect(result?.experiences).toHaveLength(1);
  });
});

describe('misc', () => {
  it('builds a download name from the person name', () => {
    expect(resumeFileBase('  Alex  Morgan ')).toBe('Alex_Morgan_Resume');
    expect(resumeFileBase('')).toBe('Resume');
  });

  it('does not treat prototype keys as accents', () => {
    expect(isAccentId('blue')).toBe(true);
    expect(isAccentId('toString')).toBe(false);
  });
});

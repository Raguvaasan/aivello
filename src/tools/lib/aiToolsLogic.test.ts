import { composeEmail, normalizeTopic } from './aiEmailWriter';
import { buildVideoScript, formatTime } from './aiVideoScript';
import { analyzeResume, extractJobKeywords } from './aiResumeScanner';
import { docxXmlToText, detectResumeFileKind, ResumeFileError } from './aiResumeScannerFiles';
import {
  chunkForTranslation,
  countChunks,
  decodeEntities,
  parseMyMemoryResponse,
  pickVoice,
  TranslationError,
  utf8Length,
} from './languageTranslator';
import { analyzeAnswer, generateQuestionsForRole } from '../../utils/interviewAnalysis';

describe('aiEmailWriter', () => {
  it('uses the topic, points, recipient and sender', () => {
    const email = composeEmail({
      type: 'meeting',
      tone: 'formal',
      topic: 'Q3 budget review',
      keyPoints: '- Marketing spend\n- Hiring plan',
      recipient: 'Ms. Patel',
      sender: 'Arun',
      variant: 0,
    });
    expect(email.subject).toBe('Meeting Request: Q3 Budget Review');
    expect(email.body).toContain('Dear Ms. Patel,');
    expect(email.body).toContain('request a meeting regarding Q3 budget review');
    expect(email.body).toContain('- Marketing spend.');
    expect(email.body.trim().endsWith('Arun')).toBe(true);
  });

  it('phrases verb topics naturally and strips duplicated lead-ins', () => {
    expect(composeEmail({ type: 'professional', tone: 'formal', topic: 'Ask about the internship.', keyPoints: '', recipient: '', sender: '', variant: 0 }).body).toContain(
      'I am writing to ask about the internship.'
    );
    expect(composeEmail({ type: 'apology', tone: 'casual', topic: 'apologize for the late delivery', keyPoints: '', recipient: 'Sam', sender: '', variant: 0 }).body).toContain(
      'sorry about the late delivery'
    );
    expect(normalizeTopic('Regarding NASA grant')).toBe('NASA grant');
  });
});

describe('aiVideoScript', () => {
  it('computes timings from the duration and uses the key points', () => {
    const script = buildVideoScript(
      { topic: 'How to Build a Morning Routine', durationMin: 5, style: 'tutorial', audience: 'busy parents', keyPoints: 'Wake up earlier\nHydrate', callToAction: '' },
      2026
    );
    expect(script).toContain('know exactly how to build a morning routine');
    expect(script).toContain('#MorningRoutine');
    expect(script).toContain('SECTION 1: WAKE UP EARLIER');
    expect(script).toContain('SECTION 2: HYDRATE');
    expect(script).toContain('5:00]');
    expect(script).toContain('busy parents');
    expect(formatTime(75)).toBe('1:15');
  });
});

const JD = `We are hiring a Frontend Developer with strong React and TypeScript skills.
You will build accessible UI components, write unit tests with Jest, and work with REST APIs.
Experience with React performance tuning, CI/CD pipelines and AWS is a plus. Knowledge of TypeScript generics preferred.`;

const RESUME = `Jane Doe
jane@example.com | +91 98765 43210 | linkedin.com/in/janedoe
SUMMARY
Frontend developer with 5 years of experience.
EXPERIENCE
Built React and TypeScript dashboards used by 20,000 users; reduced load time by 40%.
Led migration to CI/CD pipelines and mentored 3 developers.
EDUCATION
B.Tech Computer Science, 2019
SKILLS
React, TypeScript, Jest, REST APIs, accessibility`;

describe('aiResumeScanner', () => {
  it('extracts meaningful job keywords, not filler', () => {
    const terms = extractJobKeywords(JD).map((k) => k.term);
    expect(terms).toContain('react');
    expect(terms).toContain('typescript');
    expect(terms).not.toContain('you');
    expect(terms).not.toContain('with');
    expect(terms).not.toContain('skills');
  });

  it('scores a matching resume well and explains the breakdown', () => {
    const a = analyzeResume(RESUME, JD);
    expect(a.contact).toEqual({ email: true, phone: true, linkedin: true });
    expect(a.sections.every((s) => s.found)).toBe(true);
    expect(a.matchedKeywords).toEqual(expect.arrayContaining(['react', 'typescript', 'jest']));
    expect(a.metricsCount).toBeGreaterThanOrEqual(2);
    expect(a.score).toBeGreaterThan(60);
    expect(a.breakdown.reduce((s, b) => s + b.max, 0)).toBe(100);
  });

  it('flags a thin resume', () => {
    const a = analyzeResume('I like computers and I am a hard worker who wants a job at your company.', JD);
    expect(a.score).toBeLessThan(30);
    expect(a.formatIssues.some((i) => i.includes('email'))).toBe(true);
    expect(a.missingKeywords.length).toBeGreaterThan(3);
  });

  it('reads DOCX paragraph XML and validates file types', () => {
    const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p><w:r><w:t>Jane</w:t></w:r><w:r><w:t xml:space="preserve"> Doe</w:t></w:r></w:p>
      <w:p><w:r><w:t>Skills</w:t><w:tab/><w:t>React</w:t></w:r></w:p></w:body></w:document>`;
    expect(docxXmlToText(xml)).toBe('Jane Doe\nSkills\tReact');
    expect(() => detectResumeFileKind(new File(['x'], 'cv.doc'))).toThrow(ResumeFileError);
    expect(() => detectResumeFileKind(new File(['x'], 'cv.png', { type: 'image/png' }))).toThrow(ResumeFileError);
    expect(detectResumeFileKind(new File(['x'], 'cv.PDF'))).toBe('pdf');
  });
});

describe('languageTranslator', () => {
  it('keeps every chunk under the MyMemory byte limit and preserves line breaks', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const paragraphs = chunkForTranslation(`${long}\n\nSecond paragraph.`);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].separator).toBe('\n\n');
    paragraphs.flatMap((p) => p.chunks).forEach((c) => expect(utf8Length(c)).toBeLessThanOrEqual(450));
    expect(countChunks(paragraphs)).toBeGreaterThan(2);
    const hindi = chunkForTranslation('नमस्ते '.repeat(120));
    hindi.flatMap((p) => p.chunks).forEach((c) => expect(utf8Length(c)).toBeLessThanOrEqual(450));
  });

  it('parses success, quota and language errors', () => {
    expect(parseMyMemoryResponse({ responseStatus: 200, responseData: { translatedText: 'l&#39;eau' } })).toBe("l'eau");
    expect(() =>
      parseMyMemoryResponse({
        responseStatus: 429,
        responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY. NEXT AVAILABLE IN  10 HOURS 22 MINUTES VISIT ...' },
      })
    ).toThrow(/resets in 10 hours 22 minutes/);
    try {
      parseMyMemoryResponse({ responseStatus: '403', responseData: { translatedText: "'XX' IS AN INVALID TARGET LANGUAGE" } });
    } catch (e) {
      expect(e).toBeInstanceOf(TranslationError);
      expect((e as TranslationError).kind).toBe('language');
    }
    expect(decodeEntities('&quot;hi&quot; &amp; &#x41;')).toBe('"hi" & A');
  });

  it('picks the best voice for a language', () => {
    const voices = [
      { lang: 'en-GB', localService: true, name: 'A' },
      { lang: 'es_MX', localService: false, name: 'B' },
      { lang: 'es-ES', localService: false, name: 'C' },
      { lang: 'nb-NO', localService: true, name: 'D' },
    ] as unknown as SpeechSynthesisVoice[];
    expect(pickVoice(voices, 'es-ES')?.name).toBe('C');
    expect(pickVoice(voices, 'es-AR')?.name).toBe('B');
    expect(pickVoice(voices, 'nb-NO')?.name).toBe('D');
    expect(pickVoice(voices, 'ta-IN')).toBeNull();
  });
});

describe('interviewAnalysis', () => {
  it('tailors questions to the role and industry', () => {
    const qs = generateQuestionsForRole('Registered Nurse', 'mid', 'Healthcare', () => 0.3);
    expect(qs).toHaveLength(6);
    expect(qs.some((q) => q.id.startsWith('hc-'))).toBe(true);
    expect(qs.some((q) => q.question.includes('Registered Nurse') || q.question.includes('Healthcare'))).toBe(true);
    const senior = generateQuestionsForRole('Engineering Manager', 'lead', '', () => 0.5);
    expect(senior.some((q) => q.id.startsWith('lead-'))).toBe(true);
  });

  it('rewards a STAR answer over a vague one', () => {
    const question = {
      id: 'behav-2',
      question: 'Describe a situation where you had to meet a tight deadline.',
      category: 'Time Management',
      difficulty: 'medium' as const,
      kind: 'behavioral' as const,
      expectedKeywords: ['plan', 'prioritize', 'deadline', 'communicate', 'deliver'],
    };
    const ctx = { role: 'Project Manager', experience: 'mid' as const, industry: 'Retail' };
    const strong = analyzeAnswer(
      'In my previous role at a retail chain, we had two weeks to launch a holiday campaign. My task was to coordinate five teams and hit the deadline. ' +
        'I broke the work into daily milestones, prioritized the features that drove revenue, and I set up a short stand-up to communicate blockers early. ' +
        'I also negotiated to move two low-value items to January. As a result, we delivered on time and the campaign increased online sales by 18%.',
      question,
      ctx
    );
    const weak = analyzeAnswer('I think I am good with deadlines, maybe because I work hard and stuff like that.', question, ctx);
    expect(strong.structure).toEqual({ situation: true, task: true, action: true, result: true });
    expect(strong.overall.score).toBeGreaterThan(weak.overall.score + 25);
    expect(weak.stats.hedges).toBeGreaterThanOrEqual(2);
    expect(weak.content.improvements.length).toBeGreaterThan(1);
  });
});

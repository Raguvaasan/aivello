import type {
  AnswerFeedback,
  ExperienceLevel,
  InterviewQuestion,
  QuestionKind,
  StarCoverage,
} from '../types/interview';
import { technicalQuestions } from '../data/interview/technical';
import { behavioralQuestions } from '../data/interview/behavioral';
import { leadershipQuestions } from '../data/interview/leadership';
import { findRoleBank } from '../data/interview/roleSpecific';
import { STOPWORDS, countWords, splitSentences, stem, tokenize } from '../tools/lib/aiTextSummarizer';

export const MIN_ANSWER_WORDS = 15;
export const QUESTION_COUNT = 6;

export interface JobContext {
  role: string;
  experience: ExperienceLevel;
  industry: string;
}

// ---------------------------------------------------------------------------------------
// Question generation
// ---------------------------------------------------------------------------------------

const shuffleArray = <T,>(array: T[], rand: () => number = Math.random): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ALLOWED_DIFFICULTY: Record<ExperienceLevel, InterviewQuestion['difficulty'][]> = {
  entry: ['easy', 'medium'],
  mid: ['easy', 'medium', 'hard'],
  senior: ['medium', 'hard'],
  lead: ['medium', 'hard'],
};

const byDifficulty = (questions: InterviewQuestion[], experience: ExperienceLevel): InterviewQuestion[] => {
  const allowed = ALLOWED_DIFFICULTY[experience];
  const filtered = questions.filter((q) => allowed.includes(q.difficulty));
  // Small banks can filter down to nothing; fall back rather than returning no questions.
  return filtered.length > 0 ? filtered : questions;
};

/** Questions written around the user's own job title and industry. */
const contextQuestions = (role: string, industry: string, experience: ExperienceLevel): InterviewQuestion[] => {
  const inIndustry = industry ? ` in the ${industry} industry` : '';
  const list: InterviewQuestion[] = [
    {
      id: 'ctx-why',
      question: `Why do you want to work as a ${role}${inIndustry}?`,
      category: 'Motivation',
      difficulty: 'easy',
      kind: 'motivation',
      expectedKeywords: ['passion', 'skills', 'growth', 'impact', ...(industry ? [industry.toLowerCase()] : [])],
    },
    {
      id: 'ctx-background',
      question: `Walk me through your background and how it prepares you for this ${role} role.`,
      category: 'Background',
      difficulty: 'easy',
      kind: 'motivation',
      expectedKeywords: ['experience', 'skills', 'achievement', 'goal', role.toLowerCase().split(/\s+/).pop() ?? ''].filter(Boolean),
    },
    {
      id: 'ctx-industry',
      question: industry
        ? `What do you see as the biggest challenge facing the ${industry} industry right now, and how would you help as a ${role}?`
        : `What do you see as the biggest challenge in ${role} work today, and how do you deal with it?`,
      category: 'Industry Insight',
      difficulty: 'medium',
      kind: 'situational',
      expectedKeywords: ['trend', 'challenge', 'customer', 'solution', 'impact'],
    },
  ];
  if (experience === 'entry') {
    list.push({
      id: 'ctx-entry',
      question: `Tell me about a school, internship or personal project that shows you are ready for a ${role} position.`,
      category: 'Readiness',
      difficulty: 'easy',
      kind: 'behavioral',
      expectedKeywords: ['project', 'learn', 'skills', 'result', 'team'],
    });
  } else {
    list.push({
      id: 'ctx-90days',
      question: `How would you approach your first 90 days as a ${role}${industry ? ` at a ${industry} company` : ''}?`,
      category: 'Onboarding Plan',
      difficulty: 'medium',
      kind: 'situational',
      expectedKeywords: ['listen', 'learn', 'priorities', 'stakeholders', 'quick wins'],
    });
  }
  return list;
};

/**
 * Builds a practice set: questions for the detected role family, questions written
 * around the user's title and industry, behavioral questions, and leadership questions
 * for senior/lead levels.
 */
export const generateQuestionsForRole = (
  role: string,
  experience: ExperienceLevel,
  industry: string,
  rand: () => number = Math.random
): InterviewQuestion[] => {
  const cleanRole = role.trim().replace(/\s+/g, ' ');
  const cleanIndustry = industry.trim().replace(/\s+/g, ' ');
  const bank = findRoleBank(cleanRole);
  const senior = experience === 'senior' || experience === 'lead';

  const picks: InterviewQuestion[] = [];
  const take = (pool: InterviewQuestion[], n: number) => {
    shuffleArray(pool, rand)
      .filter((q) => !picks.some((p) => p.id === q.id))
      .slice(0, n)
      .forEach((q) => picks.push(q));
  };

  // Order matters: the list is capped at QUESTION_COUNT, so the most tailored come first.
  take(contextQuestions(cleanRole, cleanIndustry, experience), senior ? 1 : 2);
  if (bank) take(byDifficulty(bank.questions, experience), 2);
  if (senior) take(byDifficulty(leadershipQuestions, experience), 2);
  take(byDifficulty(behavioralQuestions, experience), 1);
  if (!bank || bank.technical) take(byDifficulty(technicalQuestions, experience), 1);
  take(byDifficulty(behavioralQuestions, experience), 1);
  // Top up to the target size from whatever is left.
  take([...(bank?.questions ?? []), ...behavioralQuestions, ...technicalQuestions], QUESTION_COUNT - picks.length);

  return picks.slice(0, QUESTION_COUNT);
};

export const detectRoleFamily = (role: string): string | null => findRoleBank(role)?.label ?? null;

// ---------------------------------------------------------------------------------------
// Answer analysis
// ---------------------------------------------------------------------------------------

const STAR_PATTERNS: Record<keyof StarCoverage, RegExp> = {
  situation:
    /\b(when i was|at my (previous|last|current|old|first)|while (working|i was|we were)|in my (previous |last |current |first )?(role|job|position|internship|team|company|class)|last (year|month|quarter|semester)|the situation|there was a|we were|during (my|a|the)|a few (years|months) ago|once,? (i|we))\b/i,
  task: /\b(my (task|goal|role|responsibility|job|objective) was|i was (responsible|asked|tasked|expected)|i needed to|i had to|we needed to|we had to|the (goal|challenge|problem|objective) was|i was supposed to)\b/i,
  action:
    /\b(i (decided|created|built|led|organi[sz]ed|implemented|proposed|scheduled|spoke|talked|met|reached out|analy[sz]ed|designed|developed|set up|started|took|made|wrote|introduced|prioriti[sz]ed|delegated|coached|asked|listened|suggested|reviewed|tested|fixed|researched|contacted|explained|negotiated|trained|called|focused|broke|changed|worked with|volunteered|stayed))\b/i,
  result:
    /\b(as a result|resulted in|the result|in the end|ultimately|the outcome|which (led|helped|meant|allowed|reduced|increased|improved|saved)|we (achieved|delivered|reduced|increased|improved|finished|launched|saved|won|met|hit)|(increased|reduced|improved|saved|cut|grew) (by|the|our)|\d+\s?%|on time|ahead of schedule|i learned|we learned|since then)\b/i,
};

const EXAMPLE_RE = /\b(for example|for instance|specifically|such as|one time|in one case|a recent example|at my (previous|last|current))\b/i;
const NUMBER_RE = /\b\d+(?:[.,]\d+)?\s?(?:%|percent|x\b|k\b)?|\b(one|two|three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand)\b/i;
const FILLER_RE = /\b(um+|uh+|erm|basically|literally|you know|kind of|sort of|stuff like that|and stuff|whatever)\b/gi;
const HEDGE_RE = /\b(i think|maybe|probably|i guess|i'?m not sure|i am not sure|hopefully|perhaps|i suppose|i feel like)\b/gi;
const CONCLUSION_RE = /\b(in (the )?end|overall|ultimately|in conclusion|to sum up|that'?s why|this taught me|i learned|looking back)\b/i;

/** Words in a question that say nothing about its topic. */
const QUESTION_FILLER = new Set([
  'tell', 'describe', 'time', 'example', 'give', 'walk', 'through', 'approach', 'would', 'handle', 'situation',
  'experience', 'work', 'worked', 'recent', 'think', 'right', 'today', 'help', 'deal', 'someone', 'something',
  'decide', 'look', 'looks', 'like', 'kind', 'know', 'make', 'sure', 'ensure', 'your', 'what', 'why', 'which',
]);

const isStarQuestion = (question: InterviewQuestion): boolean =>
  question.kind === 'behavioral' ||
  question.kind === 'leadership' ||
  /^(tell me about a (time|project|mistake|situation)|describe a (time|situation)|give an example)/i.test(question.question);

const stemSet = (text: string): Set<string> => new Set(tokenize(text).map(stem));

const keywordFound = (keyword: string, answerLower: string, answerStems: Set<string>): boolean => {
  const k = keyword.toLowerCase();
  if (answerLower.includes(k)) return true;
  const parts = tokenize(k).filter((t) => !STOPWORDS.has(t));
  return parts.length > 0 && parts.every((p) => answerStems.has(stem(p)));
};

const clamp = (n: number, min = 0, max = 100): number => Math.round(Math.min(max, Math.max(min, n)));

const IDEAL_WORDS: Record<'star' | 'other', [number, number]> = { star: [90, 280], other: [50, 200] };

const KIND_LABEL: Partial<Record<QuestionKind, string>> = {
  behavioral: 'behavioral',
  leadership: 'leadership',
  technical: 'technical',
  situational: 'situational',
  motivation: 'motivation',
  role: 'role-specific',
};

export const analyzeAnswer = (answer: string, question: InterviewQuestion, context: JobContext): AnswerFeedback => {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const words = countWords(text);
  const sentences = Math.max(1, splitSentences(text).length);
  const answerStems = stemSet(text);
  const star = isStarQuestion(question);

  // Keywords the interviewer is listening for.
  const expected = (question.expectedKeywords ?? []).filter(Boolean);
  const found = expected.filter((k) => keywordFound(k, lower, answerStems));
  const missing = expected.filter((k) => !found.includes(k));
  const keywordScore = expected.length ? (found.length / expected.length) * 100 : 60;

  // Topical overlap with the question itself and the role.
  const topicStems = Array.from(
    new Set(
      tokenize(`${question.question} ${context.role} ${context.industry}`)
        .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !QUESTION_FILLER.has(t))
        .map(stem)
    )
  );
  const overlap = topicStems.length ? topicStems.filter((s) => answerStems.has(s)).length / topicStems.length : 0.5;
  const relevance = clamp(keywordScore * 0.5 + Math.min(1, overlap * 1.6) * 50);

  // Structure.
  const structure: StarCoverage = {
    situation: STAR_PATTERNS.situation.test(text),
    task: STAR_PATTERNS.task.test(text),
    action: STAR_PATTERNS.action.test(text),
    result: STAR_PATTERNS.result.test(text),
  };
  const starParts = Object.values(structure).filter(Boolean).length;
  const hasExample = EXAMPLE_RE.test(text) || structure.situation;
  const hasNumbers = NUMBER_RE.test(text);
  const hasConclusion = CONCLUSION_RE.test(text) || structure.result;
  const structureScore = star
    ? (starParts / 4) * 100
    : (hasExample ? 40 : 0) + (sentences >= 3 ? 30 : sentences * 10) + (hasConclusion ? 30 : 0);

  // Delivery signals.
  const fillers = Array.from(new Set((text.match(FILLER_RE) ?? []).map((f) => f.toLowerCase())));
  const fillerCount = (text.match(FILLER_RE) ?? []).length;
  const hedges = (text.match(HEDGE_RE) ?? []).length;
  const iCount = (text.match(/\bi\b/gi) ?? []).length;
  const weCount = (text.match(/\bwe\b/gi) ?? []).length;
  const avgSentence = words / sentences;

  const [minWords, maxWords] = IDEAL_WORDS[star ? 'star' : 'other'];
  const conciseness = words < minWords ? clamp((words / minWords) * 100) : words > maxWords ? clamp(100 - (words - maxWords) / 3, 40) : 100;
  const sentencePenalty = avgSentence > 30 ? (avgSentence - 30) * 3 : avgSentence < 6 ? (6 - avgSentence) * 8 : 0;
  const clarity = clamp(100 - sentencePenalty - Math.min(40, fillerCount * 8));
  const confidence = clamp(
    95 - hedges * 12 - fillerCount * 4 - (iCount === 0 ? 15 : 0) - (weCount > iCount * 2 && iCount < 2 ? 10 : 0) + (hasNumbers ? 5 : 0),
    15
  );

  const contentScore = clamp(
    structureScore * 0.4 + keywordScore * 0.3 + (hasExample ? 100 : 40) * 0.15 + (hasNumbers ? 100 : 50) * 0.15
  );
  const overallScore = clamp(contentScore * 0.5 + clarity * 0.15 + confidence * 0.15 + conciseness * 0.1 + relevance * 0.1);

  // Feedback text.
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (star) {
    if (starParts === 4) strengths.push('Complete STAR structure: situation, task, action and result are all there.');
    else {
      const missingParts = (Object.keys(structure) as Array<keyof StarCoverage>).filter((k) => !structure[k]);
      improvements.push(`Use the STAR method – your answer is missing the ${missingParts.join(', ')} part${missingParts.length > 1 ? 's' : ''}.`);
      if (structure.action) strengths.push('You describe concrete actions you took.');
    }
    if (!structure.result) improvements.push('End with the outcome: what changed because of what you did?');
  } else if (hasExample) {
    strengths.push('You back your answer up with a concrete example.');
  } else {
    improvements.push('Support your answer with a specific example from your experience.');
  }

  if (found.length >= Math.ceil(expected.length * 0.6) && expected.length > 0) {
    strengths.push(`Covers the themes interviewers listen for (${found.slice(0, 4).join(', ')}).`);
  } else if (missing.length > 0) {
    improvements.push(`Touch on themes like ${missing.slice(0, 3).join(', ')} where they genuinely apply.`);
  }

  if (hasNumbers) strengths.push('Uses numbers or specifics, which makes the impact believable.');
  else improvements.push('Quantify something: a percentage, time saved, team size or number of customers.');

  if (words < MIN_ANSWER_WORDS * 3) improvements.push(`At ${words} words this is brief. Aim for ${minWords}–${maxWords} words (about 1–2 minutes spoken).`);
  else if (words > maxWords) improvements.push(`At ${words} words this may run long. Aim for ${minWords}–${maxWords} words and cut side details.`);
  else strengths.push(`Good length (${words} words, about ${Math.max(1, Math.round(words / 140))} minute${words >= 210 ? 's' : ''} spoken).`);

  if (hedges >= 2) improvements.push(`Replace hedging phrases ("I think", "maybe") with direct statements – found ${hedges}.`);
  if (fillers.length > 0) improvements.push(`Cut filler words: ${fillers.join(', ')}.`);
  if (weCount > iCount * 2 && iCount < 2) improvements.push('Say "I" for your own contribution – interviewers want to know what you did, not just the team.');
  if (avgSentence > 30) improvements.push('Some sentences are very long. Break them up so the answer is easier to follow.');

  const kindLabel = question.kind ? KIND_LABEL[question.kind] : undefined;
  const summary =
    overallScore >= 80
      ? `Strong ${kindLabel ?? ''} answer. It is well structured and specific – polish the small points below and practise saying it aloud.`.replace('  ', ' ')
      : overallScore >= 60
        ? `Solid start. The answer addresses the question, but ${improvements[0] ? improvements[0].charAt(0).toLowerCase() + improvements[0].slice(1) : 'adding detail would make it more convincing.'}`
        : `This answer needs more work. Focus first on: ${improvements[0] ?? 'adding a specific example and a clear outcome.'}`;

  const nextSteps: string[] = [];
  if (star && starParts < 4) nextSteps.push('Rewrite the answer as four short parts: Situation → Task → Action → Result.');
  if (!hasNumbers) nextSteps.push('Add one measurable result to your story.');
  if (missing.length > 0) nextSteps.push(`Think of a true example that shows ${missing[0]}.`);
  nextSteps.push('Record yourself answering in under two minutes, then compare with this written version.');

  return {
    content: { score: contentScore, strengths, improvements },
    delivery: { confidence, clarity, conciseness, relevance },
    keywords: { found, missing, score: clamp(keywordScore) },
    structure: star ? structure : undefined,
    stats: { words, sentences, fillerWords: fillers, hedges },
    overall: { score: overallScore, summary, nextSteps: nextSteps.slice(0, 4) },
  };
};

export const questionTip = (question: InterviewQuestion): string => {
  if (isStarQuestion(question)) {
    return 'Use STAR: set the Situation, state your Task, explain the Actions you took, and finish with the Result.';
  }
  switch (question.kind) {
    case 'motivation':
      return 'Connect your skills and goals to this specific role. Be genuine and specific, not generic.';
    case 'situational':
      return 'Explain how you would think it through step by step, then back it up with something you have done before.';
    case 'technical':
    case 'role':
      return 'Describe your approach, name the tools or methods you use, and give a short real example.';
    default:
      return 'Answer directly, give one concrete example, and close with what it shows about you.';
  }
};

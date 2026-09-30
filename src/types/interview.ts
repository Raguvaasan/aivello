export type Difficulty = 'easy' | 'medium' | 'hard';

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';

/** Behavioral and leadership questions are scored against the STAR structure. */
export type QuestionKind = 'behavioral' | 'leadership' | 'technical' | 'role' | 'motivation' | 'situational';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: Difficulty;
  kind?: QuestionKind;
  expectedKeywords?: string[];
}

export interface StarCoverage {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
}

export interface AnswerFeedback {
  content: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  delivery: {
    confidence: number;
    clarity: number;
    conciseness: number;
    relevance: number;
  };
  keywords: {
    found: string[];
    missing: string[];
    score: number;
  };
  /** Present for behavioral / leadership questions. */
  structure?: StarCoverage;
  stats: {
    words: number;
    sentences: number;
    fillerWords: string[];
    hedges: number;
  };
  overall: {
    score: number;
    summary: string;
    nextSteps: string[];
  };
}

export interface InterviewContext {
  jobRole: string;
  experienceLevel: ExperienceLevel;
  industry: string;
  specialization?: string;
}

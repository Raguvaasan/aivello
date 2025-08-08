export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedKeywords?: string[];
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
  overall: {
    score: number;
    summary: string;
    nextSteps: string[];
  };
}

export interface InterviewContext {
  jobRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  industry: string;
  specialization?: string;
}

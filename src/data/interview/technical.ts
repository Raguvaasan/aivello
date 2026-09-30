import { InterviewQuestion } from '../../types/interview';

/** General problem-solving / craft questions that suit most technical roles. */
export const technicalQuestions: InterviewQuestion[] = [
  {
    id: 'tech-1',
    question: 'What is your approach to solving complex technical problems?',
    category: 'Problem Solving',
    difficulty: 'medium',
    kind: 'technical',
    expectedKeywords: ['break down', 'analyze', 'debug', 'test', 'document'],
  },
  {
    id: 'tech-2',
    question: 'Describe a challenging technical project you worked on.',
    category: 'Experience',
    difficulty: 'medium',
    kind: 'behavioral',
    expectedKeywords: ['challenge', 'solution', 'implement', 'result', 'trade-off'],
  },
  {
    id: 'tech-3',
    question: 'How do you stay updated with new technologies in your field?',
    category: 'Learning',
    difficulty: 'easy',
    kind: 'technical',
    expectedKeywords: ['learn', 'course', 'read', 'practice', 'community'],
  },
  {
    id: 'tech-4',
    question: 'What is your experience with agile development methodologies?',
    category: 'Methodology',
    difficulty: 'medium',
    kind: 'technical',
    expectedKeywords: ['scrum', 'sprint', 'retrospective', 'collaboration', 'iteration'],
  },
  {
    id: 'tech-5',
    question: 'How do you ensure quality in the work you ship?',
    category: 'Quality',
    difficulty: 'hard',
    kind: 'technical',
    expectedKeywords: ['testing', 'review', 'standards', 'automation', 'monitor'],
  },
];

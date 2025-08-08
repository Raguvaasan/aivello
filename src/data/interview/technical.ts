import { InterviewQuestion } from '../../types/interview';

export const technicalQuestions: InterviewQuestion[] = [
  {
    id: 'tech-1',
    question: 'What is your approach to solving complex technical problems?',
    category: 'Problem Solving',
    difficulty: 'medium',
    expectedKeywords: ['systematic', 'analyze', 'debug', 'test', 'documentation'],
  },
  {
    id: 'tech-2',
    question: 'Describe a challenging technical project you worked on.',
    category: 'Experience',
    difficulty: 'medium',
    expectedKeywords: ['challenge', 'solution', 'implementation', 'results', 'team'],
  },
  {
    id: 'tech-3',
    question: 'How do you stay updated with new technologies in your field?',
    category: 'Learning',
    difficulty: 'easy',
    expectedKeywords: ['learning', 'courses', 'reading', 'practice', 'community'],
  },
  {
    id: 'tech-4',
    question: 'What is your experience with agile development methodologies?',
    category: 'Methodology',
    difficulty: 'medium',
    expectedKeywords: ['scrum', 'sprint', 'retrospective', 'collaboration', 'iteration'],
  },
  {
    id: 'tech-5',
    question: 'How do you ensure code quality in your projects?',
    category: 'Quality',
    difficulty: 'hard',
    expectedKeywords: ['testing', 'review', 'standards', 'documentation', 'automation'],
  },
];

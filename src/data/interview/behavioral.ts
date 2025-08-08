import { InterviewQuestion } from '../../types/interview';

export const behavioralQuestions: InterviewQuestion[] = [
  {
    id: 'behav-1',
    question: 'Tell me about a time when you had to deal with a difficult team member.',
    category: 'Conflict Resolution',
    difficulty: 'medium',
    expectedKeywords: ['communication', 'resolution', 'understanding', 'compromise', 'team'],
  },
  {
    id: 'behav-2',
    question: 'Describe a situation where you had to meet a tight deadline.',
    category: 'Time Management',
    difficulty: 'medium',
    expectedKeywords: ['planning', 'prioritize', 'execution', 'stress', 'delivery'],
  },
  {
    id: 'behav-3',
    question: 'How do you handle criticism of your work?',
    category: 'Feedback',
    difficulty: 'easy',
    expectedKeywords: ['feedback', 'improvement', 'learning', 'growth', 'professional'],
  },
  {
    id: 'behav-4',
    question: 'Give an example of a goal you reached and how you achieved it.',
    category: 'Achievement',
    difficulty: 'medium',
    expectedKeywords: ['goal', 'planning', 'execution', 'success', 'milestone'],
  },
  {
    id: 'behav-5',
    question: 'Describe a time when you had to adapt to a significant change at work.',
    category: 'Adaptability',
    difficulty: 'hard',
    expectedKeywords: ['change', 'adapt', 'flexible', 'learn', 'positive'],
  },
];

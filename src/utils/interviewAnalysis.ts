import { AnswerFeedback, InterviewQuestion } from '../types/interview';
import { technicalQuestions } from '../data/interview/technical';
import { behavioralQuestions } from '../data/interview/behavioral';
import { leadershipQuestions } from '../data/interview/leadership';

export const analyzeAnswer = (
  answer: string,
  question: InterviewQuestion,
  jobContext: { role: string; experience: string; industry: string }
): AnswerFeedback => {
  const words = answer.toLowerCase().split(/\s+/);
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Keyword analysis
  const foundKeywords = new Set<string>();
  const missingKeywords = new Set<string>();
  
  question.expectedKeywords?.forEach(keyword => {
    if (answer.toLowerCase().includes(keyword.toLowerCase())) {
      foundKeywords.add(keyword);
    } else {
      missingKeywords.add(keyword);
    }
  });

  // Content analysis
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Length analysis
  if (words.length < 50) {
    improvements.push('Answer is too brief. Aim for more comprehensive responses.');
  } else if (words.length > 200) {
    improvements.push('Answer is quite long. Try to be more concise while maintaining key points.');
  }

  // Structure analysis
  const hasIntro = sentences.length > 0 && sentences[0].toLowerCase().includes(question.category.toLowerCase());
  const hasConclusion = sentences.length > 0 && (
    sentences[sentences.length - 1].includes('Therefore') || 
    sentences[sentences.length - 1].includes('In conclusion')
  );

  if (hasIntro) {
    strengths.push('Good introduction that addresses the question directly');
  } else {
    improvements.push('Consider starting with a clear introduction that addresses the question');
  }

  if (hasConclusion) {
    strengths.push('Strong conclusion that ties the answer together');
  }

  // Examples analysis
  const hasSpecificExamples = answer.includes('for example') || answer.includes('instance') || answer.includes('specifically');
  if (hasSpecificExamples) {
    strengths.push('Good use of specific examples to support points');
  } else {
    improvements.push('Include specific examples to strengthen your answer');
  }

  // Calculate scores
  const contentScore = Math.min(
    100,
    Math.round(
      (foundKeywords.size / (question.expectedKeywords?.length || 1)) * 40 +
      (hasIntro ? 20 : 0) +
      (hasConclusion ? 20 : 0) +
      (hasSpecificExamples ? 20 : 0)
    )
  );

  const clarityScore = Math.min(
    100,
    Math.round(
      (sentences.length > 3 ? 30 : 0) +
      (words.length > 50 ? 30 : 0) +
      (hasSpecificExamples ? 40 : 0)
    )
  );

  // Prepare feedback object
  const feedback: AnswerFeedback = {
    content: {
      score: contentScore,
      strengths,
      improvements,
    },
    delivery: {
      confidence: clarityScore,
      clarity: clarityScore,
      conciseness: words.length < 150 ? 90 : 70,
      relevance: foundKeywords.size / (question.expectedKeywords?.length || 1) * 100,
    },
    keywords: {
      found: Array.from(foundKeywords),
      missing: Array.from(missingKeywords),
      score: (foundKeywords.size / (question.expectedKeywords?.length || 1)) * 100,
    },
    overall: {
      score: Math.round((contentScore + clarityScore) / 2),
      summary: '',
      nextSteps: []
    }
  };

  // Generate overall summary
  feedback.overall.summary = generateOverallSummary(feedback);
  feedback.overall.nextSteps = generateNextSteps(feedback);

  return feedback;
};

const generateOverallSummary = (feedback: AnswerFeedback): string => {
  const { content } = feedback;
  
  if (content.score >= 80) {
    return 'Excellent answer! You demonstrated strong understanding and provided comprehensive details.';
  } else if (content.score >= 60) {
    return 'Good answer with some room for improvement. Focus on addressing the suggested improvements.';
  } else {
    return 'The answer needs work. Pay attention to including key points and providing more specific examples.';
  }
};

const generateNextSteps = (feedback: AnswerFeedback): string[] => {
  const nextSteps: string[] = [];

  if (feedback.keywords.missing.length > 0) {
    nextSteps.push(`Practice incorporating these keywords: ${feedback.keywords.missing.join(', ')}`);
  }

  if (feedback.content.improvements.length > 0) {
    nextSteps.push(...feedback.content.improvements);
  }

  if (feedback.delivery.clarity < 80) {
    nextSteps.push('Work on structuring your answers more clearly with introduction, main points, and conclusion');
  }

  return nextSteps;
};

export const generateQuestionsForRole = (
  role: string,
  experience: string,
  industry: string
): InterviewQuestion[] => {
  // Combine questions based on role and experience level
  let questions: InterviewQuestion[] = [];
  
  // Add role-specific technical questions
  questions = questions.concat(
    getTechnicalQuestions(role, experience)
  );

  // Add behavioral questions based on experience level
  questions = questions.concat(
    getBehavioralQuestions(experience)
  );

  // Add leadership questions for senior roles
  if (experience === 'senior' || experience === 'lead') {
    questions = questions.concat(
      getLeadershipQuestions()
    );
  }

  // Shuffle questions and return top 5
  return shuffleArray(questions).slice(0, 5);
};

const getTechnicalQuestions = (role: string, experience: string): InterviewQuestion[] => {
  return filterQuestionsByDifficulty(technicalQuestions, experience);
};

const getBehavioralQuestions = (experience: string): InterviewQuestion[] => {
  return filterQuestionsByDifficulty(behavioralQuestions, experience);
};

const getLeadershipQuestions = (): InterviewQuestion[] => {
  return leadershipQuestions;
};

const filterQuestionsByDifficulty = (
  questions: InterviewQuestion[],
  experience: string
): InterviewQuestion[] => {
  let allowedDifficulties: ('easy' | 'medium' | 'hard')[] = [];
  
  switch (experience) {
    case 'entry':
      allowedDifficulties = ['easy', 'medium'];
      break;
    case 'mid':
      allowedDifficulties = ['medium', 'hard'];
      break;
    case 'senior':
    case 'lead':
      allowedDifficulties = ['medium', 'hard'];
      break;
    default:
      allowedDifficulties = ['easy', 'medium'];
  }

  return questions.filter(q => allowedDifficulties.includes(q.difficulty));
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

import { InterviewQuestion } from '../../types/interview';

export interface RoleQuestionBank {
  id: string;
  label: string;
  /** Tested against the lowercased job title, in array order (first match wins). */
  match: RegExp;
  /** Whether the general technical questions also apply. */
  technical: boolean;
  questions: InterviewQuestion[];
}

const q = (
  id: string,
  question: string,
  category: string,
  difficulty: InterviewQuestion['difficulty'],
  expectedKeywords: string[],
  kind: InterviewQuestion['kind'] = 'role'
): InterviewQuestion => ({ id, question, category, difficulty, expectedKeywords, kind });

export const roleQuestionBanks: RoleQuestionBank[] = [
  {
    id: 'product',
    label: 'Product management',
    match: /\bproduct (manager|owner|lead)|\bpm\b|\bproduct management/,
    technical: false,
    questions: [
      q('prod-1', 'How do you decide what to build next when everything seems important?', 'Prioritization', 'medium', ['impact', 'effort', 'customer', 'data', 'roadmap']),
      q('prod-2', 'Tell me about a product decision you made based on user research or data.', 'Data-Driven Decisions', 'medium', ['research', 'data', 'hypothesis', 'metric', 'result'], 'behavioral'),
      q('prod-3', 'How do you work with engineering and design to ship a feature?', 'Collaboration', 'easy', ['requirements', 'collaborate', 'trade-off', 'feedback', 'timeline']),
      q('prod-4', 'Which metrics would you use to measure the success of a new feature?', 'Metrics', 'hard', ['metric', 'adoption', 'retention', 'goal', 'baseline']),
      q('prod-5', 'Describe a time you had to say no to a stakeholder.', 'Stakeholder Management', 'hard', ['stakeholder', 'priority', 'data', 'alternative', 'communicate'], 'behavioral'),
    ],
  },
  {
    id: 'data',
    label: 'Data & analytics',
    match: /\bdata\b|analyst|analytics|scientist|machine learning|\bml\b|\bai\b|\bbi\b|statistic/,
    technical: true,
    questions: [
      q('data-1', 'Walk me through how you would clean and validate a messy dataset.', 'Data Quality', 'medium', ['missing', 'outlier', 'validate', 'duplicate', 'document']),
      q('data-2', 'Tell me about an analysis that changed a business decision.', 'Business Impact', 'medium', ['question', 'analysis', 'insight', 'stakeholder', 'decision'], 'behavioral'),
      q('data-3', 'How do you explain a complex finding to a non-technical audience?', 'Communication', 'easy', ['simple', 'visual', 'story', 'audience', 'recommendation']),
      q('data-4', 'How would you design an A/B test and decide whether the result is significant?', 'Experimentation', 'hard', ['hypothesis', 'sample', 'control', 'significance', 'metric']),
      q('data-5', 'How do you choose between a simple model and a more complex one?', 'Modeling', 'hard', ['baseline', 'accuracy', 'interpretability', 'overfitting', 'trade-off']),
    ],
  },
  {
    id: 'design',
    label: 'Design',
    match: /design|\bux\b|\bui\b|creative|illustrat|art director/,
    technical: false,
    questions: [
      q('des-1', 'Walk me through your design process on a recent project.', 'Design Process', 'easy', ['research', 'user', 'prototype', 'test', 'iterate']),
      q('des-2', 'Tell me about a time user testing changed your design.', 'User Research', 'medium', ['test', 'feedback', 'insight', 'change', 'result'], 'behavioral'),
      q('des-3', 'How do you handle feedback from stakeholders you disagree with?', 'Feedback', 'medium', ['listen', 'rationale', 'user', 'data', 'compromise']),
      q('des-4', 'How do you make sure your designs are accessible?', 'Accessibility', 'hard', ['contrast', 'keyboard', 'screen reader', 'guidelines', 'test']),
      q('des-5', 'How do you balance user needs with business goals?', 'Trade-offs', 'hard', ['user', 'business', 'goal', 'trade-off', 'metric']),
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    match: /marketing|\bseo\b|content|social media|brand|growth|copywrit|communications/,
    technical: false,
    questions: [
      q('mkt-1', 'Tell me about a campaign you ran and how you measured its success.', 'Campaign Results', 'medium', ['goal', 'audience', 'channel', 'metric', 'result'], 'behavioral'),
      q('mkt-2', 'How do you identify and understand a target audience?', 'Audience', 'easy', ['research', 'persona', 'data', 'segment', 'customer']),
      q('mkt-3', 'How would you allocate a limited marketing budget?', 'Budgeting', 'hard', ['roi', 'test', 'channel', 'data', 'priority']),
      q('mkt-4', 'What would you do if a campaign was underperforming halfway through?', 'Optimization', 'medium', ['analyze', 'metric', 'test', 'adjust', 'learn'], 'situational'),
      q('mkt-5', 'How do you keep a brand voice consistent across channels?', 'Brand', 'medium', ['guidelines', 'voice', 'audience', 'consistent', 'review']),
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    match: /sales|account (executive|manager)|business development|\bbdr\b|\bsdr\b|\bae\b/,
    technical: false,
    questions: [
      q('sales-1', 'Walk me through how you qualify a new lead.', 'Prospecting', 'easy', ['need', 'budget', 'decision', 'timeline', 'question']),
      q('sales-2', 'Tell me about the toughest deal you closed.', 'Closing', 'medium', ['objection', 'relationship', 'value', 'negotiate', 'result'], 'behavioral'),
      q('sales-3', 'How do you handle a prospect who says your price is too high?', 'Objection Handling', 'medium', ['value', 'listen', 'roi', 'question', 'alternative'], 'situational'),
      q('sales-4', 'How do you manage your pipeline and forecast accurately?', 'Pipeline', 'hard', ['crm', 'stage', 'forecast', 'follow', 'priority']),
      q('sales-5', 'Describe a time you missed a quota. What did you do?', 'Resilience', 'hard', ['quota', 'analyze', 'plan', 'learn', 'improve'], 'behavioral'),
    ],
  },
  {
    id: 'customer',
    label: 'Customer support & success',
    match: /customer|support|service|success|help ?desk|call cent|client/,
    technical: false,
    questions: [
      q('cs-1', 'Tell me about a time you turned an unhappy customer into a satisfied one.', 'Service Recovery', 'medium', ['listen', 'empathy', 'solution', 'follow', 'satisfied'], 'behavioral'),
      q('cs-2', 'How do you prioritize when many customers need help at once?', 'Prioritization', 'medium', ['urgent', 'impact', 'priority', 'communicate', 'escalate'], 'situational'),
      q('cs-3', 'How do you explain a technical issue to a non-technical customer?', 'Communication', 'easy', ['simple', 'patient', 'steps', 'confirm', 'empathy']),
      q('cs-4', 'What would you do if you didn’t know the answer to a customer’s question?', 'Problem Solving', 'easy', ['honest', 'research', 'escalate', 'follow', 'update'], 'situational'),
      q('cs-5', 'Which metrics show that customers are successful with a product?', 'Metrics', 'hard', ['retention', 'satisfaction', 'adoption', 'churn', 'feedback']),
    ],
  },
  {
    id: 'finance',
    label: 'Finance & accounting',
    match: /financ|account(ant|ing)|audit|bookkeep|tax|controller|treasury|invest|bank/,
    technical: false,
    questions: [
      q('fin-1', 'How do you ensure accuracy when working with large financial datasets?', 'Accuracy', 'medium', ['reconcile', 'review', 'control', 'check', 'document']),
      q('fin-2', 'Tell me about a time you found an error in financial reports.', 'Attention to Detail', 'medium', ['error', 'investigate', 'correct', 'communicate', 'prevent'], 'behavioral'),
      q('fin-3', 'How would you explain a budget variance to a non-finance manager?', 'Communication', 'easy', ['variance', 'cause', 'impact', 'simple', 'recommendation']),
      q('fin-4', 'How do you approach building a forecast?', 'Forecasting', 'hard', ['assumption', 'historical', 'driver', 'scenario', 'review']),
      q('fin-5', 'How do you stay current with regulations and standards in your area?', 'Compliance', 'easy', ['regulation', 'standard', 'training', 'update', 'compliance']),
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    match: /nurs|doctor|physician|medical|health|clinic|pharmac|therap|dental|caregiver|paramedic/,
    technical: false,
    questions: [
      q('hc-1', 'Tell me about a time you had to stay calm in a high-pressure situation with a patient.', 'Composure', 'medium', ['calm', 'priority', 'patient', 'team', 'outcome'], 'behavioral'),
      q('hc-2', 'How do you communicate difficult news to patients or families?', 'Communication', 'hard', ['empathy', 'clear', 'listen', 'support', 'respect']),
      q('hc-3', 'How do you ensure patient safety and prevent errors?', 'Safety', 'medium', ['protocol', 'double-check', 'document', 'communicate', 'safety']),
      q('hc-4', 'How do you prioritize care when several patients need you at once?', 'Prioritization', 'medium', ['triage', 'urgent', 'assess', 'delegate', 'team'], 'situational'),
      q('hc-5', 'Why did you choose this area of healthcare?', 'Motivation', 'easy', ['care', 'patient', 'passion', 'experience', 'impact'], 'motivation'),
    ],
  },
  {
    id: 'education',
    label: 'Education',
    match: /teach|tutor|instructor|professor|lecturer|educat|school|trainer|coach/,
    technical: false,
    questions: [
      q('edu-1', 'How do you adapt a lesson for learners with different abilities?', 'Differentiation', 'medium', ['assess', 'adapt', 'support', 'challenge', 'feedback']),
      q('edu-2', 'Tell me about a time you helped a struggling learner succeed.', 'Student Support', 'medium', ['identify', 'support', 'plan', 'progress', 'result'], 'behavioral'),
      q('edu-3', 'How do you manage a disruptive classroom or session?', 'Classroom Management', 'medium', ['expectations', 'consistent', 'calm', 'engage', 'respect'], 'situational'),
      q('edu-4', 'How do you measure whether learners actually understood the material?', 'Assessment', 'hard', ['assessment', 'feedback', 'question', 'data', 'adjust']),
      q('edu-5', 'What does an engaging lesson look like to you?', 'Engagement', 'easy', ['interactive', 'goal', 'example', 'participation', 'reflect']),
    ],
  },
  {
    id: 'hr',
    label: 'HR & recruiting',
    match: /\bhr\b|human resources|recruit|talent|people (partner|operations)/,
    technical: false,
    questions: [
      q('hr-1', 'How do you evaluate candidates fairly and reduce bias?', 'Fair Hiring', 'medium', ['structured', 'criteria', 'bias', 'consistent', 'diverse']),
      q('hr-2', 'Tell me about a sensitive employee issue you handled.', 'Employee Relations', 'hard', ['confidential', 'listen', 'policy', 'fair', 'resolution'], 'behavioral'),
      q('hr-3', 'How would you improve employee retention?', 'Retention', 'hard', ['feedback', 'growth', 'recognition', 'data', 'engagement']),
      q('hr-4', 'How do you build a strong candidate pipeline for a hard-to-fill role?', 'Sourcing', 'medium', ['sourcing', 'network', 'employer brand', 'referral', 'outreach']),
      q('hr-5', 'What makes an onboarding process effective?', 'Onboarding', 'easy', ['plan', 'mentor', 'goals', 'feedback', 'welcome']),
    ],
  },
  {
    id: 'operations',
    label: 'Project & operations',
    match: /project|program|operations|scrum|coordinator|logistic|supply chain|administrat|office manager/,
    technical: false,
    questions: [
      q('ops-1', 'How do you keep a project on track when requirements change?', 'Change Management', 'medium', ['scope', 'stakeholder', 'priority', 'timeline', 'communicate']),
      q('ops-2', 'Tell me about a process you improved and the result.', 'Process Improvement', 'medium', ['process', 'bottleneck', 'measure', 'improve', 'result'], 'behavioral'),
      q('ops-3', 'How do you manage risks on a project?', 'Risk Management', 'hard', ['risk', 'identify', 'mitigate', 'monitor', 'plan']),
      q('ops-4', 'How do you communicate status to stakeholders?', 'Communication', 'easy', ['update', 'status', 'risk', 'clear', 'regular']),
      q('ops-5', 'What would you do if a key deliverable was going to be late?', 'Problem Solving', 'medium', ['early', 'communicate', 'options', 'priority', 'plan'], 'situational'),
    ],
  },
  {
    id: 'software',
    label: 'Software engineering',
    match: /software|developer|engineer|programm|front[- ]?end|back[- ]?end|full[- ]?stack|devops|\bsre\b|web|mobile|\bios\b|android|\bqa\b|tester|architect|security/,
    technical: true,
    questions: [
      q('swe-1', 'How do you approach debugging a production issue you can’t reproduce locally?', 'Debugging', 'hard', ['logs', 'reproduce', 'hypothesis', 'monitor', 'root cause']),
      q('swe-2', 'How do you decide when code is good enough to ship?', 'Code Quality', 'medium', ['tests', 'review', 'requirements', 'trade-off', 'risk']),
      q('swe-3', 'Explain a technical concept you know well to someone non-technical.', 'Communication', 'easy', ['simple', 'analogy', 'example', 'audience', 'clear']),
      q('swe-4', 'How would you design a system that needs to handle a sudden 10x increase in traffic?', 'System Design', 'hard', ['scale', 'cache', 'load', 'database', 'monitor']),
      q('swe-5', 'Tell me about a time you disagreed with a technical decision.', 'Collaboration', 'medium', ['disagree', 'data', 'discuss', 'trade-off', 'outcome'], 'behavioral'),
    ],
  },
];

export const findRoleBank = (jobRole: string): RoleQuestionBank | undefined => {
  const role = jobRole.toLowerCase();
  return roleQuestionBanks.find((bank) => bank.match.test(role));
};

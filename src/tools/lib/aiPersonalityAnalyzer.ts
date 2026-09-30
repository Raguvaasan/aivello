/**
 * Big Five style personality scoring for the AI Personality Analyzer.
 *
 * Every question carries its own trait and direction, so scoring never depends on
 * array positions. The profile (type, strengths, careers, advice…) is composed from
 * the user's trait levels rather than picked from a handful of fixed blurbs.
 */

export type Trait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export const TRAITS: { id: Trait; label: string; low: string; high: string }[] = [
  { id: 'openness', label: 'Openness', low: 'Practical', high: 'Imaginative' },
  { id: 'conscientiousness', label: 'Conscientiousness', low: 'Spontaneous', high: 'Organised' },
  { id: 'extraversion', label: 'Extraversion', low: 'Reserved', high: 'Outgoing' },
  { id: 'agreeableness', label: 'Agreeableness', low: 'Direct', high: 'Compassionate' },
  { id: 'neuroticism', label: 'Emotional sensitivity', low: 'Steady', high: 'Sensitive' },
];

export const ANSWER_OPTIONS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] as const;

export interface Question {
  id: number;
  text: string;
  trait: Trait;
  reversed: boolean;
}

export const QUESTIONS: Question[] = [
  { id: 1, text: 'You are the life of the party.', trait: 'extraversion', reversed: false },
  { id: 2, text: 'You have a vivid imagination.', trait: 'openness', reversed: false },
  { id: 3, text: 'You have frequent mood swings.', trait: 'neuroticism', reversed: false },
  { id: 4, text: "You don't talk a lot.", trait: 'extraversion', reversed: true },
  { id: 5, text: 'You are interested in people.', trait: 'agreeableness', reversed: false },
  { id: 6, text: 'You leave your belongings around.', trait: 'conscientiousness', reversed: true },
  { id: 7, text: 'You are relaxed most of the time.', trait: 'neuroticism', reversed: true },
  { id: 8, text: 'You take time out for others.', trait: 'agreeableness', reversed: false },
  { id: 9, text: 'You are always prepared.', trait: 'conscientiousness', reversed: false },
  { id: 10, text: 'You have excellent ideas.', trait: 'openness', reversed: false },
  { id: 11, text: 'You have little to say.', trait: 'extraversion', reversed: true },
  { id: 12, text: 'You have a soft heart.', trait: 'agreeableness', reversed: false },
  { id: 13, text: 'You often forget to put things back in their proper place.', trait: 'conscientiousness', reversed: true },
  { id: 14, text: 'You get upset easily.', trait: 'neuroticism', reversed: false },
  { id: 15, text: 'You do not have a good imagination.', trait: 'openness', reversed: true },
  { id: 16, text: 'You talk to a lot of different people at parties.', trait: 'extraversion', reversed: false },
  { id: 17, text: 'You are not really interested in others.', trait: 'agreeableness', reversed: true },
  { id: 18, text: 'You like order.', trait: 'conscientiousness', reversed: false },
  { id: 19, text: 'You change your mood a lot.', trait: 'neuroticism', reversed: false },
  { id: 20, text: 'You are quick to understand things.', trait: 'openness', reversed: false },
];

/** Answers keyed by question id, value 0 (Strongly Disagree) … 4 (Strongly Agree). */
export type Answers = Record<number, number>;

export type TraitScores = Record<Trait, number>;

export const scoreAnswers = (answers: Answers): TraitScores => {
  const sums: Record<Trait, { total: number; count: number }> = {
    openness: { total: 0, count: 0 },
    conscientiousness: { total: 0, count: 0 },
    extraversion: { total: 0, count: 0 },
    agreeableness: { total: 0, count: 0 },
    neuroticism: { total: 0, count: 0 },
  };
  QUESTIONS.forEach((q) => {
    const raw = answers[q.id];
    if (typeof raw !== 'number' || raw < 0 || raw > 4) return;
    sums[q.trait].total += q.reversed ? 4 - raw : raw;
    sums[q.trait].count += 1;
  });
  const pct = (t: Trait) => (sums[t].count ? Math.round((sums[t].total / (sums[t].count * 4)) * 100) : 50);
  return {
    openness: pct('openness'),
    conscientiousness: pct('conscientiousness'),
    extraversion: pct('extraversion'),
    agreeableness: pct('agreeableness'),
    neuroticism: pct('neuroticism'),
  };
};

export const allAnswered = (answers: Answers) => QUESTIONS.every((q) => typeof answers[q.id] === 'number');

type Pole = `${Trait}:${'high' | 'low'}`;

interface PoleProfile {
  adjective: string;
  noun: string;
  description: string;
  strengths: string[];
  challenges: string[];
  careers: string[];
  development: string[];
  advice: string[];
  partner: string;
}

const POLES: Record<Pole, PoleProfile> = {
  'openness:high': {
    adjective: 'Creative', noun: 'Visionary',
    description: 'You are curious and imaginative, drawn to new ideas, art and possibilities.',
    strengths: ['Creative problem-solving', 'Intellectual curiosity', 'Open to new experiences'],
    challenges: ['Can lose interest in routine work', 'May chase too many ideas at once'],
    careers: ['Designer', 'Researcher', 'Writer', 'Product Manager', 'Architect'],
    development: ['Finishing what you start', 'Turning ideas into concrete plans'],
    advice: ['Pick one idea a month and see it through', 'Pair creativity with deadlines'],
    partner: 'People who share your curiosity, or grounded partners who help turn ideas into reality',
  },
  'openness:low': {
    adjective: 'Practical', noun: 'Realist',
    description: 'You are practical and grounded, preferring proven methods and concrete results.',
    strengths: ['Practical judgement', 'Reliability with proven methods', 'Focus on what works'],
    challenges: ['May resist unfamiliar approaches', 'Can dismiss ideas that seem abstract'],
    careers: ['Operations Manager', 'Accountant', 'Technician', 'Logistics Coordinator', 'Engineer'],
    development: ['Experimenting with new approaches', 'Staying open to unfamiliar ideas'],
    advice: ['Try one new thing each week, however small', 'Ask "what if?" before saying no'],
    partner: 'Steady partners who value stability, or imaginative ones who broaden your world',
  },
  'conscientiousness:high': {
    adjective: 'Organised', noun: 'Planner',
    description: 'You are organised, dependable and goal-driven; people know they can count on you.',
    strengths: ['Strong work ethic', 'Planning and organisation', 'Dependability'],
    challenges: ['Perfectionism', 'Difficulty relaxing or delegating'],
    careers: ['Project Manager', 'Financial Analyst', 'Lawyer', 'Surgeon', 'Quality Assurance Lead'],
    development: ['Flexibility when plans change', 'Delegating to others'],
    advice: ['Accept "good enough" for low-stakes tasks', 'Schedule real downtime'],
    partner: 'Partners who appreciate reliability, and relaxed ones who help you unwind',
  },
  'conscientiousness:low': {
    adjective: 'Spontaneous', noun: 'Improviser',
    description: 'You are flexible and spontaneous, comfortable adapting on the fly.',
    strengths: ['Adaptability', 'Thinking on your feet', 'Comfort with change'],
    challenges: ['Procrastination', 'Keeping track of details and deadlines'],
    careers: ['Entrepreneur', 'Event Producer', 'Journalist', 'Sales Representative', 'Emergency Responder'],
    development: ['Time management', 'Follow-through on commitments'],
    advice: ['Use simple systems - one list, one calendar', 'Break big goals into small, visible steps'],
    partner: 'Organised partners who balance your spontaneity, as long as they value your flexibility',
  },
  'extraversion:high': {
    adjective: 'Outgoing', noun: 'Connector',
    description: 'You are energised by people, conversation and activity, and you bring others together.',
    strengths: ['Communication', 'Building networks', 'Energising a team'],
    challenges: ['May speak before listening', 'Can find solitary work draining'],
    careers: ['Sales Manager', 'Public Relations', 'Teacher', 'Event Coordinator', 'Team Leader'],
    development: ['Active listening', 'Comfort with quiet, focused work'],
    advice: ['Let others finish before you respond', 'Protect some solo time for deep work'],
    partner: 'Fellow socialisers, or calmer partners who enjoy your energy and ground you',
  },
  'extraversion:low': {
    adjective: 'Reflective', noun: 'Thinker',
    description: 'You are thoughtful and reserved, recharging through quiet time and deep conversations.',
    strengths: ['Deep focus', 'Thoughtful listening', 'Independent work'],
    challenges: ['May be overlooked in group settings', 'Networking can feel draining'],
    careers: ['Software Developer', 'Writer', 'Data Analyst', 'Research Scientist', 'Editor'],
    development: ['Speaking up in meetings', 'Building a professional network'],
    advice: ['Prepare one point to share before each meeting', 'Invest in a few close relationships'],
    partner: 'Partners who respect your need for space, including outgoing ones who draw you out gently',
  },
  'agreeableness:high': {
    adjective: 'Compassionate', noun: 'Supporter',
    description: 'You are warm, cooperative and empathetic, and you care about harmony.',
    strengths: ['Empathy', 'Teamwork', 'Resolving conflicts'],
    challenges: ['Difficulty saying no', 'Putting others\' needs before your own'],
    careers: ['Counselor', 'Nurse', 'Human Resources', 'Social Worker', 'Customer Success Manager'],
    development: ['Assertiveness', 'Setting boundaries'],
    advice: ['Practise saying no kindly but clearly', 'Make your own needs part of the plan'],
    partner: 'Kind, appreciative partners who give back as much care as you give',
  },
  'agreeableness:low': {
    adjective: 'Direct', noun: 'Challenger',
    description: 'You are candid and independent-minded, willing to question ideas and push back.',
    strengths: ['Honest feedback', 'Independent thinking', 'Tough negotiation'],
    challenges: ['Can come across as blunt', 'May underestimate the value of consensus'],
    careers: ['Lawyer', 'Negotiator', 'Investigative Journalist', 'Critic', 'Executive'],
    development: ['Diplomacy', 'Showing appreciation'],
    advice: ['Lead with what you agree with before critiquing', 'Ask questions before giving opinions'],
    partner: 'Confident partners who enjoy honest debate and do not take directness personally',
  },
  'neuroticism:high': {
    adjective: 'Sensitive', noun: 'Feeler',
    description: 'You feel things deeply and notice emotional undercurrents others miss.',
    strengths: ['Emotional awareness', 'Sensing risks early', 'Depth of feeling'],
    challenges: ['Stress and worry', 'Mood swings under pressure'],
    careers: ['Artist', 'Therapist', 'Writer', 'UX Researcher', 'Risk Analyst'],
    development: ['Stress management', 'Self-compassion'],
    advice: ['Build a daily calming routine (walks, breathing, journaling)', 'Talk worries through instead of carrying them alone'],
    partner: 'Calm, reassuring partners who communicate openly',
  },
  'neuroticism:low': {
    adjective: 'Steady', noun: 'Anchor',
    description: 'You are calm and emotionally steady, even when things get stressful.',
    strengths: ['Calm under pressure', 'Resilience', 'Emotional stability'],
    challenges: ['May underestimate others\' stress', 'Can seem detached'],
    careers: ['Pilot', 'Emergency Physician', 'Crisis Manager', 'Air Traffic Controller', 'Operations Lead'],
    development: ['Expressing emotions', 'Recognising stress in others'],
    advice: ['Check in on how the people around you are feeling', 'Share your own feelings, not just solutions'],
    partner: 'Almost anyone - your steadiness is reassuring, especially to more sensitive partners',
  },
};

const TRAIT_LABEL: Record<Trait, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Emotional sensitivity',
};

export type Level = 'Low' | 'Moderate' | 'High';
export const levelOf = (score: number): Level => (score >= 65 ? 'High' : score <= 35 ? 'Low' : 'Moderate');

export interface PersonalityProfile {
  type: string;
  description: string;
  scores: TraitScores;
  levels: Record<Trait, Level>;
  strengths: string[];
  growthAreas: string[];
  careerSuggestions: string[];
  relationshipCompatibility: string[];
  developmentAreas: string[];
  lifeAdvice: string[];
}

const uniq = (items: string[], limit: number) => Array.from(new Set(items)).slice(0, limit);

export const buildProfile = (answers: Answers): PersonalityProfile => {
  const scores = scoreAnswers(answers);
  const traits = TRAITS.map((t) => t.id);
  const levels = Object.fromEntries(traits.map((t) => [t, levelOf(scores[t])])) as Record<Trait, Level>;

  // Traits ranked by how far they are from the midpoint.
  const ranked = [...traits].sort((a, b) => Math.abs(scores[b] - 50) - Math.abs(scores[a] - 50));
  const poleOf = (t: Trait): Pole => `${t}:${scores[t] >= 50 ? 'high' : 'low'}`;
  const distinctive = ranked.filter((t) => Math.abs(scores[t] - 50) >= 15);

  if (distinctive.length === 0) {
    return {
      type: 'The Balanced Achiever',
      description:
        'Your answers sit close to the middle on every trait. You adapt to situations rather than leaning strongly one way - sociable when needed, focused when needed, and generally even-tempered.',
      scores,
      levels,
      strengths: ['Adaptability', 'Balanced perspective', 'Works well with many personality types', 'Versatility'],
      growthAreas: ['Can find it hard to name a signature strength', 'May hesitate when a strong stance is needed'],
      careerSuggestions: ['Business Analyst', 'Operations Manager', 'Consultant', 'General Manager', 'Coordinator'],
      relationshipCompatibility: ['Compatible with a wide range of personalities', 'Partners with strong traits benefit from your flexibility'],
      developmentAreas: ['Identifying your unique value', 'Decisiveness'],
      lifeAdvice: ['Notice which activities give you the most energy and do more of them', 'Practise making quick decisions on small things'],
    };
  }

  const primary = POLES[poleOf(distinctive[0])];
  const secondaryTrait = distinctive[1] ?? ranked[1];
  const secondary = POLES[poleOf(secondaryTrait)];
  const type = `The ${secondary.adjective} ${primary.noun}`;
  const activePoles = distinctive.map((t) => POLES[poleOf(t)]);

  const moderate = traits.filter((t) => levels[t] === 'Moderate').map((t) => TRAIT_LABEL[t].toLowerCase());
  const description = [
    primary.description,
    secondary !== primary ? secondary.description.replace(/^You are /, 'You are also ') : '',
    moderate.length ? `You sit in the middle on ${moderate.join(' and ')}, so you can flex either way there.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    type,
    description,
    scores,
    levels,
    strengths: uniq(activePoles.flatMap((p) => p.strengths), 6),
    growthAreas: uniq(activePoles.flatMap((p) => p.challenges), 5),
    careerSuggestions: uniq([...primary.careers.slice(0, 3), ...secondary.careers.slice(0, 3), ...primary.careers.slice(3)], 6),
    relationshipCompatibility: uniq(activePoles.slice(0, 3).map((p) => p.partner), 3),
    developmentAreas: uniq(activePoles.flatMap((p) => p.development), 5),
    lifeAdvice: uniq(activePoles.flatMap((p) => p.advice), 5),
  };
};

export interface PersonalInfo {
  name: string;
  age: string;
  occupation: string;
}

export const validateAge = (age: string): string => {
  if (!age.trim()) return '';
  const n = Number(age);
  if (!Number.isInteger(n) || n < 13 || n > 120) return 'Enter an age between 13 and 120, or leave it blank.';
  return '';
};

export const profileReportText = (p: PersonalityProfile, info: PersonalInfo): string =>
  [
    'PERSONALITY ANALYSIS REPORT',
    info.name.trim() ? `Name: ${info.name.trim()}` : '',
    info.age.trim() ? `Age: ${info.age.trim()}` : '',
    info.occupation.trim() ? `Occupation: ${info.occupation.trim()}` : '',
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    `PERSONALITY TYPE: ${p.type}`,
    '',
    p.description,
    '',
    'TRAIT SCORES',
    ...TRAITS.map((t) => `• ${t.label}: ${p.scores[t.id]}% (${p.levels[t.id]})`),
    '',
    'STRENGTHS',
    ...p.strengths.map((s) => `• ${s}`),
    '',
    'GROWTH AREAS',
    ...p.growthAreas.map((s) => `• ${s}`),
    '',
    'CAREER SUGGESTIONS',
    ...p.careerSuggestions.map((s) => `• ${s}`),
    '',
    'RELATIONSHIP COMPATIBILITY',
    ...p.relationshipCompatibility.map((s) => `• ${s}`),
    '',
    'DEVELOPMENT AREAS',
    ...p.developmentAreas.map((s) => `• ${s}`),
    '',
    'LIFE ADVICE',
    ...p.lifeAdvice.map((s) => `• ${s}`),
    '',
    'Based on a short 20-item Big Five style questionnaire. For self-reflection only - not a clinical assessment.',
    'Generated with the Aivello Personality Analyzer',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');

export const downloadProfileReport = (p: PersonalityProfile, info: PersonalInfo): void => {
  const slug = info.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const blob = new Blob([profileReportText(p, info)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personality-analysis${slug ? `-${slug}` : ''}.txt`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

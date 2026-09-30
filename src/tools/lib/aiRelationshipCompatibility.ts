/**
 * Deterministic relationship-compatibility scoring.
 *
 * Earlier versions returned random zodiac scores and treated two empty fields as a
 * perfect match (so an empty form scored ~90%). Now each factor is only scored when
 * both people filled it in, the overall score is a weighted average of the factors
 * that exist, and every strength, tip and date idea is derived from the answers.
 * Entertainment and reflection only.
 */

export interface PersonProfile {
  name: string;
  age: string;
  zodiacSign: string;
  interests: string;
  values: string;
  personalityType: string;
  loveLanguage: string;
  lifestyle: string;
  goals: string;
  communicationStyle: string;
}

export const EMPTY_PERSON: PersonProfile = {
  name: '', age: '', zodiacSign: '', interests: '', values: '',
  personalityType: '', loveLanguage: '', lifestyle: '', goals: '', communicationStyle: '',
};

export const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export const PERSONALITY_TYPES = ['Extrovert', 'Introvert', 'Ambivert', 'Analytical', 'Creative', 'Practical', 'Emotional', 'Logical', 'Adventurous', 'Stable'] as const;
export const LOVE_LANGUAGES = ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Receiving Gifts'] as const;
export const COMMUNICATION_STYLES = ['Direct', 'Indirect', 'Emotional', 'Logical', 'Assertive', 'Passive', 'Diplomatic', 'Spontaneous'] as const;
export const LIFESTYLES = ['Active & Outdoorsy', 'Homebody', 'Social Butterfly', 'Career Focused', 'Family Oriented', 'Adventurous', 'Minimalist', 'Luxury Loving'] as const;

export type CategoryId = 'emotional' | 'communication' | 'lifestyle' | 'valuesGoals' | 'interests' | 'zodiac';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  emotional: 'Emotional',
  communication: 'Communication',
  lifestyle: 'Lifestyle',
  valuesGoals: 'Values & Goals',
  interests: 'Shared Interests',
  zodiac: 'Zodiac (just for fun)',
};

interface Factor {
  id: 'personality' | 'loveLanguage' | 'lifestyle' | 'communication' | 'interests' | 'values' | 'goals' | 'age' | 'zodiac';
  score: number;
  weight: number;
  note: string;
}

export interface CompatibilityResult {
  overallScore: number;
  verdict: string;
  categories: Record<CategoryId, number | null>;
  factorsUsed: number;
  sharedInterests: string[];
  sharedValues: string[];
  strengths: string[];
  challenges: string[];
  relationshipTips: string[];
  zodiacCompatibility: string | null;
  personalityMatch: string | null;
  communicationAdvice: string | null;
  longTermPotential: string;
  improvementAreas: string[];
  dateIdeas: string[];
  conflictResolution: string[];
}

export type PersonErrors = Partial<Record<'name' | 'age', string>>;

export const validatePerson = (p: PersonProfile): PersonErrors => {
  const errors: PersonErrors = {};
  const name = p.name.trim();
  if (!name) errors.name = 'Enter a name.';
  else if (name.length > 40) errors.name = 'Keep the name under 40 characters.';
  if (p.age.trim()) {
    const n = Number(p.age);
    if (!Number.isInteger(n) || n < 18 || n > 120) errors.age = 'This tool is for adults - enter an age from 18 to 120, or leave it blank.';
  }
  return errors;
};

// ---------------------------------------------------------------------------
// Factor scoring
// ---------------------------------------------------------------------------

const ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

const zodiacFactor = (a: string, b: string): Factor | null => {
  if (!ELEMENT[a] || !ELEMENT[b]) return null;
  const ea = ELEMENT[a];
  const eb = ELEMENT[b];
  const diff = Math.abs(ZODIAC_SIGNS.indexOf(a as (typeof ZODIAC_SIGNS)[number]) - ZODIAC_SIGNS.indexOf(b as (typeof ZODIAC_SIGNS)[number]));
  let score: number;
  let note: string;
  if (a === b) {
    score = 80;
    note = `Two ${a}s understand each other instinctively, though they can share the same blind spots`;
  } else if (ea === eb) {
    score = 90;
    note = `${a} and ${b} are both ${ea} signs, a traditionally harmonious pairing`;
  } else if (diff === 6) {
    score = 75;
    note = `${a} and ${b} are opposite signs - a classic "opposites attract" match`;
  } else if ((ea === 'Fire' && eb === 'Air') || (ea === 'Air' && eb === 'Fire') || (ea === 'Earth' && eb === 'Water') || (ea === 'Water' && eb === 'Earth')) {
    score = 85;
    note = `${ea} and ${eb} are complementary elements that tend to feed each other`;
  } else {
    score = 55;
    note = `${ea} (${a}) and ${eb} (${b}) are traditionally a more challenging element mix`;
  }
  return { id: 'zodiac', score, weight: 0.5, note };
};

const pairIn = (a: string, b: string, pairs: [string, string][]) => pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

const personalityFactor = (a: string, b: string): Factor | null => {
  if (!a || !b) return null;
  if (a === b) return { id: 'personality', score: 80, weight: 1, note: `Both of you are ${a.toLowerCase()}, so you share a natural outlook` };
  if (a === 'Ambivert' || b === 'Ambivert') return { id: 'personality', score: 78, weight: 1, note: 'An ambivert adapts easily to a partner\'s energy' };
  const complementary: [string, string][] = [['Extrovert', 'Introvert'], ['Analytical', 'Creative'], ['Practical', 'Creative'], ['Logical', 'Emotional'], ['Adventurous', 'Stable']];
  if (pairIn(a, b, complementary)) return { id: 'personality', score: 74, weight: 1, note: `${a} and ${b} personalities balance each other - if you value the difference` };
  return { id: 'personality', score: 70, weight: 1, note: `${a} and ${b} personalities approach life differently` };
};

const loveLanguageFactor = (a: string, b: string): Factor | null => {
  if (!a || !b) return null;
  if (a === b) return { id: 'loveLanguage', score: 95, weight: 1.2, note: `You share the same love language: ${a}` };
  if (pairIn(a, b, [['Physical Touch', 'Quality Time'], ['Words of Affirmation', 'Quality Time']])) {
    return { id: 'loveLanguage', score: 80, weight: 1.2, note: `${a} and ${b} overlap - both are about presence and closeness` };
  }
  return { id: 'loveLanguage', score: 65, weight: 1.2, note: `Different love languages (${a} vs ${b}) - you will need to learn each other's` };
};

const lifestyleFactor = (a: string, b: string): Factor | null => {
  if (!a || !b) return null;
  if (a === b) return { id: 'lifestyle', score: 90, weight: 1, note: `You share a ${a.toLowerCase()} lifestyle` };
  if (pairIn(a, b, [['Active & Outdoorsy', 'Adventurous'], ['Homebody', 'Family Oriented'], ['Social Butterfly', 'Luxury Loving'], ['Homebody', 'Minimalist'], ['Career Focused', 'Luxury Loving']])) {
    return { id: 'lifestyle', score: 80, weight: 1, note: `${a} and ${b} lifestyles fit together well` };
  }
  if (pairIn(a, b, [['Homebody', 'Social Butterfly'], ['Minimalist', 'Luxury Loving'], ['Homebody', 'Adventurous'], ['Career Focused', 'Family Oriented']])) {
    return { id: 'lifestyle', score: 52, weight: 1, note: `${a} vs ${b} lifestyles pull in different directions` };
  }
  return { id: 'lifestyle', score: 68, weight: 1, note: `${a} and ${b} lifestyles can coexist with some compromise` };
};

const communicationFactor = (a: string, b: string): Factor | null => {
  if (!a || !b) return null;
  if (a === b && a === 'Passive') return { id: 'communication', score: 60, weight: 1.3, note: 'Two passive communicators may both avoid important conversations' };
  if (a === b) return { id: 'communication', score: 85, weight: 1.3, note: `You both communicate in a ${a.toLowerCase()} way` };
  if (pairIn(a, b, [['Direct', 'Assertive'], ['Diplomatic', 'Emotional'], ['Logical', 'Direct']])) {
    return { id: 'communication', score: 80, weight: 1.3, note: `${a} and ${b} communication styles mesh naturally` };
  }
  if (pairIn(a, b, [['Direct', 'Passive'], ['Assertive', 'Passive'], ['Emotional', 'Logical'], ['Direct', 'Indirect']])) {
    return { id: 'communication', score: 55, weight: 1.3, note: `${a} and ${b} communicators can misread each other` };
  }
  if (a === 'Diplomatic' || b === 'Diplomatic') return { id: 'communication', score: 75, weight: 1.3, note: 'A diplomatic communicator helps smooth differences' };
  return { id: 'communication', score: 70, weight: 1.3, note: `${a} and ${b} styles differ, which takes some adjustment` };
};

const normalise = (w: string) => w.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().replace(/(ing|s)$/, '');

export const splitList = (text: string): string[] =>
  Array.from(
    new Set(
      text
        .split(/,|;|\/|\band\b|&|\n/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length <= 40)
    )
  ).slice(0, 15);

const overlap = (a: string[], b: string[]) => {
  const nb = b.map(normalise);
  return a.filter((item) => {
    const n = normalise(item);
    return n && nb.some((x) => x && (x === n || (n.length > 3 && x.includes(n)) || (x.length > 3 && n.includes(x))));
  });
};

const listFactor = (id: 'interests' | 'values', a: string, b: string, weight: number, base: number): { factor: Factor | null; shared: string[] } => {
  const la = splitList(a);
  const lb = splitList(b);
  if (!la.length || !lb.length) return { factor: null, shared: [] };
  const shared = overlap(la, lb);
  const ratio = shared.length / Math.min(la.length, lb.length);
  const score = Math.round(base + (95 - base) * Math.min(1, ratio));
  const label = id === 'interests' ? 'interests' : 'core values';
  const note = shared.length
    ? `You share ${shared.length} ${label}: ${shared.slice(0, 4).join(', ')}`
    : `No overlapping ${label} yet - you bring different things to the table`;
  return { factor: { id, score, weight, note }, shared };
};

const GOAL_CATEGORIES: [RegExp, string][] = [
  [/\b(famil\w*|kids?|children|marr\w*|wedding|settle)\b/i, 'family'],
  [/\b(career|business|startup|promotion|company|job)\b/i, 'career'],
  [/\b(travel\w*|world|abroad|explore)\b/i, 'travel'],
  [/\b(money|wealth|rich|financ\w*|retire\w*|invest\w*)\b/i, 'financial security'],
  [/\b(health|fit\w*|marathon|wellness)\b/i, 'health'],
  [/\b(stud\w*|degree|education|learn\w*|university)\b/i, 'education'],
  [/\b(art|music|writ\w*|creat\w*|book)\b/i, 'creativity'],
  [/\b(house|home|farm|land)\b/i, 'a home'],
  [/\b(faith|church|spiritual\w*|god)\b/i, 'faith'],
  [/\b(help\w*|volunteer\w*|charity|community)\b/i, 'giving back'],
];

const goalsFactor = (a: string, b: string): { factor: Factor | null; shared: string[]; only: [string[], string[]] } => {
  if (!a.trim() || !b.trim()) return { factor: null, shared: [], only: [[], []] };
  const ca = GOAL_CATEGORIES.filter(([re]) => re.test(a)).map(([, c]) => c);
  const cb = GOAL_CATEGORIES.filter(([re]) => re.test(b)).map(([, c]) => c);
  const shared = ca.filter((c) => cb.includes(c));
  const union = Array.from(new Set([...ca, ...cb]));
  let score: number;
  if (!union.length) score = 65;
  else score = Math.round(55 + 40 * (shared.length / union.length));
  const note = shared.length ? `Your goals align on ${shared.join(', ')}` : 'Your stated goals point in different directions';
  return { factor: { id: 'goals', score, weight: 1.2, note }, shared, only: [ca.filter((c) => !cb.includes(c)), cb.filter((c) => !ca.includes(c))] };
};

const ageFactor = (a: string, b: string): Factor | null => {
  const na = Number(a);
  const nb = Number(b);
  if (!a.trim() || !b.trim() || !Number.isFinite(na) || !Number.isFinite(nb)) return null;
  const gap = Math.abs(na - nb);
  const score = gap <= 3 ? 90 : gap <= 7 ? 80 : gap <= 12 ? 68 : 55;
  const note = gap === 0 ? 'You are the same age' : `An age gap of ${gap} year${gap === 1 ? '' : 's'}${gap > 12 ? ' may mean different life stages' : ''}`;
  return { id: 'age', score, weight: 0.4, note };
};

// ---------------------------------------------------------------------------
// Advice banks
// ---------------------------------------------------------------------------

const LOVE_TIPS: Record<string, string> = {
  'Words of Affirmation': 'say what you appreciate out loud - specific compliments and encouragement',
  'Quality Time': 'give undivided attention - phone-free time together',
  'Physical Touch': 'show affection through hugs, holding hands and closeness',
  'Acts of Service': 'help out with tasks and take things off their plate',
  'Receiving Gifts': 'give small, thoughtful gifts that show you were thinking of them',
};

const COMMUNICATION_TIPS: Record<string, string> = {
  Direct: 'appreciates clear, straightforward conversation',
  Indirect: 'may hint rather than state needs - ask gentle follow-up questions',
  Emotional: 'needs feelings acknowledged before problem-solving',
  Logical: 'prefers facts and reasons - explain the "why"',
  Assertive: 'states needs confidently - respond with the same clarity',
  Passive: 'may avoid conflict - create safe moments to share concerns',
  Diplomatic: 'values tact - pair honesty with kindness',
  Spontaneous: 'talks things through in the moment - allow room for off-the-cuff conversations',
};

const INTEREST_DATES: [RegExp, string][] = [
  [/hik|trek|walk|outdoor|nature|camp/i, 'A sunrise hike followed by breakfast at a trailhead café'],
  [/cook|bak|food|culinar/i, 'Cook a cuisine neither of you has tried before'],
  [/music|concert|guitar|sing/i, 'A live music night at a small local venue'],
  [/art|paint|draw|museum|gallery/i, 'An afternoon at a gallery, then sketch your favourite piece'],
  [/read|book|literat/i, 'A bookstore date - pick a book for each other'],
  [/movie|film|cinema|netflix|series/i, 'A themed movie marathon with homemade snacks'],
  [/travel|trip|explor/i, 'Plan a weekend trip to a town neither of you has visited'],
  [/game|gaming|board|puzzle/i, 'A board-game café night'],
  [/sport|football|soccer|basketball|tennis|gym|fitness|yoga|run/i, 'A partner workout or a friendly match'],
  [/coffee|tea|cafe/i, 'A café crawl to find your favourite spot'],
  [/danc/i, 'Take a beginner dance class together'],
  [/photo/i, 'A photo walk around your city at golden hour'],
  [/garden|plant/i, 'Visit a botanical garden and pick a plant to grow together'],
  [/volunteer|charity/i, 'Volunteer together for a cause you both care about'],
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const MIN_FACTORS = 2;

export const countComparableFactors = (p1: PersonProfile, p2: PersonProfile): number =>
  (['zodiacSign', 'personalityType', 'loveLanguage', 'lifestyle', 'communicationStyle', 'interests', 'values', 'goals', 'age'] as const).filter(
    (k) => p1[k].trim() && p2[k].trim()
  ).length;

export const calculateCompatibility = (p1: PersonProfile, p2: PersonProfile): CompatibilityResult => {
  const n1 = p1.name.trim();
  const n2 = p2.name.trim();

  const personality = personalityFactor(p1.personalityType, p2.personalityType);
  const love = loveLanguageFactor(p1.loveLanguage, p2.loveLanguage);
  const lifestyle = lifestyleFactor(p1.lifestyle, p2.lifestyle);
  const communication = communicationFactor(p1.communicationStyle, p2.communicationStyle);
  const interests = listFactor('interests', p1.interests, p2.interests, 0.9, 45);
  const values = listFactor('values', p1.values, p2.values, 1.4, 50);
  const goals = goalsFactor(p1.goals, p2.goals);
  const age = ageFactor(p1.age, p2.age);
  const zodiac = zodiacFactor(p1.zodiacSign, p2.zodiacSign);

  const factors = [personality, love, lifestyle, communication, interests.factor, values.factor, goals.factor, age, zodiac].filter(
    (f): f is Factor => f !== null
  );
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const overallScore = totalWeight ? Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight) : 0;

  const avg = (...fs: (Factor | null)[]) => {
    const present = fs.filter((f): f is Factor => f !== null);
    return present.length ? Math.round(present.reduce((s, f) => s + f.score, 0) / present.length) : null;
  };

  const categories: Record<CategoryId, number | null> = {
    emotional: avg(love, personality),
    communication: communication?.score ?? null,
    lifestyle: avg(lifestyle, age),
    valuesGoals: avg(values.factor, goals.factor),
    interests: interests.factor?.score ?? null,
    zodiac: zodiac?.score ?? null,
  };

  const verdict =
    overallScore >= 85 ? '💕 Excellent Match' : overallScore >= 72 ? '💖 Strong Compatibility' : overallScore >= 60 ? '💛 Promising, With Work' : '💙 Different Wavelengths';

  const meaningful = factors.filter((f) => f.id !== 'zodiac' && f.id !== 'age');
  const strengths = meaningful.filter((f) => f.score >= 78).map((f) => f.note);
  if (zodiac && zodiac.score >= 85) strengths.push(`${zodiac.note} (just for fun)`);
  if (!strengths.length) strengths.push('You come from different starting points - curiosity about each other can become your biggest strength');

  const challenges = factors.filter((f) => f.score <= 62).map((f) => f.note);
  if (lifestyle && p1.lifestyle !== p2.lifestyle && lifestyle.score < 80) challenges.push(`Balancing ${n1}'s ${p1.lifestyle.toLowerCase()} and ${n2}'s ${p2.lifestyle.toLowerCase()} preferences`);
  if (goals.only[0].length && goals.only[1].length) {
    challenges.push(`${n1} mentions ${goals.only[0].join(', ')}; ${n2} mentions ${goals.only[1].join(', ')} - talk about how these fit together`);
  }
  if (!challenges.length) challenges.push('No major friction points in what you shared - keep checking in as life changes');

  const relationshipTips: string[] = [];
  if (p1.loveLanguage && p2.loveLanguage) {
    relationshipTips.push(`${n2}, to make ${n1} feel loved: ${LOVE_TIPS[p1.loveLanguage]}.`);
    if (p1.loveLanguage !== p2.loveLanguage) relationshipTips.push(`${n1}, to make ${n2} feel loved: ${LOVE_TIPS[p2.loveLanguage]}.`);
  } else if (p1.loveLanguage || p2.loveLanguage) {
    const [who, other, lang] = p1.loveLanguage ? [n1, n2, p1.loveLanguage] : [n2, n1, p2.loveLanguage];
    relationshipTips.push(`${other}, ${who}'s love language is ${lang}: ${LOVE_TIPS[lang]}.`);
  }
  if (p1.communicationStyle) relationshipTips.push(`${n1} ${COMMUNICATION_TIPS[p1.communicationStyle]}.`);
  if (p2.communicationStyle && p2.communicationStyle !== p1.communicationStyle) relationshipTips.push(`${n2} ${COMMUNICATION_TIPS[p2.communicationStyle]}.`);
  if (interests.shared.length) relationshipTips.push(`Build rituals around what you both enjoy - ${interests.shared.slice(0, 2).join(' and ')}.`);
  if (values.shared.length) relationshipTips.push(`Your shared value of ${values.shared[0].toLowerCase()} is an anchor - refer back to it when you disagree.`);
  relationshipTips.push('Schedule a regular check-in to talk about how things are going, not just logistics.');

  const combinedInterests = `${p1.interests}, ${p2.interests}`;
  const sharedText = interests.shared.join(', ');
  const dateIdeas = Array.from(
    new Set([
      ...INTEREST_DATES.filter(([re]) => re.test(sharedText)).map(([, idea]) => idea),
      ...INTEREST_DATES.filter(([re]) => re.test(combinedInterests)).map(([, idea]) => idea),
      ...(p1.lifestyle === 'Homebody' || p2.lifestyle === 'Homebody' ? ['A cosy night in: cook together and build a blanket fort'] : []),
      ...([p1.lifestyle, p2.lifestyle].some((l) => l === 'Active & Outdoorsy' || l === 'Adventurous') ? ['Try something new together - kayaking, climbing or a new trail'] : []),
      ...(p1.loveLanguage === 'Quality Time' || p2.loveLanguage === 'Quality Time' ? ['A phone-free dinner where you take turns asking deep questions'] : []),
      'Explore a neighbourhood neither of you knows well',
      'Stargazing with a thermos and a playlist you make for each other',
    ])
  ).slice(0, 6);

  const conflictResolution: string[] = [];
  const styles = [p1.communicationStyle, p2.communicationStyle];
  if (styles.includes('Passive') || styles.includes('Indirect')) conflictResolution.push('Agree on a low-pressure way to raise issues, such as a weekly "anything on your mind?" moment');
  if (styles.includes('Emotional') && styles.includes('Logical')) conflictResolution.push('Acknowledge feelings first, then move to solutions - both steps matter');
  if (styles.includes('Direct') || styles.includes('Assertive')) conflictResolution.push('Keep directness kind: describe the behaviour, not the person');
  conflictResolution.push('Use "I feel… when… because…" statements instead of "you always…"');
  conflictResolution.push('Take a 20-minute break when things get heated, then come back to it');
  conflictResolution.push('Listen to understand, and repeat back what you heard before replying');

  const improvementAreas: string[] = factors
    .filter((f) => f.score < 75)
    .sort((a, b) => a.score - b.score)
    .map((f) => {
      switch (f.id) {
        case 'loveLanguage': return 'Learn and practise each other\'s love language';
        case 'communication': return 'Adapt to each other\'s communication style';
        case 'lifestyle': return 'Find a weekly rhythm that respects both lifestyles';
        case 'values': return 'Talk openly about what matters most to each of you';
        case 'goals': return 'Map out your long-term goals together and look for overlap';
        case 'interests': return 'Try each other\'s hobbies - or find a brand-new one together';
        case 'personality': return 'Appreciate how your different temperaments complement each other';
        case 'age': return 'Discuss how your life stages and timelines line up';
        default: return '';
      }
    })
    .filter(Boolean);
  if (!improvementAreas.length) improvementAreas.push('Keep investing in quality time as your lives change');

  const valuesGoals = categories.valuesGoals;
  const longTermPotential =
    valuesGoals === null
      ? `${overallScore >= 72 ? 'Promising' : 'Unclear'} long-term potential - add your core values and life goals for a better read on the long term.`
      : valuesGoals >= 80
        ? 'Strong long-term potential: your values and goals line up, which matters more over time than day-to-day differences.'
        : valuesGoals >= 65
          ? 'Good long-term potential if you keep talking about priorities - some values and goals overlap, others need discussion.'
          : 'Long-term success will depend on honest conversations about values and goals, which currently look quite different.';

  return {
    overallScore,
    verdict,
    categories,
    factorsUsed: factors.length,
    sharedInterests: interests.shared,
    sharedValues: values.shared,
    strengths: Array.from(new Set(strengths)).slice(0, 6),
    challenges: Array.from(new Set(challenges)).slice(0, 5),
    relationshipTips: Array.from(new Set(relationshipTips)).slice(0, 6),
    zodiacCompatibility: zodiac ? `${zodiac.note}. Astrology is included for fun and is weighted lightly in the overall score.` : null,
    personalityMatch: personality ? `${personality.note}.` : null,
    communicationAdvice: communication ? `${communication.note}. ${n1} ${COMMUNICATION_TIPS[p1.communicationStyle]}; ${n2} ${COMMUNICATION_TIPS[p2.communicationStyle]}.` : null,
    longTermPotential,
    improvementAreas: Array.from(new Set(improvementAreas)).slice(0, 5),
    dateIdeas,
    conflictResolution: Array.from(new Set(conflictResolution)).slice(0, 5),
  };
};

export const compatibilityReportText = (p1: PersonProfile, p2: PersonProfile, r: CompatibilityResult): string =>
  [
    'RELATIONSHIP COMPATIBILITY ANALYSIS',
    `${p1.name.trim()} & ${p2.name.trim()}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `OVERALL SCORE: ${r.overallScore}% - ${r.verdict.replace(/^\S+\s/, '')} (based on ${r.factorsUsed} factors)`,
    '',
    'BREAKDOWN',
    ...(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((c) => `• ${CATEGORY_LABELS[c]}: ${r.categories[c] === null ? 'not enough info' : `${r.categories[c]}%`}`),
    '',
    'STRENGTHS',
    ...r.strengths.map((s) => `• ${s}`),
    '',
    'CHALLENGES',
    ...r.challenges.map((s) => `• ${s}`),
    '',
    ...(r.personalityMatch ? ['PERSONALITY MATCH', r.personalityMatch, ''] : []),
    ...(r.communicationAdvice ? ['COMMUNICATION', r.communicationAdvice, ''] : []),
    ...(r.zodiacCompatibility ? ['ZODIAC', r.zodiacCompatibility, ''] : []),
    'LONG-TERM POTENTIAL',
    r.longTermPotential,
    '',
    'RELATIONSHIP TIPS',
    ...r.relationshipTips.map((s) => `• ${s}`),
    '',
    'DATE IDEAS',
    ...r.dateIdeas.map((s) => `• ${s}`),
    '',
    'CONFLICT RESOLUTION',
    ...r.conflictResolution.map((s) => `• ${s}`),
    '',
    'IMPROVEMENT AREAS',
    ...r.improvementAreas.map((s) => `• ${s}`),
    '',
    'For entertainment and reflection only - no quiz can predict a relationship.',
    'Generated with the Aivello Relationship Compatibility tool',
  ].join('\n');

export const downloadCompatibilityReport = (p1: PersonProfile, p2: PersonProfile, r: CompatibilityResult): void => {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'person';
  const blob = new Blob([compatibilityReportText(p1, p2, r)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compatibility-${slug(p1.name)}-${slug(p2.name)}.txt`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

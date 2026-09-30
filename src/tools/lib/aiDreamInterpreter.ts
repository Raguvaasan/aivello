/**
 * Client-side dream interpretation.
 *
 * The dream text is tokenised and matched against a dictionary of common dream
 * symbols (with word-boundary patterns, so "scared" no longer matches "car"), emotion
 * vocabulary and lucidity cues. Every section of the result is built from what the
 * user actually wrote. It is a reflective aid, not a clinical assessment.
 */

export const DREAM_MOODS = [
  'Happy', 'Anxious', 'Confused', 'Peaceful', 'Excited',
  'Fearful', 'Sad', 'Curious', 'Nostalgic', 'Frustrated',
] as const;

export const DREAM_MIN_LENGTH = 20;
export const DREAM_MAX_LENGTH = 5000;

export interface DreamInput {
  description: string;
  date: string;
  mood: string;
  lifeContext: string;
}

export interface DreamSymbol {
  symbol: string;
  matched: string;
  meaning: string;
  significance: string;
}

export interface DreamInterpretation {
  id: string;
  createdAt: string;
  dreamDate: string;
  mood: string;
  dreamType: string;
  dreamTypeDescription: string;
  recurring: boolean;
  mainThemes: string[];
  psychologicalMeaning: string;
  emotionalState: string;
  emotionWords: string[];
  symbolAnalysis: DreamSymbol[];
  lifeReflections: string[];
  actionableInsights: string[];
  spiritualMeaning: string;
  recommendations: string[];
  lucidityLevel: number;
  emotionalIntensity: number;
}

export const todayISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export type DreamErrors = Partial<Record<'description' | 'date', string>>;

export const validateDreamInput = (input: DreamInput): DreamErrors => {
  const errors: DreamErrors = {};
  const text = input.description.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (!text) errors.description = 'Describe your dream first.';
  else if (text.length < DREAM_MIN_LENGTH || wordCount < 5) {
    errors.description = 'Add a bit more detail (at least a sentence or two) so there is something to interpret.';
  } else if (text.length > DREAM_MAX_LENGTH) errors.description = `Keep the description under ${DREAM_MAX_LENGTH} characters.`;
  if (input.date && input.date > todayISO()) errors.date = 'The dream date cannot be in the future.';
  return errors;
};

type Theme =
  | 'emotions' | 'freedom' | 'control' | 'anxiety' | 'avoidance' | 'selfImage' | 'transition' | 'loss'
  | 'newBeginnings' | 'relationships' | 'fear' | 'performance' | 'vulnerability' | 'direction' | 'opportunity'
  | 'ambition' | 'growth' | 'selfWorth' | 'communication' | 'commitment' | 'past' | 'spirituality' | 'family'
  | 'turmoil' | 'intuition' | 'creativity' | 'selfReflection';

interface SymbolEntry {
  symbol: string;
  re: RegExp;
  meaning: string;
  significance: string;
  themes: Theme[];
  spiritual?: string;
}

const SYMBOLS: SymbolEntry[] = [
  { symbol: 'Water', re: /\b(water|ocean|sea|lake|river|waves?|rain(?:ing)?|flood(?:ed|ing)?|swim(?:ming)?|swam|drown(?:ed|ing)?)\b/, meaning: 'Emotions, the subconscious, cleansing', significance: 'Calm water often mirrors emotional balance; rough, rising or deep water can point to feelings that currently seem overwhelming.', themes: ['emotions'], spiritual: 'Water is widely associated with purification and renewal.' },
  { symbol: 'Fire', re: /\b(fire|flames?|burn(?:ing|ed|t)?|smoke|blaze)\b/, meaning: 'Passion, anger, transformation', significance: 'Fire can reflect strong feelings - desire, anger or urgency - or something in your life that is being burned away to make room for change.', themes: ['transition', 'emotions'], spiritual: 'Fire often symbolises purification and rebirth.' },
  { symbol: 'Flying', re: /\b(fly|flying|flew|soar(?:ing|ed)?|float(?:ing|ed)?|levitat\w*)\b/, meaning: 'Freedom, perspective, escape', significance: 'Flying usually reflects a wish for freedom or a new perspective; struggling to stay airborne can mirror doubts about keeping things going.', themes: ['freedom'], spiritual: 'Flight is a classic image of transcendence and rising above limits.' },
  { symbol: 'Falling', re: /\b(fall|falling|fell|dropp(?:ing|ed)|plummet\w*)\b/, meaning: 'Loss of control, insecurity', significance: 'Falling dreams often appear when something in waking life feels unstable or when you fear failing at something important.', themes: ['control', 'anxiety'] },
  { symbol: 'Being chased', re: /\b(chas(?:e|ed|ing)|pursu(?:ed|ing|it)|hunt(?:ed|ing)|ran away|running away|followed me|following me)\b/, meaning: 'Avoidance, pressure', significance: 'Being chased often points to something you are avoiding - a conversation, a decision or a feeling - that keeps catching up with you.', themes: ['avoidance', 'anxiety'] },
  { symbol: 'Teeth', re: /\b(tooth|teeth)\b/, meaning: 'Self-image, communication, worry about appearance', significance: 'Teeth dreams are commonly linked to worries about how others see you or about saying the wrong thing.', themes: ['selfImage', 'communication'] },
  { symbol: 'House', re: /\b(house|home|rooms?|attic|basement|hallway|apartment)\b/, meaning: 'The self, your inner life', significance: 'Houses often represent you: unfamiliar rooms can suggest undiscovered parts of yourself, while damage can mirror stress.', themes: ['selfReflection'] },
  { symbol: 'Vehicle', re: /\b(car|cars|driv(?:e|ing|er)|drove|bus|train|plane|airplane|bike|bicycle)\b/, meaning: 'Life direction and control', significance: 'Who is driving matters: being in control suggests agency; being a passenger or losing the brakes can mirror feeling carried along by events.', themes: ['direction', 'control'] },
  { symbol: 'Death', re: /\b(death|dead|die|dying|died|funeral|grave|coffin)\b/, meaning: 'Endings, transformation', significance: 'Death in dreams rarely predicts death; it usually marks the end of a phase, habit or identity so that something new can begin.', themes: ['transition', 'loss'], spiritual: 'Many traditions read dream-death as rebirth.' },
  { symbol: 'Baby', re: /\b(baby|babies|pregnan\w*|infant|newborn)\b/, meaning: 'New beginnings, potential, vulnerability', significance: 'A baby can represent a new project, idea or part of yourself that needs care and attention to grow.', themes: ['newBeginnings'] },
  { symbol: 'Snake', re: /\b(snakes?|serpents?|viper|cobra)\b/, meaning: 'Hidden fears, healing, transformation', significance: 'Snakes can signal a hidden worry or a person you do not fully trust - or, like shedding skin, personal renewal.', themes: ['fear', 'transition'], spiritual: 'The snake is an ancient symbol of healing and rebirth.' },
  { symbol: 'Dog', re: /\b(dogs?|pupp(?:y|ies))\b/, meaning: 'Loyalty, friendship, protection', significance: 'A friendly dog often reflects trust and companionship; an aggressive one can point to conflict with someone close.', themes: ['relationships'] },
  { symbol: 'Cat', re: /\b(cats?|kittens?)\b/, meaning: 'Independence, intuition', significance: 'Cats are often linked to independence and intuition - trusting your instincts or wanting more personal space.', themes: ['intuition'] },
  { symbol: 'Spider', re: /\b(spiders?|cobwebs?|webs?)\b/, meaning: 'Feeling trapped, creativity', significance: 'Spiders can represent feeling caught in a complicated situation, or patient, creative work being woven together.', themes: ['control', 'creativity'] },
  { symbol: 'School or exam', re: /\b(school|exams?|test|classroom|teacher|homework|unprepared)\b/, meaning: 'Performance pressure, being evaluated', significance: 'Exam dreams often show up long after school ends, whenever you feel tested or worry about being unprepared.', themes: ['performance', 'anxiety'] },
  { symbol: 'Being naked', re: /\b(naked|nude|undressed|no clothes)\b/, meaning: 'Vulnerability, exposure', significance: 'Being naked in public often mirrors a fear of being exposed or judged - or a wish to be seen as you really are.', themes: ['vulnerability', 'selfImage'] },
  { symbol: 'Being lost', re: /\b(lost|maze|couldn'?t find|can'?t find|wrong way)\b/, meaning: 'Uncertainty about direction', significance: 'Being lost often reflects uncertainty about a decision or a path in life.', themes: ['direction'] },
  { symbol: 'Door', re: /\b(doors?|gates?|doorway)\b/, meaning: 'Opportunities, transitions', significance: 'Open doors suggest new opportunities; locked doors can mirror feeling blocked from something you want.', themes: ['opportunity', 'transition'] },
  { symbol: 'Key', re: /\b(keys?)\b/, meaning: 'Solutions, access', significance: 'A key often represents an answer or ability you already have but have not used yet.', themes: ['opportunity'] },
  { symbol: 'Bridge', re: /\b(bridges?)\b/, meaning: 'Transition, connection', significance: 'Crossing a bridge commonly reflects moving from one life stage to another.', themes: ['transition'] },
  { symbol: 'Mountain or climbing', re: /\b(mountains?|climb(?:ing|ed)?|cliffs?|hills?|summit)\b/, meaning: 'Obstacles, ambition', significance: 'Climbing reflects effort toward a goal; the view from the top can mirror a sense of achievement.', themes: ['ambition'] },
  { symbol: 'Forest', re: /\b(forest|woods|jungle|trees?)\b/, meaning: 'The unknown, growth', significance: 'Forests can represent the unexplored parts of your mind - mysterious, but full of growth.', themes: ['growth'] },
  { symbol: 'Money', re: /\b(money|cash|coins?|rich|wallet|lottery)\b/, meaning: 'Self-worth, security', significance: 'Money in dreams is often less about finances and more about how much you value yourself or feel secure.', themes: ['selfWorth'] },
  { symbol: 'Phone', re: /\b(phones?|telephone|cellphone|voicemail|ringing|phone call|text(?:ed|ing)? me)\b/, meaning: 'Communication, connection', significance: 'A phone that will not work can mirror frustration about not being heard or reaching someone.', themes: ['communication'] },
  { symbol: 'Wedding', re: /\b(wedding|marr(?:y|ied|iage)|bride|groom|engaged)\b/, meaning: 'Commitment, union', significance: 'Weddings often symbolise commitment - to a person, a job or a new direction - rather than marriage itself.', themes: ['commitment', 'relationships'] },
  { symbol: 'Former partner', re: /\b(ex|ex-boyfriend|ex-girlfriend|ex-husband|ex-wife|former partner)\b/, meaning: 'Unresolved feelings, lessons from the past', significance: 'Dreaming of an ex usually says more about a feeling or pattern from that time than about the person.', themes: ['past', 'relationships'] },
  { symbol: 'Parent', re: /\b(mother|mom|mum|father|dad|parents?)\b/, meaning: 'Authority, nurture, family patterns', significance: 'Parents in dreams can reflect your relationship with care, approval or authority.', themes: ['family'] },
  { symbol: 'Stairs or elevator', re: /\b(stairs|staircase|steps|elevator|lift|escalator)\b/, meaning: 'Progress, changing levels', significance: 'Going up often mirrors progress; going down can reflect exploring deeper feelings.', themes: ['ambition', 'transition'] },
  { symbol: 'Storm', re: /\b(storms?|thunder|lightning|tornado|hurricane)\b/, meaning: 'Emotional turmoil, sudden change', significance: 'Storms often reflect tension that is building or a period of upheaval.', themes: ['turmoil', 'emotions'] },
  { symbol: 'Moon', re: /\b(moon|moonlight)\b/, meaning: 'Intuition, cycles', significance: 'The moon is linked to intuition, emotion and the natural cycles of change.', themes: ['intuition'], spiritual: 'The moon is a long-standing symbol of intuition and the feminine.' },
  { symbol: 'Sun', re: /\b(sun|sunlight|sunshine|sunrise)\b/, meaning: 'Clarity, vitality', significance: 'Sunlight usually reflects optimism, clarity and energy.', themes: ['growth'] },
  { symbol: 'Blood', re: /\b(blood|bleed(?:ing)?|bled)\b/, meaning: 'Life force, emotional hurt', significance: 'Blood can reflect something that is draining your energy or a hurt that needs attention.', themes: ['loss', 'emotions'] },
  { symbol: 'Mirror', re: /\b(mirrors?|reflection)\b/, meaning: 'Self-reflection, identity', significance: 'Mirrors invite you to look at how you see yourself - and whether that matches how you feel.', themes: ['selfReflection', 'selfImage'] },
  { symbol: 'Ghost', re: /\b(ghosts?|haunt(?:ed|ing)?|spirits?)\b/, meaning: 'The unresolved past', significance: 'Ghosts often represent memories or feelings that have not been laid to rest.', themes: ['past'] },
  { symbol: 'Monster', re: /\b(monsters?|demons?|creatures?|beasts?|zombies?)\b/, meaning: 'Repressed fear or anger', significance: 'Monsters tend to embody fears or emotions you have not faced directly.', themes: ['fear'] },
  { symbol: 'Being late', re: /\b(late|missed|missing the)\b/, meaning: 'Fear of missing out, time pressure', significance: 'Running late often mirrors feeling behind or worried about missing an opportunity.', themes: ['anxiety', 'performance'] },
  { symbol: 'Divine figure', re: /\b(angels?|god|divine|heaven|holy|prayer)\b/, meaning: 'Guidance, meaning', significance: 'Divine figures can reflect a search for guidance, reassurance or purpose.', themes: ['spirituality'], spiritual: 'This is often read as a message of guidance or protection.' },
];

const THEME_TEXT: Record<Theme, { label: string; analysis: string; reflection: string; action: string }> = {
  emotions: { label: 'Emotional processing', analysis: 'Your mind appears to be working through strong feelings that may not have much room during the day.', reflection: 'Which feelings have you been setting aside lately?', action: 'Give one unspoken feeling an outlet - write it down or talk it through.' },
  freedom: { label: 'Freedom', analysis: 'There is a strong theme of wanting more space, independence or perspective.', reflection: 'Where do you feel restricted, and what would more freedom look like?', action: 'Identify one small commitment you can loosen to create breathing room.' },
  control: { label: 'Control', analysis: 'The dream circles around control - having it, losing it, or wanting it back.', reflection: 'What situation currently feels like it is slipping out of your hands?', action: 'Separate what you can influence from what you cannot, and act on the first list.' },
  anxiety: { label: 'Anxiety', analysis: 'Worry and pressure seem to be surfacing, which is very common during stressful periods.', reflection: 'What deadline, decision or expectation has been on your mind before sleep?', action: 'Try a short wind-down routine: write tomorrow\'s worries on paper before bed.' },
  avoidance: { label: 'Avoidance', analysis: 'Something you have been postponing may be asking for attention.', reflection: 'Is there a conversation or decision you keep putting off?', action: 'Take one small step toward the thing you have been avoiding this week.' },
  selfImage: { label: 'Self-image', analysis: 'The dream touches on how you see yourself and how you think others see you.', reflection: 'Whose opinion has been weighing on you recently?', action: 'List three things you appreciate about yourself that do not depend on others\' approval.' },
  transition: { label: 'Transformation', analysis: 'Your subconscious seems to be processing change - an ending that makes space for something new.', reflection: 'What chapter of your life is closing, and what is opening?', action: 'Acknowledge what you are leaving behind; it makes the next step easier.' },
  loss: { label: 'Loss', analysis: 'Themes of loss or ending appear, which can reflect grief or letting go of something familiar.', reflection: 'Is there something or someone you are still missing?', action: 'Allow yourself time to grieve changes, even ones you chose.' },
  newBeginnings: { label: 'New beginnings', analysis: 'Something new - an idea, project or part of yourself - seems to be emerging.', reflection: 'What new idea or responsibility has recently entered your life?', action: 'Nurture the new thing with a small, regular commitment.' },
  relationships: { label: 'Relationships', analysis: 'Connections with other people are central here, including trust, closeness or conflict.', reflection: 'Which relationship has been on your mind, and what do you need from it?', action: 'Reach out to someone you have been thinking about.' },
  fear: { label: 'Facing fears', analysis: 'The dream gives shape to a fear, which is one way the mind rehearses dealing with it safely.', reflection: 'What are you afraid might happen, and how likely is it really?', action: 'Name the fear precisely - vague fears feel bigger than specific ones.' },
  performance: { label: 'Performance pressure', analysis: 'Feeling tested or evaluated shows up strongly.', reflection: 'Where do you feel you have to prove yourself right now?', action: 'Prepare for one upcoming challenge in a small, concrete way.' },
  vulnerability: { label: 'Vulnerability', analysis: 'There is a sense of exposure - being seen more than you would like, or wanting to be seen truly.', reflection: 'Where do you feel exposed or unprotected?', action: 'Share something honest with someone you trust.' },
  direction: { label: 'Life direction', analysis: 'Questions about where you are heading, and who is steering, stand out.', reflection: 'Are you choosing your current path, or following one set for you?', action: 'Write down where you want to be in a year and one step toward it.' },
  opportunity: { label: 'Opportunity', analysis: 'Doors and keys suggest opportunities - some open, some you have not tried yet.', reflection: 'What opportunity have you noticed but not acted on?', action: 'Explore one opportunity you have been hesitant about.' },
  ambition: { label: 'Ambition', analysis: 'Effort and progress toward a goal are prominent.', reflection: 'Which goal is demanding the most from you right now?', action: 'Celebrate progress so far before pushing for the next milestone.' },
  growth: { label: 'Personal growth', analysis: 'Growth and exploration of the unknown are present.', reflection: 'What are you learning about yourself at the moment?', action: 'Try something slightly outside your comfort zone.' },
  selfWorth: { label: 'Self-worth', analysis: 'Security and self-value appear to be on your mind.', reflection: 'Do you feel valued - at work, at home, by yourself?', action: 'Notice where you undersell yourself and practise stating your value plainly.' },
  communication: { label: 'Communication', analysis: 'Being heard - or struggling to say something - is a key thread.', reflection: 'Is there something you have wanted to say but have not?', action: 'Plan the first sentence of a conversation you have been avoiding.' },
  commitment: { label: 'Commitment', analysis: 'Commitment - to a person, role or path - is being weighed up.', reflection: 'What are you being asked to commit to, and how do you feel about it?', action: 'List what excites and what worries you about the commitment.' },
  past: { label: 'The past', analysis: 'Old memories or relationships are resurfacing, often to resolve a lesson.', reflection: 'What from the past still feels unfinished?', action: 'Write a short letter (you do not need to send it) to close an old chapter.' },
  spirituality: { label: 'Spirituality', analysis: 'A search for meaning, guidance or reassurance runs through the dream.', reflection: 'Where do you look for guidance when things feel uncertain?', action: 'Set aside quiet time for reflection, meditation or prayer.' },
  family: { label: 'Family', analysis: 'Family roles and patterns - care, approval, authority - are present.', reflection: 'Which family dynamic has been on your mind?', action: 'Reflect on which family patterns you want to keep and which to change.' },
  turmoil: { label: 'Turmoil', analysis: 'Built-up tension or upheaval seems to be seeking release.', reflection: 'What pressure has been building without an outlet?', action: 'Release tension physically - a walk, exercise or breathing exercises.' },
  intuition: { label: 'Intuition', analysis: 'Instinct and inner knowing are highlighted.', reflection: 'What is your gut telling you about a current decision?', action: 'Before deciding, pause and note what your first instinct says.' },
  creativity: { label: 'Creativity', analysis: 'Creative energy - weaving, building, imagining - is active.', reflection: 'Is there a creative project waiting for your attention?', action: 'Capture any images from this dream in a sketch or note - they may feed a project.' },
  selfReflection: { label: 'Self-reflection', analysis: 'The dream seems to hold up a mirror to your inner life.', reflection: 'Which part of yourself have you not explored in a while?', action: 'Spend ten minutes journaling about how you have changed this year.' },
};

const EMOTION_WORDS: Record<string, string[]> = {
  fear: ['scared', 'afraid', 'terrified', 'frightened', 'panic', 'panicked', 'horror', 'nightmare', 'scream', 'screamed', 'screaming', 'dread'],
  sadness: ['sad', 'crying', 'cried', 'tears', 'lonely', 'alone', 'grief', 'miss', 'missed', 'heartbroken'],
  joy: ['happy', 'joy', 'laughing', 'laughed', 'excited', 'wonderful', 'amazing', 'beautiful', 'free', 'peaceful', 'calm', 'love'],
  anger: ['angry', 'furious', 'rage', 'yelled', 'shouting', 'fight', 'fighting', 'annoyed', 'frustrated'],
  confusion: ['confused', 'strange', 'weird', 'odd', 'unsure', 'lost', 'confusing', 'surreal'],
};

const INTENSIFIERS = ['very', 'extremely', 'so', 'incredibly', 'really', 'completely', 'totally', 'intensely', 'overwhelming', 'overwhelmed'];

const MOOD_STATE: Record<string, { text: string; base: number }> = {
  Happy: { text: 'You woke from this dream in a positive state, which suggests your mind is processing something hopeful or satisfying.', base: 15 },
  Anxious: { text: 'You felt anxious in the dream - a sign your mind may be rehearsing worries or uncertainty from waking life.', base: 25 },
  Confused: { text: 'Confusion in a dream often mirrors a situation in waking life that does not quite make sense yet.', base: 12 },
  Peaceful: { text: 'A peaceful dream suggests emotional balance, or a need for rest and calm that your mind is providing.', base: 5 },
  Excited: { text: 'Excitement points to anticipation - something you are looking forward to or energised by.', base: 25 },
  Fearful: { text: 'Fear in a dream is your mind processing threats in a safe space, often linked to stress or uncertainty.', base: 30 },
  Sad: { text: 'Sadness in a dream can be a healthy release of feelings that have little room during the day.', base: 18 },
  Curious: { text: 'Curiosity suggests openness - your mind exploring new ideas or possibilities.', base: 10 },
  Nostalgic: { text: 'Nostalgia points to the past - memories, people or places you are revisiting emotionally.', base: 12 },
  Frustrated: { text: 'Frustration often mirrors feeling blocked or unheard in waking life.', base: 20 },
};

const CONTEXT_CATEGORIES: { re: RegExp; label: string; themes: Theme[] }[] = [
  { re: /\b(job|work|boss|office|career|promotion|interview|colleague|fired|deadline)\b/i, label: 'work', themes: ['performance', 'control', 'ambition', 'anxiety'] },
  { re: /\b(partner|boyfriend|girlfriend|husband|wife|relationship|dating|breakup|broke up|divorce)\b/i, label: 'your relationship', themes: ['relationships', 'commitment', 'past', 'vulnerability'] },
  { re: /\b(family|mother|mom|mum|father|dad|parents?|sister|brother|kids?|children)\b/i, label: 'family', themes: ['family', 'relationships'] },
  { re: /\b(exam|exams|school|university|college|study|studying|test)\b/i, label: 'your studies', themes: ['performance', 'anxiety'] },
  { re: /\b(move|moving|moved|new city|new house|relocat\w*|travel\w*)\b/i, label: 'a move or big change', themes: ['transition', 'direction', 'newBeginnings'] },
  { re: /\b(money|debt|bills?|rent|finances?|savings)\b/i, label: 'money', themes: ['selfWorth', 'control', 'anxiety'] },
  { re: /\b(sick|illness|health|hospital|surgery|pain)\b/i, label: 'health', themes: ['vulnerability', 'fear', 'loss'] },
  { re: /\b(died|death|passed away|funeral|grief|grieving|loss)\b/i, label: 'a loss', themes: ['loss', 'past', 'transition'] },
  { re: /\b(baby|pregnan\w*|wedding|engaged|new job|started)\b/i, label: 'a new beginning', themes: ['newBeginnings', 'commitment'] },
];

const DREAM_TYPE_DESCRIPTIONS: Record<string, string> = {
  'Lucid Dream': 'You seem to have been aware that you were dreaming - a state many people try to cultivate.',
  Nightmare: 'A distressing dream with strong fear. Occasional nightmares are normal, especially under stress.',
  'Chase Dream': 'One of the most common dream types, usually linked to avoidance or pressure.',
  'Falling Dream': 'A very common dream, often tied to insecurity or loss of control.',
  'Flying Dream': 'Often a positive dream about freedom, confidence or perspective.',
  'Teeth Dream': 'A common dream associated with self-image and communication worries.',
  'Exam / Performance Dream': 'Typical when you feel tested or evaluated in waking life.',
  'Exposure Dream': 'Linked to vulnerability and fear of judgement.',
  'Transformation Dream': 'Death or endings in dreams usually symbolise change rather than literal loss.',
  'Water Dream': 'Water dreams usually reflect the state of your emotions.',
  'Relationship Dream': 'Centred on connection, commitment or unresolved feelings about someone.',
  'Symbolic Dream': 'A dream built from personal symbols - its meaning depends most on your own associations.',
};

export const interpretDream = (input: DreamInput): DreamInterpretation => {
  const text = input.description.trim();
  const lower = text.toLowerCase();
  const tokens = lower.match(/[a-z']+/g) || [];
  const tokenSet = new Set(tokens);

  // Symbols -----------------------------------------------------------------
  const found = SYMBOLS.map((s) => ({ entry: s, match: lower.match(s.re) }))
    .filter((x): x is { entry: SymbolEntry; match: RegExpMatchArray } => x.match !== null)
    .map((x) => ({ entry: x.entry, matched: x.match[0], index: x.match.index ?? 0 }))
    .sort((a, b) => a.index - b.index);

  const symbolAnalysis: DreamSymbol[] = found.slice(0, 8).map(({ entry, matched }) => ({
    symbol: entry.symbol,
    matched,
    meaning: entry.meaning,
    significance: entry.significance,
  }));

  // Emotions ----------------------------------------------------------------
  const emotionHits: Record<string, string[]> = {};
  Object.entries(EMOTION_WORDS).forEach(([emotion, list]) => {
    const hits = list.filter((w) => tokenSet.has(w));
    if (hits.length) emotionHits[emotion] = hits;
  });
  const emotionWords = Object.values(emotionHits).flat();

  // Themes ------------------------------------------------------------------
  const themeScore = new Map<Theme, number>();
  const bump = (t: Theme, n = 1) => themeScore.set(t, (themeScore.get(t) || 0) + n);
  found.forEach(({ entry }) => entry.themes.forEach((t, i) => bump(t, i === 0 ? 2 : 1)));
  if (emotionHits.fear) bump('fear', emotionHits.fear.length);
  if (emotionHits.sadness) bump('loss', 1);
  if (emotionHits.anger) bump('turmoil', 1);
  if (emotionHits.confusion) bump('direction', 1);
  if (input.mood === 'Anxious' || input.mood === 'Fearful') bump('anxiety', 1);
  if (input.mood === 'Nostalgic') bump('past', 2);
  if (input.mood === 'Frustrated') bump('control', 1);

  const contextMatches = CONTEXT_CATEGORIES.filter((c) => c.re.test(input.lifeContext));
  contextMatches.forEach((c) => c.themes.forEach((t) => themeScore.has(t) && bump(t, 1)));

  const rankedThemes = Array.from(themeScore.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const topThemes: Theme[] = rankedThemes.length ? rankedThemes.slice(0, 4) : ['selfReflection'];

  // Metrics -----------------------------------------------------------------
  const lucidCues = [
    /\b(knew|reali[sz]ed|aware|understood) (that )?(i was|it was|this was) (dreaming|a dream)\b/,
    /\blucid\b/,
    /\b(i (could )?control(led)?|in control|i decided to|i chose to|changed the dream)\b/,
    /\bwoke up (inside|within) the dream\b|\bfalse awakening\b/,
  ];
  const lucidHits = lucidCues.filter((re) => re.test(lower)).length;
  const lucidityLevel = Math.min(100, lucidHits * 35);

  const intensifierCount = tokens.filter((t) => INTENSIFIERS.includes(t)).length;
  const exclamations = (text.match(/!/g) || []).length;
  const moodInfo = MOOD_STATE[input.mood];
  const emotionalIntensity = Math.max(
    5,
    Math.min(100, Math.round(emotionWords.length * 12 + intensifierCount * 6 + Math.min(exclamations, 5) * 5 + (moodInfo?.base ?? 10)))
  );

  // Dream type --------------------------------------------------------------
  const has = (symbol: string) => found.some((f) => f.entry.symbol === symbol);
  const fearCount = emotionHits.fear?.length ?? 0;
  let dreamType = 'Symbolic Dream';
  if (lucidityLevel >= 35) dreamType = 'Lucid Dream';
  else if (input.mood === 'Fearful' || fearCount >= 2 || (fearCount >= 1 && has('Monster'))) dreamType = 'Nightmare';
  else if (has('Being chased')) dreamType = 'Chase Dream';
  else if (has('Falling')) dreamType = 'Falling Dream';
  else if (has('Flying')) dreamType = 'Flying Dream';
  else if (has('Teeth')) dreamType = 'Teeth Dream';
  else if (has('School or exam')) dreamType = 'Exam / Performance Dream';
  else if (has('Being naked')) dreamType = 'Exposure Dream';
  else if (has('Death')) dreamType = 'Transformation Dream';
  else if (has('Wedding') || has('Former partner')) dreamType = 'Relationship Dream';
  else if (has('Water')) dreamType = 'Water Dream';
  const recurring = /\b(again|every night|recurring|keep having|always dream|same dream)\b/.test(lower);

  // Narrative sections ------------------------------------------------------
  const primary = THEME_TEXT[topThemes[0]];
  const symbolNames = symbolAnalysis.map((s) => s.symbol.toLowerCase());
  const psychologicalMeaning = [
    symbolNames.length
      ? `The most prominent images in your dream - ${symbolNames.slice(0, 3).join(', ')} - point toward ${primary.label.toLowerCase()}.`
      : `Your dream does not contain the most common dream symbols, so its meaning is likely very personal. The overall thread seems to be ${primary.label.toLowerCase()}.`,
    primary.analysis,
    topThemes[1] ? `A secondary thread of ${THEME_TEXT[topThemes[1]].label.toLowerCase()} suggests: ${THEME_TEXT[topThemes[1]].analysis.charAt(0).toLowerCase()}${THEME_TEXT[topThemes[1]].analysis.slice(1)}` : '',
    recurring ? 'Because this dream seems to repeat, it may be pointing to something that has not been resolved yet.' : '',
  ].filter(Boolean).join(' ');

  const emotionSummary = Object.entries(emotionHits)
    .map(([emotion, words]) => `${emotion} ("${words.slice(0, 2).join('", "')}")`)
    .join(', ');
  const emotionalState = [
    moodInfo ? moodInfo.text : 'You did not select a mood, so this reading is based on the words you used.',
    emotionSummary ? `The language in your description carries ${emotionSummary}.` : 'Your description is fairly neutral in emotional language, which can suggest you were observing more than feeling.',
    emotionalIntensity >= 60 ? 'Overall, the emotional intensity is high - it is worth being gentle with yourself today.' : '',
  ].filter(Boolean).join(' ');

  const lifeReflections = topThemes.map((t) => THEME_TEXT[t].reflection);
  contextMatches.slice(0, 2).forEach((c) => {
    const linked = found.find((f) => f.entry.themes.some((t) => c.themes.includes(t)));
    lifeReflections.unshift(
      linked
        ? `You mentioned ${c.label}. The "${linked.matched}" part of your dream may be connected - how does that situation make you feel before you sleep?`
        : `You mentioned ${c.label}. Consider whether the feelings in this dream echo how that situation feels right now.`
    );
  });
  if (input.lifeContext.trim() && contextMatches.length === 0) {
    lifeReflections.unshift('Look at the life context you described and ask which moment in the dream felt most like it.');
  }

  const actionableInsights = [
    ...topThemes.map((t) => THEME_TEXT[t].action),
    'Keep a dream journal by your bed and note dreams immediately on waking - patterns appear within a few weeks.',
  ];

  const spiritualSymbol = found.find((f) => f.entry.spiritual);
  const spiritualMeaning = spiritualSymbol
    ? `${spiritualSymbol.entry.spiritual} In your dream, the ${spiritualSymbol.entry.symbol.toLowerCase()} may be inviting you to see this period as ${topThemes.includes('transition') ? 'a renewal' : 'a time of reflection and guidance'}.`
    : topThemes.includes('spirituality')
      ? 'Your dream carries a search for meaning and guidance - a sign to make space for reflection.'
      : 'From a spiritual point of view, dreams like this are often read as invitations to pay attention to your inner life and the messages it sends through images.';

  const recommendations: string[] = [];
  if (dreamType === 'Nightmare') {
    recommendations.push('Try "imagery rehearsal": while awake, rewrite the nightmare with a better ending and picture it for a few minutes before bed.');
    recommendations.push('Avoid screens, heavy meals and alcohol in the hour before sleep - they are linked to more vivid, disturbing dreams.');
  }
  if (emotionalIntensity >= 60 || topThemes.includes('anxiety')) recommendations.push('Use a short relaxation exercise at bedtime, such as slow breathing (4 seconds in, 6 seconds out).');
  if (recurring) recommendations.push('Track when this dream recurs - linking it to specific days or events often reveals its trigger.');
  if (dreamType === 'Lucid Dream' || lucidityLevel > 0) recommendations.push('To encourage lucid dreams, do "reality checks" during the day (e.g. read a line of text twice) and keep a dream journal.');
  if (topThemes.includes('creativity') || topThemes.includes('growth')) recommendations.push('Capture images from the dream in a sketch or note - dreams are a rich source of creative ideas.');
  recommendations.push('Keep a consistent sleep schedule; regular sleep improves dream recall and mood.');

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toLocaleString(),
    dreamDate: input.date || todayISO(),
    mood: input.mood,
    dreamType,
    dreamTypeDescription: DREAM_TYPE_DESCRIPTIONS[dreamType],
    recurring,
    mainThemes: topThemes.map((t) => THEME_TEXT[t].label),
    psychologicalMeaning,
    emotionalState,
    emotionWords,
    symbolAnalysis,
    lifeReflections: Array.from(new Set(lifeReflections)).slice(0, 6),
    actionableInsights: Array.from(new Set(actionableInsights)).slice(0, 6),
    spiritualMeaning,
    recommendations: Array.from(new Set(recommendations)).slice(0, 6),
    lucidityLevel,
    emotionalIntensity,
  };
};

export const dreamReportText = (input: DreamInput, r: DreamInterpretation): string =>
  [
    'DREAM INTERPRETATION REPORT',
    `Dream date: ${r.dreamDate}`,
    `Mood in the dream: ${r.mood || 'Not specified'}`,
    `Generated: ${r.createdAt}`,
    '',
    'DREAM DESCRIPTION',
    input.description.trim(),
    '',
    `DREAM TYPE: ${r.dreamType}${r.recurring ? ' (recurring)' : ''}`,
    r.dreamTypeDescription,
    '',
    'MAIN THEMES',
    ...r.mainThemes.map((t) => `• ${t}`),
    '',
    'PSYCHOLOGICAL MEANING',
    r.psychologicalMeaning,
    '',
    'EMOTIONAL STATE',
    r.emotionalState,
    '',
    'SYMBOLS',
    ...(r.symbolAnalysis.length
      ? r.symbolAnalysis.map((s) => `• ${s.symbol.toUpperCase()} ("${s.matched}"): ${s.meaning}\n  ${s.significance}`)
      : ['• No common dream symbols detected.']),
    '',
    'SPIRITUAL PERSPECTIVE',
    r.spiritualMeaning,
    '',
    'QUESTIONS FOR REFLECTION',
    ...r.lifeReflections.map((x) => `• ${x}`),
    '',
    'ACTIONABLE INSIGHTS',
    ...r.actionableInsights.map((x) => `• ${x}`),
    '',
    'RECOMMENDATIONS',
    ...r.recommendations.map((x) => `• ${x}`),
    '',
    'METRICS',
    `• Lucidity cues: ${r.lucidityLevel}%`,
    `• Emotional intensity: ${r.emotionalIntensity}%`,
    '',
    'This interpretation is for self-reflection and entertainment, not a medical or psychological assessment.',
    'Generated with the Aivello Dream Interpreter',
  ].join('\n');

export const downloadDreamReport = (input: DreamInput, r: DreamInterpretation): void => {
  const blob = new Blob([dreamReportText(input, r)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dream-interpretation-${r.dreamDate}.txt`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

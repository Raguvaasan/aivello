/**
 * Builds a timed video script outline from the topic, duration, audience, key points and
 * call to action. Section timings are computed from the chosen duration and narration
 * targets assume ~150 spoken words per minute.
 */
import { STOPWORDS, titleCase } from './aiTextSummarizer';

export type VideoStyle = 'educational' | 'entertaining' | 'promotional' | 'tutorial' | 'vlog';

export interface ScriptInput {
  topic: string;
  durationMin: number;
  style: VideoStyle;
  audience: string;
  keyPoints: string;
  callToAction: string;
}

export const MAX_TOPIC_LENGTH = 150;
export const MAX_KEY_POINTS = 8;
const WORDS_PER_SECOND = 2.5;
const RULE = '━'.repeat(30);

export const STYLE_LABELS: Record<VideoStyle, string> = {
  educational: 'Educational',
  entertaining: 'Entertaining',
  promotional: 'Promotional',
  tutorial: 'Tutorial',
  vlog: 'Vlog',
};

/** Default section plans when the user gives no key points. `{t}` is the topic. */
const DEFAULT_SECTIONS: Record<VideoStyle, string[]> = {
  educational: ['What {t} actually is', 'Why {t} matters', 'How {t} works', 'A real-world example', 'Common mistakes to avoid', 'Pro tips'],
  entertaining: ['The setup', 'Giving {t} a real try', 'The unexpected twist', 'The big reveal', 'Bonus round', 'Final verdict'],
  promotional: ['The problem', 'Introducing {t}', 'How it works', 'What makes it different', 'Proof and results', 'How to get started'],
  tutorial: ['What you need', 'Step 1: Set up', 'Step 2: The core process', 'Step 3: Refine the details', 'Step 4: Test and verify', 'Troubleshooting'],
  vlog: ['Setting the scene', 'Diving into {t}', 'The highlight', 'Honest thoughts', 'What I learned', 'Looking ahead'],
};

const CAMERA: Record<VideoStyle, string[]> = {
  educational: ['Talking head, lower third with key term', 'Screen graphic / diagram', 'B-roll with voice-over', 'Whiteboard or on-screen text'],
  entertaining: ['Quick cuts, reaction shots', 'Wide shot, dynamic angle', 'Close-up reaction', 'Handheld, fast-paced'],
  promotional: ['Cinematic B-roll', 'Clean product shot', 'Screen demo / UI close-up', 'Customer or team footage'],
  tutorial: ['Screen recording, cursor highlight', 'Over-the-shoulder / hands-on shot', 'Zoom-in on the detail', 'Split screen: before / after'],
  vlog: ['Handheld, natural light', 'Walking shot, ambient sound', 'Stabilized wide of the location', 'Close-up to camera'],
};

const SECTION_COUNT_BY_DURATION: Array<[number, number]> = [
  [1, 2],
  [3, 3],
  [5, 4],
  [10, 5],
  [15, 6],
];

export const formatTime = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const parseLines = (raw: string): string[] =>
  raw
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_KEY_POINTS);

/** Lowercases Title Case words for use mid-sentence, keeping acronyms ("AI", "iOS"). */
const softLower = (text: string): string =>
  text
    .split(' ')
    .map((w) => (/^[A-Z][a-z'’]*$/.test(w) ? w.toLowerCase() : w))
    .join(' ');

/** "How to Build a Morning Routine" -> "build a morning routine" (for "how to ..." phrasing). */
const howToPhrase = (topic: string): string | null => {
  const m = topic.match(/^how to\s+(.+)$/i);
  return m ? softLower(m[1]) : null;
};

/** The topic as it should read inside a spoken sentence. */
const spokenTopic = (topic: string): string => {
  const how = howToPhrase(topic);
  return how ? `how to ${how}` : topic;
};

export const hashtagsFor = (topic: string, style: VideoStyle): string[] => {
  // "How to Build a Morning Routine" -> tags from "Morning Routine".
  const subject = howToPhrase(topic) ? topic.replace(/^how to\s+\S+\s*/i, '') || topic : topic;
  const words = subject
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()) && w.toLowerCase() !== 'how');
  const tags = new Set<string>();
  if (words.length > 1) tags.add(`#${words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}`);
  words.slice(0, 4).forEach((w) => tags.add(`#${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`));
  tags.add(`#${STYLE_LABELS[style]}`);
  return Array.from(tags).slice(0, 6);
};

const titleIdeas = (topic: string, style: VideoStyle, year: number): string[] => {
  const t = titleCase(topic);
  const how = howToPhrase(topic);
  switch (style) {
    case 'educational':
      return [`${t}: Explained in Plain English`, `Everything You Need to Know About ${t} (${year})`, `${t} – What Most People Get Wrong`];
    case 'entertaining':
      return [`I Tried ${t} So You Don’t Have To`, `${t}… This Did NOT Go as Planned`, `We Put ${t} to the Test`];
    case 'promotional':
      return [`Meet ${t}`, `Why ${t} Changes Everything`, `${t}: See It in Action`];
    case 'tutorial':
      return how
        ? [`How to ${titleCase(how)} (Step-by-Step)`, `${titleCase(how)} in ${year}: Beginner’s Guide`, `The Easiest Way to ${titleCase(how)}`]
        : [`${t}: Step-by-Step Tutorial`, `${t} for Beginners (${year})`, `How to Get Started With ${t}`];
    case 'vlog':
    default:
      return [`A Day of ${t}`, `My Honest Experience With ${t}`, `${t} | Vlog`];
  }
};

const hookLine = (style: VideoStyle, topic: string, durationLabel: string): string => {
  const how = howToPhrase(topic);
  switch (style) {
    case 'educational':
      return `"Most people only know the surface of ${spokenTopic(topic)}. In the next ${durationLabel}, you’ll understand how it really works."`;
    case 'entertaining':
      return `"So… we tried ${spokenTopic(topic)}. And honestly? It did NOT go the way we expected."`;
    case 'promotional':
      return `"What if ${spokenTopic(topic)} could make your day easier, starting today?"`;
    case 'tutorial':
      return how
        ? `"By the end of this video you’ll know exactly how to ${how} – step by step."`
        : `"By the end of this video you’ll be up and running with ${topic} – step by step."`;
    case 'vlog':
    default:
      return `"Come along with me today – it’s all about ${spokenTopic(topic)}."`;
  }
};

const defaultCta: Record<VideoStyle, string> = {
  educational: 'Subscribe for more explainers and drop your questions in the comments.',
  entertaining: 'Like the video and comment what we should try next!',
  promotional: 'Visit the link in the description to learn more.',
  tutorial: 'Stuck on a step? Ask in the comments, and subscribe for more tutorials.',
  vlog: 'Tell me in the comments if you’ve tried this, and see you in the next one!',
};

const sectionGuidance = (style: VideoStyle, title: string, fromUser: boolean): string[] => {
  const subject = fromUser ? title : title.replace(/^Step \d+:\s*/, '');
  switch (style) {
    case 'educational':
      return [`Explain "${subject}" in one clear sentence first`, 'Back it up with an example, stat or visual', 'Recap the takeaway before moving on'];
    case 'entertaining':
      return [`Build up "${subject}" with energy and humor`, 'Show genuine reactions – cut the slow parts', 'Tease what’s coming next'];
    case 'promotional':
      return [`Focus on "${subject}" from the viewer’s point of view`, 'Show, don’t tell: demo or real footage', 'Add a real testimonial or result if you have one'];
    case 'tutorial':
      return [`Demonstrate "${subject}" slowly and clearly`, 'Explain why each action matters, not just what to click', 'Call out the most common mistake here'];
    case 'vlog':
    default:
      return [`Share your honest take on "${subject}"`, 'Capture candid moments and ambient B-roll', 'Talk to the camera like a friend'];
  }
};

export const buildVideoScript = (input: ScriptInput, year = new Date().getFullYear()): string => {
  const topic = input.topic.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  const audience = input.audience.trim();
  const userPoints = parseLines(input.keyPoints);
  const total = Math.max(30, Math.round(input.durationMin * 60));
  const durationLabel = input.durationMin === 1 ? '60 seconds' : `${input.durationMin} minutes`;
  const cta = input.callToAction.trim() || defaultCta[input.style];

  const defaultCount = SECTION_COUNT_BY_DURATION.find(([d]) => input.durationMin <= d)?.[1] ?? 6;
  const sectionTitles = userPoints.length
    ? userPoints
    : DEFAULT_SECTIONS[input.style].slice(0, defaultCount).map((s) => s.replace('{t}', howToPhrase(topic) ? 'it' : topic));

  const hook = Math.round(clamp(total * 0.06, 3, 20));
  const intro = Math.round(clamp(total * 0.08, 5, 45));
  const outro = Math.round(clamp(total * 0.08, 5, 40));
  const bodyTotal = Math.max(sectionTitles.length * 5, total - hook - intro - outro);
  const perSection = bodyTotal / sectionTitles.length;

  const words = (seconds: number): number => Math.max(10, Math.round((seconds * WORDS_PER_SECOND) / 5) * 5);
  const camera = CAMERA[input.style];

  const lines: string[] = [
    `VIDEO SCRIPT: "${topic}"`,
    `Duration: ${durationLabel} | Style: ${STYLE_LABELS[input.style]}${audience ? ` | Audience: ${audience}` : ''}`,
  ];
  if (input.durationMin <= 1) lines.push('Format: vertical 9:16 (Shorts / Reels / TikTok) – keep every shot under 3 seconds');
  lines.push(`Narration target: ~${words(total)} words at a natural pace`, RULE, '');

  let t = 0;
  lines.push(`[HOOK ${formatTime(t)}–${formatTime(t + hook)}]`, `(Camera: ${camera[0]})`, hookLine(input.style, topic, durationLabel), '');
  t += hook;

  const introLines = [`[INTRO ${formatTime(t)}–${formatTime(t + intro)}]`, `(Camera: ${camera[1 % camera.length]})`];
  introLines.push(
    audience
      ? `"This one’s for ${audience}. Today we’re covering ${spokenTopic(topic)}."`
      : `"Today we’re covering ${spokenTopic(topic)}."`
  );
  if (sectionTitles.length > 1) {
    introLines.push(`"Here’s what we’ll go through:"`);
    sectionTitles.forEach((s, i) => introLines.push(`  ${i + 1}. ${s}`));
  }
  lines.push(...introLines, '');
  t += intro;

  sectionTitles.forEach((title, i) => {
    const start = t;
    const end = i === sectionTitles.length - 1 ? total - outro : t + perSection;
    lines.push(
      `[SECTION ${i + 1}: ${title.toUpperCase()} ${formatTime(start)}–${formatTime(end)}]`,
      `(Camera: ${camera[(i + 2) % camera.length]})`,
      `Narration (~${words(end - start)} words):`,
      ...sectionGuidance(input.style, title, userPoints.length > 0).map((g) => `  • ${g}`),
      ''
    );
    t = end;
  });

  lines.push(
    `[CALL TO ACTION & OUTRO ${formatTime(total - outro)}–${formatTime(total)}]`,
    `(Camera: ${camera[0]}, end screen)`,
    `"That’s ${spokenTopic(topic)} in ${durationLabel}. ${cta}"`,
    '',
    RULE,
    'TITLE IDEAS',
    ...titleIdeas(topic, input.style, year).map((x) => `• ${x}`),
    '',
    'HASHTAGS',
    hashtagsFor(topic, input.style).join(' '),
    '',
    'PRODUCTION NOTES',
    `• Add chapter markers: ${sectionTitles.slice(0, 3).map((s) => `"${s}"`).join(', ')}${sectionTitles.length > 3 ? ', …' : ''}`,
    '• Add captions – most viewers watch on mute',
    '• Re-read the narration aloud and trim anything that doesn’t serve the topic'
  );
  return lines.join('\n');
};

/**
 * Template-driven email composer. Every sentence is built from the user's topic, key
 * points, recipient and sender, so different input yields a genuinely different email.
 * `variant` rotates between alternative phrasings for "Regenerate".
 */
import { titleCase, truncateWords } from './aiTextSummarizer';

export type EmailType = 'professional' | 'marketing' | 'followup' | 'apology' | 'thankyou' | 'meeting';
export type ToneType = 'formal' | 'casual';

export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  professional: 'Professional Inquiry',
  marketing: 'Marketing / Sales',
  followup: 'Follow-up',
  apology: 'Apology',
  thankyou: 'Thank You',
  meeting: 'Meeting Request',
};

export interface EmailInput {
  type: EmailType;
  tone: ToneType;
  topic: string;
  keyPoints: string;
  recipient: string;
  sender: string;
  variant: number;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  /** Subject + body, ready to paste. */
  full: string;
}

export const MAX_TOPIC_LENGTH = 300;
export const MAX_POINTS_LENGTH = 1500;

/** Verbs that let the topic follow "I am writing to ...". */
const LEADING_VERBS = new Set([
  'ask', 'request', 'discuss', 'follow', 'apologize', 'apologise', 'invite', 'share', 'propose', 'introduce',
  'thank', 'confirm', 'schedule', 'inform', 'update', 'offer', 'inquire', 'enquire', 'recommend', 'suggest',
  'announce', 'remind', 'check', 'explore', 'present', 'report', 'submit', 'apply', 'express',
  'clarify', 'arrange', 'reschedule', 'cancel', 'welcome', 'congratulate', 'notify', 'seek', 'provide',
]);

const pick = <T,>(options: readonly T[], seed: number): T => options[((seed % options.length) + options.length) % options.length];

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** "Partnership proposal." -> "partnership proposal" (keeps acronyms / proper nouns). */
export const normalizeTopic = (raw: string): string => {
  let t = raw.trim().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '');
  t = t.replace(/^(about|regarding|re:|re|concerning)\s+/i, '');
  const firstWord = t.split(' ')[0] ?? '';
  // Keep acronyms and codes ("NASA", "Q3", "iOS") exactly as typed.
  const keepCase = /^[A-Z][A-Z0-9]/.test(firstWord) || /[A-Z]/.test(firstWord.slice(1));
  return keepCase ? t : t.charAt(0).toLowerCase() + t.slice(1);
};

const startsWithVerb = (topic: string): boolean => LEADING_VERBS.has((topic.split(' ')[0] ?? '').toLowerCase());

const parsePoints = (raw: string): string[] =>
  raw
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim().replace(/[.;,]+$/, ''))
    .filter(Boolean)
    .slice(0, 8);

const sentence = (s: string): string => {
  const trimmed = s.trim();
  if (!trimmed) return '';
  const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(cap) ? cap : `${cap}.`;
};

const buildSubject = (type: EmailType, tone: ToneType, topic: string): string => {
  const short = titleCase(truncateWords(topic, 60));
  const formal = tone === 'formal';
  switch (type) {
    case 'marketing':
      return formal ? `An Opportunity Regarding ${short}` : `Quick Idea: ${short}`;
    case 'followup':
      return formal ? `Following Up: ${short}` : `Checking In: ${short}`;
    case 'apology':
      return formal ? `Apologies Regarding ${short}` : `Sorry About ${short}`;
    case 'thankyou':
      return formal ? `Thank You – ${short}` : `Thanks So Much – ${short}`;
    case 'meeting':
      return formal ? `Meeting Request: ${short}` : `Can We Chat? ${short}`;
    case 'professional':
    default:
      return formal ? `Inquiry: ${short}` : short;
  }
};

const pointsBlock = (points: string[], tone: ToneType, intro: string): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `${intro} ${sentence(points[0]).replace(/^./, (c) => c.toLowerCase())}`;
  const bullets = points.map((p) => `- ${sentence(p)}`).join('\n');
  return `${intro}\n${bullets}`;
};

interface Parts {
  opening: string;
  purpose: string;
  points: string;
  closing: string;
}

/** Drops a lead-in that duplicates the email type ("apologize for the delay" in an apology). */
const TYPE_LEAD_INS: Partial<Record<EmailType, RegExp>> = {
  apology: /^(?:apologi[sz]e|say sorry|sorry)\s+(?:for\s+|about\s+)?/i,
  thankyou: /^(?:thanks|thank you|thank)\s+(?:you\s+)?(?:for\s+)?/i,
  followup: /^follow(?:ing)?[- ]?up\s+(?:on|about|regarding)?\s*/i,
  meeting: /^(?:schedule|request|arrange|set up|book)\s+(?:a\s+)?(?:meeting|call|chat)\s*(?:about|to discuss|regarding|on|for)?\s*/i,
};

export const stripTypeLeadIn = (type: EmailType, topic: string): string => {
  const re = TYPE_LEAD_INS[type];
  const stripped = re ? topic.replace(re, '').trim() : topic;
  return stripped || topic;
};

const buildParts = (input: EmailInput, rawTopic: string, points: string[], seed: number): Parts => {
  const formal = input.tone === 'formal';
  const topic = stripTypeLeadIn(input.type, rawTopic);
  const verbTopic = startsWithVerb(topic);
  const about = verbTopic ? `to ${topic}` : `regarding ${topic}`;
  const casualAbout = verbTopic ? `to ${topic}` : `about ${topic}`;

  const opening = formal
    ? pick(['I hope this email finds you well.', 'I hope you are doing well.', 'Thank you for taking a moment to read this.'], seed)
    : pick(['Hope you’re doing well!', 'Hope your week is going great!', 'Hope all is good on your end!'], seed);

  switch (input.type) {
    case 'marketing':
      return {
        opening,
        purpose: formal
          ? `I am reaching out ${about}, which I believe could be of real value to you.`
          : `I had an idea ${casualAbout} that I think you’ll like.`,
        points: pointsBlock(points, input.tone, formal ? 'Here is what it offers:' : 'Here’s the gist:'),
        closing: formal
          ? pick([
              'Would you be open to a short call next week to explore whether this is a good fit?',
              'I would welcome the opportunity to walk you through the details at a time that suits you.',
            ], seed)
          : pick(['Want to hop on a quick call this week?', 'Would you be up for a quick chat about it?'], seed),
      };
    case 'followup':
      return {
        opening,
        purpose: formal
          ? `I wanted to follow up on my previous message ${about}.`
          : `Just circling back on my last note ${casualAbout}.`,
        points: pointsBlock(points, input.tone, formal ? 'As a quick reminder:' : 'Quick recap:'),
        closing: formal
          ? 'Please let me know if you need any further information from me. I look forward to hearing from you.'
          : 'No rush at all – just wanted to keep it on your radar. Let me know what you think!',
      };
    case 'apology':
      return {
        opening: formal ? 'I am writing to offer my sincere apologies.' : 'I owe you an apology.',
        purpose: formal
          ? `I am truly sorry ${verbTopic ? `that I failed to ${topic}` : `for ${topic}`}, and I take full responsibility for it.`
          : `I’m really sorry ${verbTopic ? `I didn’t ${topic}` : `about ${topic}`} – that’s on me.`,
        points: points.length
          ? pointsBlock(points, input.tone, formal ? 'To put this right, I am taking the following steps:' : 'Here’s what I’m doing to fix it:')
          : formal
            ? 'I am reviewing what went wrong and will make sure it does not happen again.'
            : 'I’m sorting it out and will make sure it doesn’t happen again.',
        closing: formal
          ? 'Thank you for your patience and understanding. Please let me know if there is anything else I can do.'
          : 'Thanks for being patient with me – let me know if there’s anything else I can do.',
      };
    case 'thankyou':
      return {
        opening,
        purpose: formal
          ? `I wanted to sincerely thank you ${verbTopic ? `for helping me ${topic}` : `for ${topic}`}.`
          : `Just wanted to say a huge thank you ${verbTopic ? `for helping me ${topic}` : `for ${topic}`}!`,
        points: pointsBlock(points, input.tone, formal ? 'In particular, I appreciated:' : 'I especially loved:'),
        closing: formal
          ? 'Your support means a great deal, and I look forward to staying in touch.'
          : 'It really made a difference – thanks again!',
      };
    case 'meeting':
      return {
        opening,
        purpose: formal
          ? `I would like to request a meeting ${about}.`
          : `Would you have some time to meet ${casualAbout}?`,
        points: pointsBlock(points, input.tone, formal ? 'I would like to cover the following:' : 'Things I’d love to cover:'),
        closing: formal
          ? 'Please let me know which days and times work best for you, and I will send a calendar invitation.'
          : 'Let me know what times work for you and I’ll send an invite!',
      };
    case 'professional':
    default:
      return {
        opening,
        purpose: formal ? `I am writing ${about}.` : `I wanted to reach out ${casualAbout}.`,
        points: pointsBlock(points, input.tone, formal ? 'Specifically, I would like to address the following:' : 'A few quick things:'),
        closing: formal
          ? pick([
              'I would appreciate the opportunity to discuss this further at your convenience.',
              'Please let me know if you would be available for a brief conversation.',
            ], seed)
          : pick(['Let me know what you think!', 'Would love to hear your thoughts when you have a moment.'], seed),
      };
  }
};

export const composeEmail = (input: EmailInput): GeneratedEmail => {
  const topic = normalizeTopic(input.topic);
  const points = parsePoints(input.keyPoints);
  const seed = hash(topic) + input.variant;
  const formal = input.tone === 'formal';
  const recipient = input.recipient.trim();
  const sender = input.sender.trim() || '[Your Name]';

  const greeting = formal
    ? recipient ? `Dear ${recipient},` : 'Hello,'
    : recipient ? `Hi ${recipient},` : 'Hi there,';
  const signOff = formal
    ? pick(['Best regards,', 'Kind regards,', 'Sincerely,'], seed)
    : pick(['Thanks,', 'Cheers,', 'Talk soon,'], seed);

  const parts = buildParts(input, topic, points, seed);
  const subject = buildSubject(input.type, input.tone, stripTypeLeadIn(input.type, topic));
  const paragraphs = [greeting, `${parts.opening} ${parts.purpose}`, parts.points, parts.closing, `${signOff}\n${sender}`].filter(Boolean);
  const body = paragraphs.join('\n\n');
  return { subject, body, full: `Subject: ${subject}\n\n${body}` };
};

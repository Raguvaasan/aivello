import React, { useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaEnvelope, FaCopy, FaMagic, FaPaperPlane, FaRedo } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  composeEmail,
  EMAIL_TYPE_LABELS,
  MAX_POINTS_LENGTH,
  MAX_TOPIC_LENGTH,
  type EmailType,
  type ToneType,
} from './lib/aiEmailWriter';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';

/** Splits "Subject: ...\n\nbody" (possibly edited by the user) back into its parts. */
const splitEmail = (full: string): { subject: string; body: string } => {
  const match = full.match(/^\s*Subject:\s*(.*)\n?([\s\S]*)$/i);
  return match ? { subject: match[1].trim(), body: match[2].replace(/^\n+/, '') } : { subject: '', body: full };
};

export default function AIEmailWriter() {
  const id = useId();
  const track = useToolTracking('ai-email-writer', 'AI Email Writer');
  const [emailType, setEmailType] = useState<EmailType>('professional');
  const [tone, setTone] = useState<ToneType>('formal');
  const [topic, setTopic] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [output, setOutput] = useState('');
  const [variant, setVariant] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ids = {
    type: `${id}-type`,
    tone: `${id}-tone`,
    topic: `${id}-topic`,
    topicError: `${id}-topic-error`,
    points: `${id}-points`,
    recipient: `${id}-recipient`,
    sender: `${id}-sender`,
    output: `${id}-output`,
  };

  const wordCount = useMemo(() => (output.trim() ? output.trim().split(/\s+/).length : 0), [output]);

  const generateEmail = () => {
    if (topic.trim().length < 3) {
      setError('Tell us what the email is about, e.g. "request a deadline extension for the Q3 report".');
      return;
    }
    setError(null);
    const email = composeEmail({ type: emailType, tone, topic, keyPoints, recipient, sender, variant });
    setOutput(email.full);
    setVariant((v) => v + 1);
    track('generate');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Email copied to clipboard');
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const mailtoHref = useMemo(() => {
    const { subject, body } = splitEmail(output);
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [output]);

  return (
    <ToolWrapper
      toolId="ai-email-writer"
      toolName="AI Email Writer"
      toolDescription="Generate professional emails instantly with AI. Perfect for business communication, follow-ups, and marketing outreach"
      toolCategory="Communication"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaEnvelope} className="text-3xl text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Email Writer</h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-purple-600 dark:text-purple-400 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} htmlFor={ids.type}>
                    Email type
                  </label>
                  <select
                    id={ids.type}
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value as EmailType)}
                    className={INPUT}
                  >
                    {(Object.keys(EMAIL_TYPE_LABELS) as EmailType[]).map((t) => (
                      <option key={t} value={t} className="bg-white dark:bg-gray-800">
                        {EMAIL_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL} htmlFor={ids.tone}>
                    Tone
                  </label>
                  <select id={ids.tone} value={tone} onChange={(e) => setTone(e.target.value as ToneType)} className={INPUT}>
                    <option value="formal" className="bg-white dark:bg-gray-800">
                      Formal
                    </option>
                    <option value="casual" className="bg-white dark:bg-gray-800">
                      Casual
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.topic}>
                  What is the email about? <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id={ids.topic}
                  type="text"
                  value={topic}
                  maxLength={MAX_TOPIC_LENGTH}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. request a meeting about the Q3 budget"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? ids.topicError : undefined}
                  className={INPUT}
                />
                {error && (
                  <p id={ids.topicError} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.points}>
                  Key points <span className="font-normal text-gray-500 dark:text-gray-400">(optional, one per line)</span>
                </label>
                <textarea
                  id={ids.points}
                  value={keyPoints}
                  maxLength={MAX_POINTS_LENGTH}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder={'Marketing spend is 12% over plan\nProposal to pause two campaigns'}
                  className={`${INPUT} h-24 resize-y`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} htmlFor={ids.recipient}>
                    Recipient name
                  </label>
                  <input
                    id={ids.recipient}
                    type="text"
                    value={recipient}
                    maxLength={80}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. Ms. Patel"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor={ids.sender}>
                    Your name
                  </label>
                  <input
                    id={ids.sender}
                    type="text"
                    value={sender}
                    maxLength={80}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    autoComplete="name"
                    className={INPUT}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={generateEmail}
                className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <IconWrapper icon={output ? FaRedo : FaMagic} />
                {output ? 'Regenerate Email' : 'Generate Email'}
              </button>
            </div>

            {/* Generated Email */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={ids.output}>
                  Generated email {output && <span className="font-normal text-gray-500 dark:text-gray-400">(editable)</span>}
                </label>
                {output && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="min-h-[44px] flex items-center gap-2 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <IconWrapper icon={FaCopy} />
                      Copy
                    </button>
                    <a
                      href={mailtoHref}
                      className="min-h-[44px] flex items-center gap-2 px-4 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <IconWrapper icon={FaPaperPlane} />
                      Open in mail app
                    </a>
                  </div>
                )}
              </div>
              <textarea
                id={ids.output}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                readOnly={!output}
                placeholder="Your email will appear here. Fill in the topic and press Generate."
                className={`${INPUT} flex-1 min-h-[20rem] font-mono text-sm resize-y bg-gray-50 dark:bg-gray-800/60`}
              />
              <p aria-live="polite" className="mt-1 text-xs text-gray-500 dark:text-gray-400 min-h-[1rem]">
                {output ? `Email ready · ${wordCount} words. Replace anything in [brackets] before sending.` : ''}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-xl">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Pro tips</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-disc pl-5">
              <li>Start the topic with a verb (&ldquo;ask about&hellip;&rdquo;, &ldquo;confirm&hellip;&rdquo;) or a noun phrase (&ldquo;Q3 budget review&rdquo;).</li>
              <li>Add key points to turn them into a clear bulleted list.</li>
              <li>Press Regenerate for alternative wording.</li>
              <li>Always review and personalize the email before sending.</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaVideo, FaCopy, FaDownload, FaTrash, FaMagic } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { buildVideoScript, MAX_KEY_POINTS, MAX_TOPIC_LENGTH, STYLE_LABELS, type VideoStyle } from './lib/aiVideoScript';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors';
const SMALL_BUTTON =
  'min-h-[44px] flex items-center gap-1.5 text-sm px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 ' +
  'border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50';

const STYLE_ICONS: Record<VideoStyle, string> = {
  educational: '\u{1F4DA}',
  entertaining: '\u{1F3AD}',
  promotional: '\u{1F4E2}',
  tutorial: '\u{1F6E0}️',
  vlog: '\u{1F4F8}',
};

const DURATIONS = [
  { value: 1, label: '1 minute (Shorts / Reels)' },
  { value: 3, label: '3 minutes' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
];

const topicSuggestions = [
  'How to Build a Morning Routine',
  `Top 10 AI Tools in ${new Date().getFullYear()}`,
  'Beginner’s Guide to Investing',
  'Day in the Life of a Developer',
  'Healthy Meal Prep for Beginners',
  'Travel Guide: Hidden Gems',
];

const AIVideoScriptGenerator: React.FC = () => {
  const id = useId();
  const track = useToolTracking('ai-video-script', 'AI Video Script Generator');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(5);
  const [style, setStyle] = useState<VideoStyle>('educational');
  const [audience, setAudience] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [script, setScript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | undefined>(undefined);
  const revokeTimerRef = useRef<number | undefined>(undefined);

  const ids = {
    topic: `${id}-topic`,
    topicError: `${id}-topic-error`,
    suggestions: `${id}-suggestions`,
    duration: `${id}-duration`,
    style: `${id}-style`,
    audience: `${id}-audience`,
    points: `${id}-points`,
    pointsHelp: `${id}-points-help`,
    cta: `${id}-cta`,
    output: `${id}-output`,
  };

  useEffect(
    () => () => {
      window.clearTimeout(copyTimerRef.current);
      window.clearTimeout(revokeTimerRef.current);
    },
    []
  );

  const generateScript = () => {
    if (topic.trim().length < 3) {
      setError('Enter a video topic of at least a few words.');
      return;
    }
    setError(null);
    setScript(buildVideoScript({ topic, durationMin: duration, style, audience, keyPoints, callToAction }));
    track('generate');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video'}-script.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.clearTimeout(revokeTimerRef.current);
    revokeTimerRef.current = window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const pointCount = keyPoints.split('\n').filter((l) => l.trim()).length;

  return (
    <ToolWrapper
      toolId="ai-video-script"
      toolName="AI Video Script Generator"
      toolDescription="Generate professional video scripts for YouTube, TikTok, and other platforms"
      toolCategory="Content Creation"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl shrink-0">
              <IconWrapper icon={FaVideo} className="text-2xl text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Video Script Generator</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Timed script outlines for YouTube, Shorts, Reels and TikTok</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              <div>
                <label className={LABEL} htmlFor={ids.topic}>
                  Video topic <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <input
                  id={ids.topic}
                  type="text"
                  className={INPUT}
                  value={topic}
                  maxLength={MAX_TOPIC_LENGTH}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your video topic…"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? ids.topicError : undefined}
                />
                {error && (
                  <p id={ids.topicError} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="mt-3" role="group" aria-labelledby={ids.suggestions}>
                  <p id={ids.suggestions} className="sr-only">
                    Topic suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topicSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setTopic(suggestion);
                          setError(null);
                        }}
                        className="min-h-[36px] text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} htmlFor={ids.duration}>
                    Duration
                  </label>
                  <select
                    id={ids.duration}
                    className={INPUT}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value} className="bg-white dark:bg-gray-800">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL} htmlFor={ids.style}>
                    Video style
                  </label>
                  <select
                    id={ids.style}
                    className={INPUT}
                    value={style}
                    onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  >
                    {(Object.keys(STYLE_LABELS) as VideoStyle[]).map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-gray-800">
                        {STYLE_ICONS[s]} {STYLE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.audience}>
                  Target audience <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  id={ids.audience}
                  type="text"
                  className={INPUT}
                  value={audience}
                  maxLength={80}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. busy parents, first-time investors"
                />
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.points}>
                  Key points to cover <span className="font-normal text-gray-500 dark:text-gray-400">(optional, one per line)</span>
                </label>
                <textarea
                  id={ids.points}
                  className={`${INPUT} h-28 resize-y`}
                  value={keyPoints}
                  maxLength={1200}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder={'Wake up at the same time\nHydrate before coffee\nPlan the day in 5 minutes'}
                  aria-describedby={ids.pointsHelp}
                />
                <p id={ids.pointsHelp} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {pointCount > 0
                    ? `${Math.min(pointCount, MAX_KEY_POINTS)} section${pointCount === 1 ? '' : 's'}${pointCount > MAX_KEY_POINTS ? ` (max ${MAX_KEY_POINTS})` : ''}`
                    : 'Leave empty to get a suggested structure for the style.'}
                </p>
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.cta}>
                  Call to action <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  id={ids.cta}
                  type="text"
                  className={INPUT}
                  value={callToAction}
                  maxLength={160}
                  onChange={(e) => setCallToAction(e.target.value)}
                  placeholder="e.g. Download the free checklist in the description"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  onClick={generateScript}
                >
                  <IconWrapper icon={FaMagic} />
                  {script ? 'Regenerate Script' : 'Generate Script'}
                </button>
                <button
                  type="button"
                  className="min-h-[44px] min-w-[44px] px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/20 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  onClick={() => {
                    setTopic('');
                    setAudience('');
                    setKeyPoints('');
                    setCallToAction('');
                    setScript('');
                    setError(null);
                  }}
                  aria-label="Clear all fields and the script"
                  title="Clear all"
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={ids.output}>
                  Generated script {script && <span className="font-normal text-gray-500 dark:text-gray-400">(editable)</span>}
                </label>
                {script && (
                  <div className="flex gap-2">
                    <button type="button" onClick={copyToClipboard} className={SMALL_BUTTON}>
                      <IconWrapper icon={FaCopy} />
                      <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button type="button" onClick={downloadScript} className={SMALL_BUTTON}>
                      <IconWrapper icon={FaDownload} />
                      Download
                    </button>
                  </div>
                )}
              </div>
              <div aria-live="polite">
                <textarea
                  id={ids.output}
                  className={`${INPUT} h-[480px] lg:h-[640px] font-mono text-sm resize-y bg-gray-50 dark:bg-gray-800/60`}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  readOnly={!script}
                  placeholder="Your video script will appear here, with timings based on the duration you pick."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIVideoScriptGenerator;

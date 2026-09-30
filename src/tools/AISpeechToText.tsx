import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  describeRecognitionError,
  FATAL_RECOGNITION_ERRORS,
  getSpeechRecognition,
  type SpeechRecognitionLike,
} from './lib/aiSpeechToTextRecognition';

interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
}

type Status = 'idle' | 'starting' | 'listening' | 'paused';

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-PT', label: 'Portuguese' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
];

/** Chrome ends "continuous" sessions after a silence; we restart this many times in a row before giving up. */
const MAX_SILENT_RESTARTS = 5;

const BUTTON_BASE =
  'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const SECONDARY_BUTTON = `${BUTTON_BASE} bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20`;

const micErrorMessage = (err: unknown): string => {
  const name = err instanceof DOMException || err instanceof Error ? err.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'Microphone access was blocked. Allow microphone access for this site in your browser settings, then try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No microphone was found. Connect one and try again.';
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your microphone is being used by another app. Close it and try again.';
  }
  return 'Could not start the microphone. Check your microphone settings and try again.';
};

const AISpeechToText: React.FC = () => {
  const id = useId();
  const track = useToolTracking('ai-speech-to-text', 'AI Speech to Text');
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState<string | null>(null);

  // Feature detection runs once; Firefox has no SpeechRecognition at all.
  const [support] = useState(() => {
    if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' as const };
    if (!getSpeechRecognition()) return { ok: false, reason: 'unsupported' as const };
    if (!window.isSecureContext) return { ok: false, reason: 'insecure' as const };
    return { ok: true, reason: null };
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wantListeningRef = useRef(false);
  const silentRestartsRef = useRef(0);
  const trackedSessionRef = useRef(false);
  const mountedRef = useRef(true);
  const revokeTimersRef = useRef(new Set<number>());

  const ids = {
    language: `${id}-language`,
    transcript: `${id}-transcript`,
    stats: `${id}-stats`,
  };

  /** Stops every track of the microphone stream so the browser's recording indicator turns off. */
  const releaseMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const teardownRecognition = useCallback((mode: 'stop' | 'abort') => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    try {
      if (mode === 'abort') {
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onstart = null;
        recognition.abort();
      } else {
        recognition.stop();
      }
    } catch {
      // Already stopped.
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timers = revokeTimersRef.current;
    return () => {
      mountedRef.current = false;
      wantListeningRef.current = false;
      teardownRecognition('abort');
      releaseMicrophone();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [releaseMicrophone, teardownRecognition]);

  const beginSession = async (isResume: boolean) => {
    const Recognition = getSpeechRecognition();
    if (!Recognition || !support.ok) return;
    setError(null);
    setStatus('starting');

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Unavailable');
      releaseMicrophone();
      // Asking for the stream first gives a clear permission prompt and error; it is
      // stopped again on pause, stop, error and unmount.
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      releaseMicrophone();
      if (!mountedRef.current) return;
      setStatus(isResume ? 'paused' : 'idle');
      setError(micErrorMessage(err));
      return;
    }
    if (!mountedRef.current) {
      releaseMicrophone();
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      const newSegments: TranscriptSegment[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;
        if (result.isFinal) {
          const text = alternative.transcript.trim();
          if (text) {
            finalText += `${text} `;
            newSegments.push({ text, timestamp: Date.now(), confidence: alternative.confidence });
          }
        } else {
          interimText += alternative.transcript;
        }
      }
      setInterim(interimText);
      if (finalText) {
        silentRestartsRef.current = 0;
        setTranscript((prev) => `${prev}${prev && !/\s$/.test(prev) ? ' ' : ''}${finalText}`);
        setSegments((prev) => [...prev, ...newSegments]);
        if (!trackedSessionRef.current) {
          trackedSessionRef.current = true;
          track('convert');
        }
      }
    };

    recognition.onerror = (event) => {
      if (FATAL_RECOGNITION_ERRORS.has(event.error)) wantListeningRef.current = false;
      // "no-speech" is routine in continuous mode; onend restarts the session.
      if (event.error === 'no-speech' && wantListeningRef.current) return;
      const message = describeRecognitionError(event.error);
      if (message) setError(message);
    };

    recognition.onend = () => {
      setInterim('');
      if (recognitionRef.current !== recognition) return;
      if (wantListeningRef.current && silentRestartsRef.current < MAX_SILENT_RESTARTS) {
        silentRestartsRef.current += 1;
        try {
          recognition.start();
          return;
        } catch {
          // Fall through and stop cleanly.
        }
      }
      if (wantListeningRef.current) setError('Stopped listening after a long silence. Press Start to continue.');
      wantListeningRef.current = false;
      recognitionRef.current = null;
      releaseMicrophone();
      setStatus((s) => (s === 'paused' ? 'paused' : 'idle'));
    };

    recognitionRef.current = recognition;
    wantListeningRef.current = true;
    silentRestartsRef.current = 0;
    if (!isResume) trackedSessionRef.current = false;
    try {
      recognition.start();
    } catch {
      wantListeningRef.current = false;
      recognitionRef.current = null;
      releaseMicrophone();
      setStatus(isResume ? 'paused' : 'idle');
      setError('Speech recognition could not start. Please try again.');
    }
  };

  const pauseRecording = () => {
    wantListeningRef.current = false;
    setStatus('paused');
    teardownRecognition('stop');
    // Release the mic while paused so the recording indicator is honest.
    releaseMicrophone();
    setInterim('');
  };

  const stopRecording = () => {
    wantListeningRef.current = false;
    teardownRecognition('stop');
    releaseMicrophone();
    setInterim('');
    setStatus('idle');
  };

  const wordCount = useMemo(() => (transcript.trim() ? transcript.trim().split(/\s+/).length : 0), [transcript]);
  const averageConfidence = useMemo(() => {
    const scored = segments.filter((s) => s.confidence > 0);
    return scored.length ? Math.round((scored.reduce((sum, s) => sum + s.confidence, 0) / scored.length) * 100) : null;
  }, [segments]);

  const downloadFile = (content: string, type: string, ext: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking synchronously can cancel the download in some browsers.
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      revokeTimersRef.current.delete(timer);
    }, 5000);
    revokeTimersRef.current.add(timer);
  };

  const exportText = () => downloadFile(transcript.trim(), 'text/plain;charset=utf-8', 'txt');

  const exportJson = () => {
    const first = segments[0]?.timestamp;
    const last = segments[segments.length - 1]?.timestamp;
    downloadFile(
      JSON.stringify(
        {
          transcript: transcript.trim(),
          segments,
          metadata: {
            language,
            exportedAt: new Date().toISOString(),
            words: wordCount,
            durationMs: first && last ? last - first : 0,
          },
        },
        null,
        2
      ),
      'application/json',
      'json'
    );
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript.trim());
      toast.success('Transcript copied');
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setSegments([]);
    setInterim('');
  };

  const busy = status === 'listening' || status === 'starting';
  const hasText = transcript.trim().length > 0;

  return (
    <ToolWrapper
      toolId="ai-speech-to-text"
      toolName="AI Speech to Text"
      toolDescription="Convert your speech into text with real-time transcription"
      toolCategory="Text Tools"
    >
      <div className="relative max-w-4xl mx-auto space-y-6">
        {!support.ok && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
          >
            {support.reason === 'insecure'
              ? 'Speech recognition only works on a secure (https://) connection. Open this page over HTTPS to use it.'
              : 'Your browser doesn’t support live speech recognition (Firefox and some privacy-focused browsers don’t). Please open this page in Chrome, Edge or Safari. You can still type or paste text below.'}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl shadow-lg dark:shadow-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="sm:w-64">
              <label htmlFor={ids.language} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                id={ids.language}
                className="w-full min-h-[44px] p-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={busy}
              >
                {LANGUAGES.map(({ code, label }) => (
                  <option key={code} value={code} className="bg-white dark:bg-gray-800">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {status === 'idle' && (
                <button
                  type="button"
                  className={`${BUTTON_BASE} text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700`}
                  onClick={() => void beginSession(false)}
                  disabled={!support.ok}
                >
                  Start recording
                </button>
              )}
              {status === 'starting' && (
                <button type="button" className={`${BUTTON_BASE} text-white bg-purple-600`} disabled>
                  Starting…
                </button>
              )}
              {status === 'listening' && (
                <button type="button" className={`${BUTTON_BASE} text-white bg-amber-600 hover:bg-amber-700`} onClick={pauseRecording}>
                  Pause
                </button>
              )}
              {status === 'paused' && (
                <button
                  type="button"
                  className={`${BUTTON_BASE} text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700`}
                  onClick={() => void beginSession(true)}
                >
                  Resume
                </button>
              )}
              {status !== 'idle' && (
                <button type="button" className={`${BUTTON_BASE} text-white bg-red-600 hover:bg-red-700`} onClick={stopRecording}>
                  Stop
                </button>
              )}
            </div>
          </div>

          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
            {status === 'listening' && (
              <span className="relative flex h-3 w-3" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
            {status === 'listening'
              ? 'Listening… speak clearly into your microphone.'
              : status === 'paused'
                ? 'Paused. The microphone is off.'
                : status === 'starting'
                  ? 'Waiting for microphone permission…'
                  : support.ok
                    ? 'Press Start and allow microphone access.'
                    : ''}
          </p>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label htmlFor={ids.transcript} className="text-lg font-medium text-gray-900 dark:text-white">
                Transcript
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={SECONDARY_BUTTON} onClick={copyTranscript} disabled={!hasText}>
                  Copy
                </button>
                <button type="button" className={SECONDARY_BUTTON} onClick={exportText} disabled={!hasText}>
                  Download .txt
                </button>
                <button type="button" className={SECONDARY_BUTTON} onClick={exportJson} disabled={!hasText}>
                  .json
                </button>
                <button type="button" className={SECONDARY_BUTTON} onClick={clearTranscript} disabled={!hasText && !interim}>
                  Clear
                </button>
              </div>
            </div>
            <textarea
              id={ids.transcript}
              className="w-full h-64 p-3 rounded-xl font-mono text-sm resize-y bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your words will appear here as you speak. You can edit the text at any time."
              aria-describedby={ids.stats}
            />
            {interim && (
              <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400" aria-hidden="true">
                {interim}
              </p>
            )}
            <p id={ids.stats} className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {wordCount} words
              {averageConfidence !== null ? ` · average confidence ${averageConfidence}%` : ''}
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Recognition is done by your browser&rsquo;s speech service (in Chrome this sends audio to Google). Nothing is
            recorded or stored by Aivello.
          </p>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AISpeechToText;

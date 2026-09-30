import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaPause, FaPlay, FaStop, FaVolumeUp } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { splitForSpeech } from './lib/textStats';

const MAX_TEXT_LENGTH = 20000;

type Status = 'idle' | 'speaking' | 'paused';

const isSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

const sortVoices = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] =>
  [...voices].sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));

const ERROR_MESSAGES: Partial<Record<SpeechSynthesisErrorCode, string>> = {
  'not-allowed': 'Your browser blocked speech. Click Speak again to allow it.',
  'language-unavailable': 'The selected language is not available. Try another voice.',
  'voice-unavailable': 'The selected voice is not available. Try another voice.',
  network: 'This voice needs an internet connection. Check your connection or choose a local voice.',
  'synthesis-unavailable': 'Speech synthesis is not available right now.',
};

export default function TextToSpeech() {
  const supported = useMemo(isSupported, []);
  const [text, setText] = useState('');
  // Safari and Firefox return voices synchronously; Chrome fills them in via `voiceschanged`.
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    isSupported() ? sortVoices(window.speechSynthesis.getVoices()) : []
  );
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const track = useToolTracking('text-to-speech', 'Text to Speech');
  /** Bumped on every speak/stop so callbacks from cancelled utterances are ignored. */
  const sessionRef = useRef(0);

  const baseId = useId();
  const textId = `${baseId}-text`;
  const voiceId = `${baseId}-voice`;
  const rateId = `${baseId}-rate`;
  const pitchId = `${baseId}-pitch`;
  const volumeId = `${baseId}-volume`;

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const handleVoicesChanged = () => setVoices(sortVoices(synth.getVoices()));
    synth.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
      // Speech keeps playing after navigation unless cancelled.
      sessionRef.current += 1;
      synth.cancel();
    };
  }, [supported]);

  const selectedVoice = useMemo(() => {
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
    const lang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en-us';
    return (
      voices.find((v) => v.default && v.lang.toLowerCase().startsWith(lang.split('-')[0])) ??
      voices.find((v) => v.lang.toLowerCase() === lang) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.split('-')[0])) ??
      voices.find((v) => v.default) ??
      voices[0]
    );
  }, [voices, voiceURI]);

  const tooLong = text.length > MAX_TEXT_LENGTH;

  const speak = () => {
    if (!supported || !text.trim() || tooLong) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const session = ++sessionRef.current;
    const chunks = splitForSpeech(text);

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (session === sessionRef.current) setStatus('idle');
        };
      }
      utterance.onerror = (event) => {
        // "interrupted"/"canceled" are the expected result of Stop or a new Speak.
        if (session !== sessionRef.current || event.error === 'interrupted' || event.error === 'canceled') return;
        sessionRef.current += 1;
        synth.cancel();
        setStatus('idle');
        setError(ERROR_MESSAGES[event.error] ?? 'Speech failed. Try a different voice.');
      };
      synth.speak(utterance);
    });

    setError(null);
    setStatus('speaking');
    track('convert');
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setStatus('paused');
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setStatus('speaking');
  };

  const stop = () => {
    sessionRef.current += 1;
    window.speechSynthesis.cancel();
    setStatus('idle');
  };

  const inputClass =
    'w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
  const labelClass = 'block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2';
  const rangeClass = 'w-full h-2 rounded-lg cursor-pointer accent-purple-600 bg-gray-200 dark:bg-white/10';
  const secondaryButton =
    'flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <ToolWrapper
      toolId="text-to-speech"
      toolName="Text to Speech Converter"
      toolDescription="Convert any text to natural speech audio. Free online text-to-speech tool with multiple voices"
      toolCategory="Audio"
    >
      <div className="relative max-w-3xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaVolumeUp} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Text to Speech</h2>
          </div>

          {!supported ? (
            <p
              role="alert"
              className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200"
            >
              Your browser does not support speech synthesis. Try a recent version of Chrome, Edge, Safari or Firefox.
            </p>
          ) : (
            <>
              <label htmlFor={textId} className={labelClass}>
                Text to speak
              </label>
              <textarea
                id={textId}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-invalid={tooLong}
                className={`${inputClass} h-40 resize-y mb-1`}
                placeholder="Enter text to speak..."
              />
              <p
                className={`text-right text-xs mb-5 ${tooLong ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {tooLong ? 'Too long. ' : ''}
                {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
              </p>

              <div className="mb-5">
                <label htmlFor={voiceId} className={labelClass}>
                  Voice
                </label>
                <select
                  id={voiceId}
                  value={selectedVoice?.voiceURI ?? ''}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  disabled={voices.length === 0}
                  className={inputClass}
                >
                  {voices.length === 0 && (
                    <option value="" className="bg-white dark:bg-gray-800">
                      Loading voices… (browser default)
                    </option>
                  )}
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-white dark:bg-gray-800">
                      {v.name} ({v.lang}){v.localService ? '' : ' · online'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <label htmlFor={rateId} className={labelClass}>
                    Speed: <span className="font-bold text-purple-600 dark:text-purple-400">{rate.toFixed(1)}×</span>
                  </label>
                  <input
                    id={rateId}
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={rate}
                    aria-valuetext={`${rate.toFixed(1)} times`}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className={rangeClass}
                  />
                </div>
                <div>
                  <label htmlFor={pitchId} className={labelClass}>
                    Pitch: <span className="font-bold text-purple-600 dark:text-purple-400">{pitch.toFixed(1)}</span>
                  </label>
                  <input
                    id={pitchId}
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className={rangeClass}
                  />
                </div>
                <div>
                  <label htmlFor={volumeId} className={labelClass}>
                    Volume:{' '}
                    <span className="font-bold text-purple-600 dark:text-purple-400">{Math.round(volume * 100)}%</span>
                  </label>
                  <input
                    id={volumeId}
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    aria-valuetext={`${Math.round(volume * 100)} percent`}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={rangeClass}
                  />
                </div>
              </div>
              <p className="-mt-3 mb-5 text-xs text-gray-500 dark:text-gray-400">
                Speed, pitch and voice apply the next time you press Speak.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={speak}
                  disabled={!text.trim() || tooLong}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconWrapper icon={FaVolumeUp} />
                  {status === 'idle' ? 'Speak' : 'Restart'}
                </button>
                {status === 'paused' ? (
                  <button type="button" onClick={resume} className={secondaryButton}>
                    <IconWrapper icon={FaPlay} />
                    Resume
                  </button>
                ) : (
                  <button type="button" onClick={pause} disabled={status !== 'speaking'} className={secondaryButton}>
                    <IconWrapper icon={FaPause} />
                    Pause
                  </button>
                )}
                <button type="button" onClick={stop} disabled={status === 'idle'} className={secondaryButton}>
                  <IconWrapper icon={FaStop} />
                  Stop
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400" role="status">
                {status === 'speaking' ? 'Speaking…' : status === 'paused' ? 'Paused' : ''}
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                Uses your browser&apos;s built-in voices. Voices marked “online” send text to your browser vendor&apos;s
                speech service. Audio plays live and cannot be downloaded.
              </p>
            </>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}

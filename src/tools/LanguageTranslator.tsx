import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaLanguage, FaExchangeAlt, FaCopy, FaVolumeUp, FaMicrophone, FaStop } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  buildMyMemoryUrl,
  chunkForTranslation,
  countChunks,
  getLanguage,
  joinerFor,
  LANGUAGES,
  MAX_CHUNKS,
  MAX_TRANSLATE_CHARS,
  parseMyMemoryResponse,
  pickVoice,
  TranslationError,
} from './lib/languageTranslator';
import { describeRecognitionError, getSpeechRecognition, type SpeechRecognitionLike } from './lib/aiSpeechToTextRecognition';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_CACHE_ENTRIES = 200;

const COMMON_PHRASES = [
  'Hello, how are you?',
  'Thank you very much',
  'Where is the bathroom?',
  'How much does this cost?',
  'I need help',
  'Good morning',
  'Good night',
  'Excuse me',
  'I don’t understand',
  'Please speak slowly',
];

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';
const ICON_BUTTON =
  'min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const NEUTRAL_ICON_BUTTON = `${ICON_BUTTON} bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20`;

type SpeakingSide = 'source' | 'target' | null;

const errorMessageFor = (err: unknown): string => {
  if (err instanceof TranslationError) return err.message;
  return 'Something went wrong while translating. Please try again.';
};

export default function LanguageTranslator() {
  const id = useId();
  const track = useToolTracking('language-translator', 'Language Translator');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speaking, setSpeaking] = useState<SpeakingSide>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [speechInputSupported] = useState(() => getSpeechRecognition() !== null);
  const [speechOutputSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, string>());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speakTokenRef = useRef(0);

  const ids = {
    from: `${id}-from`,
    to: `${id}-to`,
    source: `${id}-source`,
    sourceHelp: `${id}-source-help`,
    target: `${id}-target`,
    error: `${id}-error`,
    phrases: `${id}-phrases`,
  };

  // Voices load asynchronously in Chrome; listen for the list to arrive.
  useEffect(() => {
    if (!speechOutputSupported) return undefined;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, [speechOutputSupported]);

  // Cancel in-flight requests and the microphone when leaving the page.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        try {
          recognition.abort();
        } catch {
          // Already stopped.
        }
      }
    },
    []
  );

  const translateChunk = useCallback(async (chunk: string, source: string, target: string, signal: AbortSignal): Promise<string> => {
    const cacheKey = `${source}|${target}|${chunk}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached !== undefined) return cached;

    const request = new AbortController();
    let timedOut = false;
    const onAbort = () => request.abort();
    signal.addEventListener('abort', onAbort);
    const timer = window.setTimeout(() => {
      timedOut = true;
      request.abort();
    }, REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(buildMyMemoryUrl(chunk, source, target), { signal: request.signal });
    } catch (err) {
      if (timedOut) throw new TranslationError('timeout', 'The translation service took too long to respond. Please try again.');
      if (signal.aborted) throw err;
      throw new TranslationError('network', 'Could not reach the translation service. Check your internet connection and try again.');
    } finally {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new TranslationError(
        response.status === 429 ? 'quota' : 'service',
        response.status === 429
          ? 'Too many translation requests right now. Please wait a minute and try again.'
          : `The translation service returned an unexpected response (HTTP ${response.status}). Please try again.`
      );
    }
    const text = parseMyMemoryResponse(data);
    if (cacheRef.current.size >= MAX_CACHE_ENTRIES) cacheRef.current.clear();
    cacheRef.current.set(cacheKey, text);
    return text;
  }, []);

  const translateText = async () => {
    const text = sourceText.trim();
    if (!text) {
      setError('Enter some text to translate.');
      return;
    }
    if (text.length > MAX_TRANSLATE_CHARS) {
      setError(`Text is too long. The free service allows up to ${MAX_TRANSLATE_CHARS.toLocaleString()} characters per translation.`);
      return;
    }
    if (sourceLang === targetLang) {
      setError('Choose two different languages.');
      return;
    }
    const paragraphs = chunkForTranslation(text);
    const total = countChunks(paragraphs);
    if (total > MAX_CHUNKS) {
      setError('This text has too many separate lines or sentences to translate at once. Please split it into smaller parts.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    setProgress({ done: 0, total });

    try {
      const output: string[] = [];
      let done = 0;
      for (const paragraph of paragraphs) {
        const pieces: string[] = [];
        // Sequential on purpose: the free API rate-limits bursts of parallel requests.
        for (const chunk of paragraph.chunks) {
          pieces.push(await translateChunk(chunk, sourceLang, targetLang, controller.signal));
          done += 1;
          if (abortRef.current === controller) setProgress({ done, total });
        }
        output.push(pieces.join(joinerFor(targetLang)) + paragraph.separator);
      }
      if (abortRef.current !== controller) return;
      setTranslatedText(output.join('').trim());
      track('convert');
    } catch (err) {
      if (abortRef.current !== controller) return; // Superseded by a newer request or unmounted.
      setError(errorMessageFor(err));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
        setProgress(null);
      }
    }
  };

  const swapLanguages = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setProgress(null);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Translation copied');
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const speakText = (text: string, langCode: string, side: Exclude<SpeakingSide, null>) => {
    if (!speechOutputSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking === side) {
      speakTokenRef.current += 1;
      setSpeaking(null);
      return;
    }
    const language = getLanguage(langCode);
    const voice = pickVoice(voices, language.speech);
    if (!voice && voices.length > 0) {
      toast(`No ${language.name} voice is installed on this device, so pronunciation may be wrong.`, { duration: 5000 });
    }
    // cancel() fires error/end events on the old utterances asynchronously; the token
    // stops those late events from resetting the state of the new playback.
    const token = ++speakTokenRef.current;
    const finish = () => {
      if (speakTokenRef.current === token) setSpeaking(null);
    };
    // Chrome cuts off long utterances, so speak sentence by sentence.
    const parts = chunkForTranslation(text, 200).flatMap((p) => p.chunks);
    parts.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = language.speech;
      if (voice) utterance.voice = voice;
      if (index === parts.length - 1) utterance.onend = finish;
      utterance.onerror = finish;
      synth.speak(utterance);
    });
    setSpeaking(parts.length > 0 ? side : null);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = getLanguage(sourceLang).speech;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const heard = Array.from({ length: event.results.length }, (_, i) => event.results[i][0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (heard) setSourceText((prev) => (prev.trim() ? `${prev.trimEnd()} ${heard}` : heard).slice(0, MAX_TRANSLATE_CHARS));
    };
    recognition.onerror = (event) => {
      const message = describeRecognitionError(event.error);
      if (message) setError(message);
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setError(null);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError('Voice input could not start. Please try again.');
    }
  };

  const sourceName = getLanguage(sourceLang).name;
  const targetName = getLanguage(targetLang).name;
  const nearLimit = sourceText.length > MAX_TRANSLATE_CHARS * 0.9;

  return (
    <ToolWrapper
      toolId="language-translator"
      toolName="Language Translator"
      toolDescription="Translate text between 20+ languages instantly. Perfect for travel, business, and learning new languages"
      toolCategory="Productivity"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLanguage} className="text-3xl text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Language Translator</h2>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-4 mb-6">
            <div>
              <label className={`${LABEL} mb-2`} htmlFor={ids.from}>
                From
              </label>
              <select id={ids.from} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className={INPUT}>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swapLanguages}
              className={`${ICON_BUTTON} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10`}
              title="Swap languages"
              aria-label="Swap source and target languages"
            >
              <IconWrapper icon={FaExchangeAlt} className="text-xl" />
            </button>
            <div>
              <label className={`${LABEL} mb-2`} htmlFor={ids.to}>
                To
              </label>
              <select id={ids.to} value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className={INPUT}>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className={LABEL} htmlFor={ids.source}>
                  {sourceName}
                </label>
                <div className="flex gap-2">
                  {speechInputSupported && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={
                        isListening
                          ? `${ICON_BUTTON} bg-red-600 text-white hover:bg-red-700`
                          : NEUTRAL_ICON_BUTTON
                      }
                      title={isListening ? 'Stop voice input' : `Speak in ${sourceName}`}
                      aria-label={isListening ? 'Stop voice input' : `Voice input in ${sourceName}`}
                      aria-pressed={isListening}
                    >
                      <IconWrapper icon={isListening ? FaStop : FaMicrophone} />
                    </button>
                  )}
                  {speechOutputSupported && sourceText.trim() && (
                    <button
                      type="button"
                      onClick={() => speakText(sourceText, sourceLang, 'source')}
                      className={NEUTRAL_ICON_BUTTON}
                      title={speaking === 'source' ? 'Stop' : 'Listen'}
                      aria-label={speaking === 'source' ? 'Stop reading source text' : `Listen to the ${sourceName} text`}
                    >
                      <IconWrapper icon={speaking === 'source' ? FaStop : FaVolumeUp} />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id={ids.source}
                value={sourceText}
                maxLength={MAX_TRANSLATE_CHARS}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void translateText();
                }}
                placeholder="Enter text to translate…"
                aria-describedby={ids.sourceHelp}
                className={`${INPUT} h-40 resize-y`}
              />
              <p
                id={ids.sourceHelp}
                className={`text-sm ${nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {sourceText.length.toLocaleString()}/{MAX_TRANSLATE_CHARS.toLocaleString()} characters · Ctrl+Enter to translate
                {isListening ? ' · Listening…' : ''}
              </p>
            </div>

            {/* Translated Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className={LABEL} htmlFor={ids.target}>
                  {targetName}
                </label>
                <div className="flex gap-2">
                  {translatedText && (
                    <>
                      {speechOutputSupported && (
                        <button
                          type="button"
                          onClick={() => speakText(translatedText, targetLang, 'target')}
                          className={NEUTRAL_ICON_BUTTON}
                          title={speaking === 'target' ? 'Stop' : 'Listen'}
                          aria-label={speaking === 'target' ? 'Stop reading translation' : `Listen to the ${targetName} translation`}
                        >
                          <IconWrapper icon={speaking === 'target' ? FaStop : FaVolumeUp} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(translatedText)}
                        className={`${ICON_BUTTON} bg-green-600 text-white hover:bg-green-700`}
                        title="Copy translation"
                        aria-label="Copy translation"
                      >
                        <IconWrapper icon={FaCopy} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div aria-live="polite">
                <textarea
                  id={ids.target}
                  value={translatedText}
                  readOnly
                  lang={getLanguage(targetLang).speech}
                  placeholder="Translation will appear here…"
                  className={`${INPUT} h-40 resize-y bg-gray-50 dark:bg-gray-800/60`}
                />
              </div>
            </div>
          </div>

          {error && (
            <p id={ids.error} role="alert" className="mt-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void translateText()}
            disabled={loading}
            className="w-full min-h-[44px] mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" aria-hidden="true" />
                {progress && progress.total > 1 ? `Translating part ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : 'Translating…'}
              </>
            ) : (
              <>
                <IconWrapper icon={FaLanguage} />
                Translate
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Translations are provided by the free MyMemory service (mymemory.translated.net): your text is sent to it. It has a
            daily limit, so very long texts may run out of quota.
          </p>

          {/* Common Phrases */}
          <div className="mt-8" role="group" aria-labelledby={ids.phrases}>
            <h3 id={ids.phrases} className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Common phrases
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {COMMON_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    setSourceText(phrase);
                    setError(null);
                  }}
                  className="min-h-[44px] p-2 text-sm bg-blue-50 dark:bg-white/5 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-white/10 rounded-xl hover:bg-blue-100 dark:hover:bg-white/10 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-white/5 dark:to-white/5 border border-blue-100 dark:border-white/10 rounded-xl">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Features</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-disc pl-5">
              <li>20 languages, including Hindi, Tamil and Telugu</li>
              <li>Voice input and read-aloud in the matching language (where your browser supports it)</li>
              <li>Long texts are translated sentence by sentence, keeping your line breaks</li>
              <li>Quick language swap for back-and-forth translation</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

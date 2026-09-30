/**
 * Minimal typings and feature detection for the Web Speech API's SpeechRecognition,
 * which TypeScript's DOM lib does not declare (it is prefixed in Chromium/Safari and
 * missing entirely in Firefox).
 */

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Errors after which retrying automatically would just fail again. */
export const FATAL_RECOGNITION_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported', 'bad-grammar']);

export const describeRecognitionError = (code: string): string | null => {
  switch (code) {
    case 'no-speech':
      return 'No speech was detected. Check your microphone and try speaking again.';
    case 'audio-capture':
      return 'No microphone was found, or it is being used by another app.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow microphone access for this site in your browser settings, then try again.';
    case 'network':
      return 'Speech recognition needs an internet connection in this browser. Check your connection and try again.';
    case 'language-not-supported':
      return 'This language isn’t supported by your browser’s speech recognition. Try another language.';
    case 'aborted':
      return null;
    default:
      return `Speech recognition stopped unexpectedly (${code}). Please try again.`;
  }
};

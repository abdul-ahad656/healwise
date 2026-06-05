import { NativeModules, Platform } from 'react-native';
import type { SpeechResultsEvent } from '@react-native-voice/voice';

export type VoiceModule = {
  onSpeechStart: (() => void) | null;
  onSpeechEnd: (() => void) | null;
  onSpeechResults: ((e: SpeechResultsEvent) => void) | null;
  onSpeechError: ((e: unknown) => void) | null;
  start: (locale: string) => Promise<void>;
  stop: () => Promise<void>;
  destroy: () => Promise<void>;
  removeAllListeners: () => void;
};

/** Android speech codes that mean “nothing heard” — not app failures. */
const BENIGN_SPEECH_ERROR_CODES = new Set(['5', '6', '7', '11']);

export function parseSpeechError(error: unknown): { code: string; message: string } {
  const nested = (error as { error?: { code?: string | number; message?: string } })?.error;
  return {
    code: nested?.code != null ? String(nested.code) : '',
    message: typeof nested?.message === 'string' ? nested.message : '',
  };
}

export function isBenignSpeechError(error: unknown): boolean {
  const { code } = parseSpeechError(error);
  return BENIGN_SPEECH_ERROR_CODES.has(code);
}

/**
 * Locale for @react-native-voice/voice.
 * Android often lacks ur-PK; en-US still yields roman Urdu (e.g. “Sar Dard”)
 * which the backend maps to English symptoms.
 */
export function getVoiceRecognitionLocale(appLanguage?: string): string {
  if (Platform.OS === 'android') {
    return 'en-US';
  }
  return appLanguage?.startsWith('ur') ? 'ur-PK' : 'en-US';
}

export function isVoicePlatformSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function isVoiceNativeLinked(): boolean {
  return (
    isVoicePlatformSupported() &&
    (NativeModules.RCTVoice != null || NativeModules.Voice != null)
  );
}

/** Lazy-load voice module so NativeEventEmitter is not initialized at app startup. */
export function getVoiceModule(): VoiceModule | null {
  if (!isVoiceNativeLinked()) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-voice/voice').default as VoiceModule;
}

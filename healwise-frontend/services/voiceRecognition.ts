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

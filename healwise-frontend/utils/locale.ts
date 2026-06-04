import i18n from '@/i18n';
import { I18nManager } from 'react-native';

/** Login, register, and other pre-auth screens always use English + LTR. */
export function applyEnglishLocale(): void {
  if (i18n.language !== 'en') {
    i18n.changeLanguage('en');
  }
  if (I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(false);
  }
}

/** Apply saved patient UI language (English or Urdu). Layout stays LTR. */
export function applyPatientLocale(language?: string | null): void {
  const lng = language === 'ur' ? 'ur' : 'en';
  i18n.changeLanguage(lng);
  // Urdu text only — do not mirror the UI (back button, tabs, chevrons stay left-to-right).
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(false);
}

/** Current app UI language for API translation (`lang=ur`). */
export function getAppLanguage(): 'en' | 'ur' {
  const lang = i18n.language || i18n.resolvedLanguage || 'en';
  return lang.toLowerCase().startsWith('ur') ? 'ur' : 'en';
}

export function isUrduLocale(): boolean {
  return getAppLanguage() === 'ur';
}

/** Append `lang=ur` when UI is Urdu (handles existing query string). */
export function withLangQuery(url: string): string {
  if (!isUrduLocale()) return url;
  return url.includes('?') ? `${url}&lang=ur` : `${url}?lang=ur`;
}

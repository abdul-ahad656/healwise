import i18n from '@/i18n';

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

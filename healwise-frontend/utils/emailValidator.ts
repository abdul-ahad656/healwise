/** Standard email: local@domain.tld (e.g. user@gmail.com) */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Common misspelled domains → correct provider domain */
const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gml.com': 'gmail.com',
  'gml.co': 'gmail.com',
  'gml.con': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmailcom.com': 'gmail.com',
  'googlemail.co': 'googlemail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'otlook.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outllook.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'live.co': 'live.com',
  'live.con': 'live.com',
};

/** Provider stem typos when TLD is missing or wrong (e.g. user@gml) */
const DOMAIN_STEM_TYPO_MAP: Record<string, string> = {
  gml: 'gmail.com',
  gmial: 'gmail.com',
  gmai: 'gmail.com',
  gamil: 'gmail.com',
  gnail: 'gmail.com',
  gmaill: 'gmail.com',
  outlok: 'outlook.com',
  outllok: 'outlook.com',
  otlook: 'outlook.com',
  outlool: 'outlook.com',
  outllook: 'outlook.com',
  hotmial: 'hotmail.com',
  hotmal: 'hotmail.com',
  yaho: 'yahoo.com',
  yahooo: 'yahoo.com',
  iclod: 'icloud.com',
};

const KNOWN_GOOD_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

function parseEmailParts(email: string): { local: string; domain: string } | null {
  const at = email.indexOf('@');
  if (at <= 0 || at === email.length - 1) return null;
  return {
    local: email.slice(0, at),
    domain: email.slice(at + 1).toLowerCase(),
  };
}

export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const parts = parseEmailParts(trimmed);
  if (!parts) return null;

  const { local, domain } = parts;

  if (KNOWN_GOOD_DOMAINS.has(domain)) {
    return null;
  }

  if (DOMAIN_TYPO_MAP[domain]) {
    return `${local}@${DOMAIN_TYPO_MAP[domain]}`;
  }

  const stem = domain.split('.')[0];
  const corrected = DOMAIN_STEM_TYPO_MAP[stem];
  if (corrected && domain !== corrected) {
    return `${local}@${corrected}`;
  }

  return null;
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'email_error_required' };
  }

  const normalized = trimmed.toLowerCase();
  const suggestion = suggestEmailCorrection(normalized);

  if (suggestion) {
    return {
      isValid: false,
      error: 'email_error_domain_typo',
      suggestion,
    };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return { isValid: false, error: 'email_error_invalid' };
  }

  return { isValid: true };
}

/** Standard email: local@domain.tld (e.g. user@gmail.com) */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'email_error_required' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'email_error_invalid' };
  }

  return { isValid: true };
}

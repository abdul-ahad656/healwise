export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  requirements: PasswordRequirements;
  errors: string[];
}

export function validatePassword(password: string): ValidationResult {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isValid = Object.values(requirements).every((req) => req === true);

  const errors = [];
  if (!requirements.minLength) errors.push("password_error_min_length");
  if (!requirements.hasUppercase) errors.push("password_error_uppercase");
  if (!requirements.hasLowercase) errors.push("password_error_lowercase");
  if (!requirements.hasNumber) errors.push("password_error_number");
  if (!requirements.hasSpecialChar) errors.push("password_error_special");

  return { isValid, requirements, errors };
}

export function validatePasswordMatch(
  pwd1: string,
  pwd2: string
): boolean {
  return pwd1 === pwd2 && pwd1.length > 0;
}

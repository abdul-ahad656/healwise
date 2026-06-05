import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EmailValidationResult } from '@/utils/emailValidator';

type Props = {
  email: string;
  validation: EmailValidationResult;
  onApplySuggestion: (email: string) => void;
};

export function EmailValidationHint({ email, validation, onApplySuggestion }: Props) {
  const { t } = useTranslation();

  if (email.length === 0 || validation.isValid || !validation.error) {
    return null;
  }

  return (
    <>
      <Text style={styles.fieldError}>
        {validation.suggestion
          ? t('email_error_domain_typo', { suggestion: validation.suggestion })
          : t(validation.error)}
      </Text>
      {validation.suggestion ? (
        <Pressable onPress={() => onApplySuggestion(validation.suggestion!)} hitSlop={8}>
          <Text style={styles.suggestionLink}>
            {t('email_use_suggestion', { suggestion: validation.suggestion })}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  suggestionLink: {
    marginTop: 4,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    lineHeight: 18,
  },
});

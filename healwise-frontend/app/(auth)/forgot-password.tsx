import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { EmailOtpVerification } from '@/components/auth/EmailOtpVerification';
import { resetPassword } from '@/services/authService';
import { useTranslation } from 'react-i18next';
import { validateEmail } from '@/utils/emailValidator';
import { EmailValidationHint } from '@/components/auth/EmailValidationHint';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidator';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const passwordMatches = validatePasswordMatch(password, confirmPassword);

  const canReset =
    !!verificationToken &&
    emailValidation.isValid &&
    passwordValidation.isValid &&
    passwordMatches;

  const handleReset = async () => {
    if (!canReset || !verificationToken) return;

    setLoading(true);
    try {
      await resetPassword(
        email.trim().toLowerCase(),
        password,
        verificationToken
      );
      Alert.alert(t('reset_success_title'), t('reset_success_message'), [
        {
          text: t('login'),
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('reset_failed');
      Alert.alert(t('otp_error_title'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <LinearGradient
        colors={['#22c55e', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <ArrowLeft size={22} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('forgot_password')}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.subtitle}>{t('forgot_password_subtitle')}</Text>

          <Text style={styles.label}>{t('email')}</Text>
          <View style={styles.field}>
            <View
              style={[
                styles.inputRow,
                email.length > 0 &&
                  !emailValidation.isValid &&
                  styles.inputRowError,
              ]}
            >
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setVerificationToken(null);
                }}
                placeholder={t('email_placeholder')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.textInput}
                editable={!verificationToken}
              />
            </View>
            {email.length > 0 ? (
              <EmailValidationHint
                email={email}
                validation={emailValidation}
                onApplySuggestion={(value) => {
                  setEmail(value);
                  setVerificationToken(null);
                }}
              />
            ) : null}
          </View>

          <EmailOtpVerification
            email={email}
            purpose="reset_password"
            emailEditable={false}
            onVerified={setVerificationToken}
          />

          {verificationToken ? (
            <>
              <Text style={styles.label}>{t('new_password')}</Text>
              <View style={styles.field}>
                <View
                  style={[
                    styles.inputRow,
                    password.length > 0 &&
                      !passwordValidation.isValid &&
                      styles.inputRowError,
                  ]}
                >
                  <View style={styles.iconSlot}>
                    <Lock size={16} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('password_register_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconSlot}
                    hitSlop={8}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6B7280" />
                    ) : (
                      <Eye size={18} color="#6B7280" />
                    )}
                  </Pressable>
                </View>
                {password.length > 0 && !passwordValidation.isValid ? (
                  <Text style={styles.fieldError}>
                    {t(passwordValidation.errors[0] || 'password_error_required')}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.label}>{t('confirm_password')}</Text>
              <View style={styles.field}>
                <View
                  style={[
                    styles.inputRow,
                    confirmPassword.length > 0 &&
                      !passwordMatches &&
                      styles.inputRowError,
                  ]}
                >
                  <View style={styles.iconSlot}>
                    <Lock size={16} color="#9CA3AF" />
                  </View>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('confirm_password_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.textInput}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.iconSlot}
                    hitSlop={8}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#6B7280" />
                    ) : (
                      <Eye size={18} color="#6B7280" />
                    )}
                  </Pressable>
                </View>
                {confirmPassword.length > 0 && !passwordMatches ? (
                  <Text style={styles.fieldError}>{t('password_error_mismatch')}</Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleReset}
                disabled={!canReset || loading}
                style={[
                  styles.submitButton,
                  (!canReset || loading) && { opacity: 0.5 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('reset_password_btn')}</Text>
                )}
              </Pressable>
            </>
          ) : null}
        </Card>

        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>{t('back_to_login')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  scroll: { flex: 1, paddingHorizontal: 24, marginTop: -16 },
  scrollContent: { paddingBottom: 40 },
  card: {
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  field: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  inputRowError: { borderColor: '#ef4444' },
  iconSlot: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  submitButton: {
    width: '100%',
    height: 50,
    marginTop: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 24 },
  backLinkText: { color: '#16a34a', fontWeight: '700', fontSize: 15 },
});

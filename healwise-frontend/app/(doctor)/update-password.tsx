import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { EmailOtpVerification } from '@/components/auth/EmailOtpVerification';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import AuthStore from '@/services/authStore';
import {
  updateProfilePassword,
  sendProfilePasswordOtp,
} from '@/services/authService';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidator';

export default function DoctorUpdatePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const user = AuthStore.getUser();
      setEmail(user?.email || '');
      setVerificationToken(null);
      setNewPassword('');
      setConfirmPassword('');
    }, [])
  );

  const passwordValidation = validatePassword(newPassword);
  const passwordMatches = validatePasswordMatch(newPassword, confirmPassword);
  const canUpdatePassword =
    !!verificationToken && passwordValidation.isValid && passwordMatches;

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword || !verificationToken) return;

    setSavingPassword(true);
    try {
      await updateProfilePassword(newPassword, verificationToken);
      setNewPassword('');
      setConfirmPassword('');
      setVerificationToken(null);
      Alert.alert(
        t('profile_password_saved_title'),
        t('profile_password_saved_message')
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('profile_error_update');
      Alert.alert(t('profile_error_title'), message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Update password"
        subtitle="Verify your email to set a new password"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile_password_title')}</Text>
          <Text style={styles.cardHint}>{t('profile_password_otp_hint')}</Text>

          <EmailOtpVerification
            email={email}
            purpose="change_password"
            emailEditable={false}
            customSendOtp={sendProfilePasswordOtp}
            onVerified={setVerificationToken}
          />

          {verificationToken ? (
            <>
              <Text style={styles.fieldLabel}>{t('profile_new_password')}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('password_register_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNewPassword}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowNewPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  {showNewPassword ? (
                    <EyeOff size={18} color="#6B7280" />
                  ) : (
                    <Eye size={18} color="#6B7280" />
                  )}
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>{t('confirm_password')}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('confirm_password')}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#6B7280" />
                  ) : (
                    <Eye size={18} color="#6B7280" />
                  )}
                </Pressable>
              </View>

              {newPassword.length > 0 && !passwordValidation.isValid ? (
                <Text style={styles.fieldError}>
                  {t(passwordValidation.errors[0] || 'password_error_required')}
                </Text>
              ) : null}

              {confirmPassword.length > 0 && !passwordMatches ? (
                <Text style={styles.fieldError}>{t('password_error_mismatch')}</Text>
              ) : null}

              <DoctorPrimaryButton
                label={
                  savingPassword ? t('profile_saving') : t('profile_update_password')
                }
                onPress={handleUpdatePassword}
                disabled={!canUpdatePassword || savingPassword}
                style={{ marginTop: 12 }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  cardHint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeBtn: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 4,
    lineHeight: 18,
  },
});

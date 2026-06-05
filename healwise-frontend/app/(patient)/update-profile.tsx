import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { EmailOtpVerification } from '@/components/auth/EmailOtpVerification';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import AuthStore from '@/services/authStore';
import {
  setLanguagePreference,
  updateProfileName,
  updateProfilePassword,
  sendProfilePasswordOtp,
} from '@/services/authService';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidator';

type Lang = 'en' | 'ur';

export default function UpdateProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [selected, setSelected] = useState<Lang>('en');
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const syncFromSession = useCallback(() => {
    const user = AuthStore.getUser();
    const currentName = user?.name || '';
    setEmail(user?.email || '');
    setName(currentName);
    setSavedName(currentName);
    const lng: Lang = user?.language === 'ur' || i18n.language?.startsWith('ur') ? 'ur' : 'en';
    setSelected(lng);
  }, [i18n.language]);

  useFocusEffect(
    useCallback(() => {
      syncFromSession();
    }, [syncFromSession])
  );

  useEffect(() => {
    const lng: Lang = i18n.language?.startsWith('ur') ? 'ur' : 'en';
    setSelected(lng);
  }, [i18n.language]);

  const passwordValidation = validatePassword(newPassword);
  const passwordMatches = validatePasswordMatch(newPassword, confirmPassword);
  const canUpdatePassword =
    !!verificationToken &&
    passwordValidation.isValid &&
    passwordMatches;

  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    try {
      await setLanguagePreference(selected);
      Alert.alert(t('profile_saved_title'), t('profile_saved_message'));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('profile_error_language');
      Alert.alert(t('profile_error_title'), message);
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('profile_error_title'), t('profile_name_required'));
      return;
    }

    setSavingName(true);
    try {
      const updated = await updateProfileName(trimmed);
      setName(updated.name);
      setSavedName(updated.name);
      Alert.alert(t('profile_saved_title'), t('profile_name_saved_message'));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('profile_error_update');
      Alert.alert(t('profile_error_title'), message);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword || !verificationToken) return;

    setSavingPassword(true);
    try {
      await updateProfilePassword(newPassword, verificationToken);
      setNewPassword('');
      setConfirmPassword('');
      setVerificationToken(null);
      Alert.alert(t('profile_password_saved_title'), t('profile_password_saved_message'));
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

      <PatientScreenHeader
        title={t('profile_edit_title')}
        subtitle={t('profile_edit_subtitle')}
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
          <Text style={styles.cardTitle}>{t('profile_account_title')}</Text>

          <Text style={styles.fieldLabel}>{t('full_name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('full_name_placeholder')}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
          />

          <PatientPrimaryButton
            label={savingName ? t('profile_saving') : t('profile_save_name')}
            onPress={handleSaveName}
            disabled={savingName || !name.trim() || name.trim() === savedName.trim()}
            variant="primary"
            style={{ marginTop: 12 }}
          />
        </View>

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

              <PatientPrimaryButton
                label={
                  savingPassword
                    ? t('profile_saving')
                    : t('profile_update_password')
                }
                onPress={handleUpdatePassword}
                disabled={!canUpdatePassword || savingPassword}
                variant="primary"
                style={{ marginTop: 12 }}
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile_language_title')}</Text>

          <Pressable
            onPress={() => setSelected('en')}
            style={[styles.radioRow, selected === 'en' && styles.radioRowActive]}
          >
            <View
              style={[
                styles.radioOuter,
                selected === 'en' && styles.radioOuterActive,
              ]}
            >
              {selected === 'en' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>{t('profile_language_english')}</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelected('ur')}
            style={[styles.radioRow, selected === 'ur' && styles.radioRowActive]}
          >
            <View
              style={[
                styles.radioOuter,
                selected === 'ur' && styles.radioOuterActive,
              ]}
            >
              {selected === 'ur' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>{t('profile_language_urdu')}</Text>
          </Pressable>

          <PatientPrimaryButton
            label={savingLanguage ? t('profile_saving') : t('profile_save_language')}
            onPress={handleSaveLanguage}
            disabled={savingLanguage}
            variant="primary"
            style={{ marginTop: 12 }}
          />
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
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  radioRowActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#3b82f6' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  radioText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
});

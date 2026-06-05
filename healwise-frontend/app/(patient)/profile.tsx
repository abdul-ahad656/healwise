import React, { useEffect, useMemo, useState } from 'react';
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
import { Thermometer, Pill, Calendar, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = AuthStore.getUser();

  const initialLang: Lang = (user?.language === 'ur' ? 'ur' : 'en') as Lang;
  const [selected, setSelected] = useState<Lang>(initialLang);
  const [savingLanguage, setSavingLanguage] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const lng: Lang = i18n.language?.startsWith('ur') ? 'ur' : 'en';
    setSelected(lng);
  }, [i18n.language]);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const email = useMemo(() => user?.email || '', [user]);
  const passwordValidation = validatePassword(newPassword);
  const passwordMatches = validatePasswordMatch(newPassword, confirmPassword);
  const canUpdatePassword =
    !!verificationToken &&
    passwordValidation.isValid &&
    passwordMatches;

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
  };

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
    if (!name.trim()) {
      Alert.alert(t('profile_error_title'), t('profile_name_required'));
      return;
    }

    setSavingName(true);
    try {
      await updateProfileName(name.trim());
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
        title={t('profile_title')}
        subtitle={t('profile_subtitle')}
        onBack={() => router.navigate('/(patient)/home' as Href)}
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
          />

          <PatientPrimaryButton
            label={savingName ? t('profile_saving') : t('profile_save_name')}
            onPress={handleSaveName}
            disabled={savingName || !name.trim()}
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

        <Text style={styles.sectionLabel}>{t('profile_activity_section')}</Text>

        <Pressable
          onPress={() => router.push('/(patient)/symptom-history' as Href)}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
            <Thermometer size={22} color="#ef4444" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {t('profile_symptom_history_title')}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              {t('profile_symptom_history_subtitle')}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(patient)/medicine-history' as Href)}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
            <Pill size={22} color="#3b82f6" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {t('profile_medicine_history_title')}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              {t('profile_medicine_history_subtitle')}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(patient)/appointment-history' as Href)}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#ecfeff' }]}>
            <Calendar size={22} color="#0891b2" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {t('profile_appointment_history_title')}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              {t('profile_appointment_history_subtitle')}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t('profile_logout')}</Text>
        </Pressable>
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingRight: 8,
  },
  chevronWrap: {
    flexShrink: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
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
  logoutBtn: {
    backgroundColor: '#fee2e2',
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
    marginTop: 12,
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '800',
  },
});

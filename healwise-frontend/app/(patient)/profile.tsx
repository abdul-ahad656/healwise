import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Thermometer, Pill, Calendar, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import AuthStore from '@/services/authStore';
import { setLanguagePreference } from '@/services/authService';

type Lang = 'en' | 'ur';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = AuthStore.getUser();

  const initialLang: Lang = (user?.language === 'ur' ? 'ur' : 'en') as Lang;
  const [selected, setSelected] = useState<Lang>(initialLang);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const lng: Lang = i18n.language?.startsWith('ur') ? 'ur' : 'en';
    setSelected(lng);
  }, [i18n.language]);

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
  };

  const handleSaveLanguage = async () => {
    setSaving(true);
    try {
      await setLanguagePreference(selected);
      Alert.alert(t('profile_saved_title'), t('profile_saved_message'));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('profile_error_language');
      Alert.alert(t('profile_error_title'), message);
    } finally {
      setSaving(false);
    }
  };

  const name = useMemo(
    () => user?.name || t('profile_user_fallback'),
    [user, t]
  );
  const email = useMemo(() => user?.email || '', [user]);

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
      >
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

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
            label={saving ? t('profile_saving') : t('profile_save_language')}
            onPress={handleSaveLanguage}
            disabled={saving}
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
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
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

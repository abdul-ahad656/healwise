import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Thermometer,
  Pill,
  Calendar,
  ChevronRight,
  UserPen,
  Banknote,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import AuthStore from '@/services/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useFocusEffect(
    useCallback(() => {
      const user = AuthStore.getUser();
      setDisplayName(user?.name?.trim() || t('profile_user_fallback'));
      setEmail(user?.email || '');
    }, [t])
  );

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
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
      >
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{displayName}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Pressable
          onPress={() => router.push('/(patient)/update-profile' as Href)}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
            <UserPen size={22} color="#2563eb" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {t('profile_update_profile')}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              {t('profile_update_profile_subtitle')}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(patient)/refunds' as Href)}
          style={({ pressed }) => [
            styles.menuRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
            <Banknote size={22} color="#d97706" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {t('refunds_title')}
            </Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>
              {t('refunds_subtitle')}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </Pressable>

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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
    marginTop: 8,
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

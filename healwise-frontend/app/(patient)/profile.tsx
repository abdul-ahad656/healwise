import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import AuthStore from '@/services/authStore';
import { setLanguagePreference } from '@/services/authService';

type Lang = 'en' | 'ur';

export default function ProfileScreen() {
  const router = useRouter();
  const user = AuthStore.getUser();

  const initialLang: Lang = (user?.language === 'ur' ? 'ur' : 'en') as Lang;
  const [selected, setSelected] = useState<Lang>(initialLang);
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    AuthStore.clear();
    router.replace('/(auth)/login');
  };

  const handleSaveLanguage = async () => {
    setSaving(true);
    try {
      await setLanguagePreference(selected);
      Alert.alert('Saved', 'Language preference updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update language');
    } finally {
      setSaving(false);
    }
  };

  const name = useMemo(() => user?.name || 'User', [user]);
  const email = useMemo(() => user?.email || '', [user]);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader title="Profile" subtitle="Account settings" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Language</Text>

          <Pressable
            onPress={() => setSelected('en')}
            style={[styles.radioRow, selected === 'en' && styles.radioRowActive]}
          >
            <View style={[styles.radioOuter, selected === 'en' && styles.radioOuterActive]}>
              {selected === 'en' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>English</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelected('ur')}
            style={[styles.radioRow, selected === 'ur' && styles.radioRowActive]}
          >
            <View style={[styles.radioOuter, selected === 'ur' && styles.radioOuterActive]}>
              {selected === 'ur' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Urdu</Text>
          </Pressable>

          <PatientPrimaryButton
            label={saving ? 'Saving...' : 'Save language'}
            onPress={handleSaveLanguage}
            disabled={saving}
            variant="primary"
            style={{ marginTop: 8 }}
          />
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
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
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '800',
  },
});

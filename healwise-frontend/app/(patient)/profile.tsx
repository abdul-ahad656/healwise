import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>{name}{email ? ` · ${email}` : ''}</Text>

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

        <Pressable
          onPress={handleSaveLanguage}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 6, marginBottom: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
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
  radioRowActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
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
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6' },
  radioText: { fontSize: 14, color: '#111827', fontWeight: '700' },
  saveBtn: {
    marginTop: 4,
    backgroundColor: '#111827',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  logoutBtn: {
    marginTop: 18,
    backgroundColor: '#fee2e2',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#b91c1c', fontSize: 14, fontWeight: '800' },
});

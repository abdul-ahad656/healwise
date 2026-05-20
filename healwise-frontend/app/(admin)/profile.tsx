import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminScreenHeader } from '@/components/admin/AdminScreenHeader';
import { adminScreenStyles as s } from '@/styles/adminScreen';
import AuthStore from '@/services/authStore';
import { setLanguagePreference } from '@/services/authService';

type Lang = 'en' | 'ur';

export default function AdminProfileScreen() {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update language';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const name = useMemo(() => user?.name || 'Admin', [user]);
  const email = useMemo(() => user?.email || '', [user]);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <AdminScreenHeader
        title="Profile"
        subtitle="Admin account settings"
      />

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

          <Pressable
            onPress={handleSaveLanguage}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save language'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
  radioRowActive: { borderColor: '#0f766e', backgroundColor: '#ecfdf5' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#0f766e' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f766e' },
  radioText: { fontSize: 14, color: '#111827', fontWeight: '700' },
  saveBtn: {
    marginTop: 4,
    backgroundColor: '#0f766e',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  logoutBtn: {
    marginTop: 8,
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

import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { setLanguagePreference } from '@/services/authService';

type Lang = 'en' | 'ur';

export default function LanguagePreferenceScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const nextRoute = useMemo(() => {
    if (typeof next === 'string' && next.startsWith('/')) return next;
    return '/(patient)/home';
  }, [next]);

  const [selected, setSelected] = useState<Lang>('en');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      await setLanguagePreference(selected);
      router.replace(nextRoute as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save language');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22c55e', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Language Preference</Text>
        <Text style={styles.headerSubtitle}>Choose the language for your app</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>What language would you prefer?</Text>

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
          onPress={handleContinue}
          disabled={saving}
          style={[styles.button, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Continue'}</Text>
        </Pressable>
      </View>
    </View>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#ffffff', opacity: 0.9, marginTop: 6 },
  card: {
    marginTop: -18,
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
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
  radioText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  button: {
    marginTop: 6,
    backgroundColor: '#2563eb',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});


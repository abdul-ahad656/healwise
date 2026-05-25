import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Thermometer, Pill, ChevronRight } from 'lucide-react-native';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import AuthStore from '@/services/authStore';
import { setLanguagePreference } from '@/services/authService';
import { getSymptomHistory, SymptomHistoryEntry } from '@/services/symptomService';
import {
  getMedicineHistory,
  MedicineHistoryEntry,
} from '@/services/medicineService';

type Lang = 'en' | 'ur';

function formatWhen(dateString?: string) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = AuthStore.getUser();

  const initialLang: Lang = (user?.language === 'ur' ? 'ur' : 'en') as Lang;
  const [selected, setSelected] = useState<Lang>(initialLang);
  const [saving, setSaving] = useState(false);

  const [symptomHistory, setSymptomHistory] = useState<SymptomHistoryEntry[]>([]);
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryError(null);
      const [symptoms, medicines] = await Promise.all([
        getSymptomHistory(),
        getMedicineHistory(),
      ]);
      setSymptomHistory(symptoms);
      setMedicineHistory(medicines);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load history';
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setHistoryLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  const onHistoryRefresh = () => {
    setHistoryRefreshing(true);
    loadHistory();
  };

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
      const message =
        err instanceof Error ? err.message : 'Failed to update language';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const name = useMemo(() => user?.name || 'User', [user]);
  const email = useMemo(() => user?.email || '', [user]);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader title="Profile" subtitle="Account & activity history" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={historyRefreshing}
            onRefresh={onHistoryRefresh}
          />
        }
      >
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Language</Text>

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
            <Text style={styles.radioText}>English</Text>
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
            <Text style={styles.radioText}>Urdu</Text>
          </Pressable>

          <PatientPrimaryButton
            label={saving ? 'Saving…' : 'Save language'}
            onPress={handleSaveLanguage}
            disabled={saving}
            variant="primary"
            style={{ marginTop: 12 }}
          />
        </View>

        {historyError ? (
          <Text style={s.errorText}>{historyError}</Text>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Thermometer size={20} color="#ef4444" />
            <Text style={styles.cardTitle}>Symptom analysis history</Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#2563eb" style={{ marginVertical: 12 }} />
          ) : symptomHistory.length === 0 ? (
            <Text style={styles.emptyHistory}>
              No symptom checks yet. Use the symptom checker from Home.
            </Text>
          ) : (
            symptomHistory.slice(0, 10).map((item) => (
              <View key={item._id} style={styles.historyItem}>
                <Text style={styles.historyMain} numberOfLines={2}>
                  {item.aiPrediction}
                </Text>
                <Text style={styles.historyMeta}>
                  {Math.round((item.confidence ?? 0) * 100)}% confidence ·{' '}
                  {formatWhen(item.createdAt)}
                </Text>
                {item.text ? (
                  <Text style={styles.historySub} numberOfLines={2}>
                    {item.text}
                  </Text>
                ) : null}
              </View>
            ))
          )}

          <Pressable
            onPress={() => router.push('/(patient)/symptom-checker')}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.linkText}>New symptom check</Text>
            <ChevronRight size={18} color="#2563eb" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Pill size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Medicine comparison history</Text>
          </View>

          {historyLoading ? (
            <ActivityIndicator color="#2563eb" style={{ marginVertical: 12 }} />
          ) : medicineHistory.length === 0 ? (
            <Text style={styles.emptyHistory}>
              No comparisons yet. Compare medicines from Home.
            </Text>
          ) : (
            medicineHistory.slice(0, 10).map((item) => (
              <View key={item._id} style={styles.historyItem}>
                <Text style={styles.historyMain} numberOfLines={1}>
                  {item.query || item.result?.input_medicine || 'Comparison'}
                </Text>
                <Text style={styles.historyMeta}>
                  Salt: {item.result?.salt || '—'} ·{' '}
                  {item.result?.alternatives?.length ?? 0} alternatives ·{' '}
                  {formatWhen(item.createdAt)}
                </Text>
              </View>
            ))
          )}

          <Pressable
            onPress={() => router.push('/(patient)/medicine-compare')}
            style={({ pressed }) => [
              styles.linkRow,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.linkText}>Compare medicines</Text>
            <ChevronRight size={18} color="#2563eb" />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
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
  emptyHistory: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  historySub: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
    marginTop: 4,
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '800',
  },
});

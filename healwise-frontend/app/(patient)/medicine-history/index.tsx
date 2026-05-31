import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight, Pill } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  getMedicineHistory,
  MedicineHistoryEntry,
} from '@/services/medicineService';
import { setSelectedMedicineEntry } from '@/services/historySelectionStore';

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

export default function MedicineHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MedicineHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await getMedicineHistory();
      setItems(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  const openDetail = (item: MedicineHistoryEntry) => {
    setSelectedMedicineEntry(item);
    router.push({
      pathname: '/(patient)/medicine-history/detail',
    } as Href);
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title="Medicine comparison history"
        subtitle="Tap a record to view full results"
        colors={['#3b82f6', '#06b6d4']}
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.tabListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadHistory();
          }} />
        }
      >
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Pill size={40} color="#93c5fd" />
            <Text style={styles.emptyTitle}>No comparisons yet</Text>
            <Text style={styles.emptyBody}>
              Compare medicines from Home to see your history here.
            </Text>
            <PatientPrimaryButton
              label="Compare medicines"
              onPress={() => router.push('/(patient)/medicine-compare')}
              variant="primary"
              style={{ marginTop: 16, alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item._id}
              onPress={() => openDetail(item)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.query || item.result?.input_medicine || 'Comparison'}
                    </Text>
                    <Text style={styles.meta}>
                      Salt: {item.result?.salt || '—'} ·{' '}
                      {item.result?.alternatives?.length ?? 0} alternatives ·{' '}
                      {formatWhen(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.chevronWrap}>
                    <ChevronRight size={20} color="#9ca3af" />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  chevronWrap: {
    flexShrink: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

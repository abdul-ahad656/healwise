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
import { ChevronRight, Thermometer } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { getSymptomHistory, SymptomHistoryEntry } from '@/services/symptomService';
import { setSelectedSymptomEntry } from '@/services/historySelectionStore';

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

export default function SymptomHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SymptomHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await getSymptomHistory();
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

  const openDetail = (item: SymptomHistoryEntry) => {
    setSelectedSymptomEntry(item);
    router.push({
      pathname: '/(patient)/symptom-history/detail',
    } as Href);
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title="Symptom analysis history"
        subtitle="Tap a record to view full results"
        colors={['#ef4444', '#f97316']}
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
          <ActivityIndicator color="#ef4444" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Thermometer size={40} color="#fca5a5" />
            <Text style={styles.emptyTitle}>No symptom checks yet</Text>
            <Text style={styles.emptyBody}>
              Run a symptom check from Home to see your analysis history here.
            </Text>
            <PatientPrimaryButton
              label="New symptom check"
              onPress={() => router.push('/(patient)/symptom-checker')}
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
                    <Text style={styles.title} numberOfLines={2}>
                      {item.aiPrediction}
                    </Text>
                    <Text style={styles.meta}>
                      {Math.round((item.confidence ?? 0) * 100)}% confidence ·{' '}
                      {formatWhen(item.createdAt)}
                    </Text>
                    {item.text ? (
                      <Text style={styles.preview} numberOfLines={2}>
                        {item.text}
                      </Text>
                    ) : null}
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
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
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

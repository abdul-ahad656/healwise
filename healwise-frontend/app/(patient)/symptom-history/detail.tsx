import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AlertCircle, Activity } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { getSymptomHistory, SymptomHistoryEntry } from '@/services/symptomService';
import {
  clearSelectedSymptomEntry,
  peekSelectedSymptomEntry,
} from '@/services/historySelectionStore';

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

export default function SymptomHistoryDetailScreen() {
  const router = useRouter();
  const initialEntry = peekSelectedSymptomEntry();
  const [entry, setEntry] = useState<SymptomHistoryEntry | null>(initialEntry);
  const [loading, setLoading] = useState(!initialEntry);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    const selected = peekSelectedSymptomEntry();
    if (selected) {
      setEntry(selected);
      setError(null);
      setLoading(false);
      return;
    }

    if (entry) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const history = await getSymptomHistory();
      if (history.length > 0) {
        setEntry(history[0]);
      } else {
        setError('Result not found.');
        setEntry(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load result';
      setError(message);
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [entry]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEntry();
    }, [loadEntry])
  );

  useEffect(() => {
    return () => clearSelectedSymptomEntry();
  }, []);

  if (loading) {
    return (
      <View style={s.container}>
        <View style={[StyleSheet.absoluteFill, s.pageBg]} />
        <PatientScreenHeader
          title="Analysis result"
          onBack={() => router.back()}
          colors={['#ef4444', '#f97316']}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      </View>
    );
  }

  if (!entry || error) {
    return (
      <View style={s.container}>
        <View style={[StyleSheet.absoluteFill, s.pageBg]} />
        <PatientScreenHeader
          title="Analysis result"
          onBack={() => router.back()}
          colors={['#ef4444', '#f97316']}
        />
        <View style={styles.centered}>
          <Text style={s.errorText}>{error ?? 'Result not found.'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const confidencePercentage = Math.round((entry.confidence ?? 0) * 100);

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title="Analysis result"
        subtitle={formatWhen(entry.createdAt)}
        colors={['#ef4444', '#f97316']}
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.tabListContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Activity size={32} color="#ef4444" />
          </View>

          <Text style={styles.labelTitle}>Predicted condition</Text>
          <Text style={styles.conditionName}>{entry.aiPrediction}</Text>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{confidencePercentage}%</Text>
            </View>
          </View>

          <View style={styles.disclaimerBox}>
            <AlertCircle size={16} color="#b91c1c" />
            <Text style={styles.disclaimerText}>
              This is an AI-assisted analysis, not a medical diagnosis. Consult a
              doctor for proper evaluation.
            </Text>
          </View>
        </Card>

        {entry.text ? (
          <Card style={styles.symptomsCard}>
            <Text style={styles.sectionTitle}>Symptoms reported</Text>
            <Text style={styles.symptomsText}>{entry.text}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backLink: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  mainCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  labelTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  conditionName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  confidenceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  confidenceText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    width: '100%',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 18,
  },
  symptomsCard: {
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  symptomsText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});

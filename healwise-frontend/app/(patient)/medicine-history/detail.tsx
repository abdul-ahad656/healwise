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
import { DollarSign, Info, Star } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  getMedicineHistory,
  MedicineHistoryEntry,
} from '@/services/medicineService';
import {
  clearSelectedMedicineEntry,
  peekSelectedMedicineEntry,
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

export default function MedicineHistoryDetailScreen() {
  const router = useRouter();
  const initialEntry = peekSelectedMedicineEntry();
  const [entry, setEntry] = useState<MedicineHistoryEntry | null>(initialEntry);
  const [loading, setLoading] = useState(!initialEntry);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    const selected = peekSelectedMedicineEntry();
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
      const history = await getMedicineHistory();
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
    return () => clearSelectedMedicineEntry();
  }, []);

  if (loading) {
    return (
      <View style={s.container}>
        <View style={[StyleSheet.absoluteFill, s.pageBg]} />
        <PatientScreenHeader
          title="Comparison result"
          onBack={() => router.back()}
          colors={['#3b82f6', '#06b6d4']}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    );
  }

  if (!entry || error) {
    return (
      <View style={s.container}>
        <View style={[StyleSheet.absoluteFill, s.pageBg]} />
        <PatientScreenHeader
          title="Comparison result"
          onBack={() => router.back()}
          colors={['#3b82f6', '#06b6d4']}
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

  const result = entry.result ?? {
    input_medicine: entry.query,
    input_strength: undefined,
    salt: '',
    alternatives: [],
  };
  const medicineName =
    result.input_medicine || entry.query || 'Medicine comparison';
  const strengthLabel =
    result.input_strength ||
    (entry as { strength?: string }).strength;

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title={medicineName}
        subtitle={formatWhen(entry.createdAt)}
        colors={['#3b82f6', '#06b6d4']}
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.tabListContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.saltCard}>
          <View style={styles.saltHeader}>
            <Info size={16} color="#0369a1" />
            <Text style={styles.saltLabel}>Active salt</Text>
          </View>
          <Text style={styles.saltName}>{result.salt}</Text>
          {strengthLabel ? (
            <Text style={styles.strengthHint}>Compared at: {strengthLabel}</Text>
          ) : null}
        </View>

        <View style={styles.listHeader}>
          <DollarSign size={20} color="#16a34a" />
          <Text style={styles.listTitle}>Alternative brands</Text>
        </View>

        {result.alternatives?.length ? (
          result.alternatives.map((med, index) => {
            const isAffordable = index === 0;
            return (
              <Card
                key={`${med.name}-${index}`}
                style={[
                  styles.medCard,
                  isAffordable ? styles.affordableCard : styles.standardCard,
                ]}
              >
                <View style={styles.medHeader}>
                  <View style={styles.medBrandRow}>
                    <Text style={styles.brandName}>{med.name}</Text>
                    {isAffordable ? (
                      <View style={styles.badge}>
                        <Star size={10} color="white" fill="white" />
                        <Text style={styles.badgeText}>Best price</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.priceText}>PKR {med.price}</Text>
                </View>
                <Text style={styles.manufacturerText}>
                  Manufacturer: {med.manufacturer}
                </Text>
                <Text style={styles.manufacturerText}>
                  Strength: {med.strength}
                </Text>
              </Card>
            );
          })
        ) : (
          <Text style={styles.noAlternatives}>No alternatives were found.</Text>
        )}
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
  saltCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 20,
  },
  saltHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  saltLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  saltName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#075985',
  },
  strengthHint: {
    fontSize: 13,
    color: '#0369a1',
    marginTop: 6,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  medCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  standardCard: {
    borderColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  affordableCard: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  medBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  badge: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  manufacturerText: {
    fontSize: 13,
    color: '#6b7280',
  },
  noAlternatives: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

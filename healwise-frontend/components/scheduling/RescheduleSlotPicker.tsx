import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { getDoctorAvailability } from '@/services/doctorService';
import { getMyAvailability } from '@/services/doctorPanelService';
import type { DoctorAvailabilityDay } from '@/services/doctorPanelService';

const formatDayLabel = (day: string) => {
  const date = new Date(day);
  if (Number.isNaN(date.getTime())) return day;
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${day}`;
};

type Props = {
  doctorId: string;
  /** Doctor panel: load own availability; patient: load by doctor id */
  forDoctor?: boolean;
  selectedDay: string | null;
  selectedSlot: string | null;
  onDayChange: (day: string) => void;
  onSlotChange: (slot: string) => void;
};

export function RescheduleSlotPicker({
  doctorId,
  forDoctor = false,
  selectedDay,
  selectedSlot,
  onDayChange,
  onSlotChange,
}: Props) {
  const [availability, setAvailability] = useState<DoctorAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = forDoctor
          ? await getMyAvailability()
          : await getDoctorAvailability(doctorId);
        if (cancelled) return;
        setAvailability(data);
        if (data.length > 0 && !selectedDay && !selectedSlot) {
          onDayChange(data[0].day);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load availability'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, forDoctor]);

  const selectedDayData = useMemo(
    () => availability.find((a) => a.day === selectedDay),
    [availability, selectedDay]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.hint}>Loading available slots…</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (availability.length === 0) {
    return (
      <Text style={styles.hint}>
        No open slots on this doctor&apos;s schedule. Try again later.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Pick a new day</Text>
      <View style={styles.chipsRow}>
        {availability.map((day) => {
          const active = selectedDay === day.day;
          return (
            <Pressable
              key={day._id || day.day}
              onPress={() => {
                onDayChange(day.day);
                onSlotChange('');
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {formatDayLabel(day.day)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Pick a new time</Text>
      {selectedDayData && selectedDayData.slots.length > 0 ? (
        <Card style={styles.slotsCard}>
          <View style={styles.slotsHeader}>
            <Clock size={16} color="#2563eb" />
            <Text style={styles.slotsHeaderText}>
              {formatDayLabel(selectedDayData.day)}
            </Text>
          </View>
          <View style={styles.slotsGrid}>
            {selectedDayData.slots.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => onSlotChange(slot)}
                  style={[styles.slotChip, active && styles.slotChipActive]}
                >
                  <Text
                    style={[
                      styles.slotChipText,
                      active && styles.slotChipTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : (
        <Text style={styles.hint}>No free slots on this day.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  center: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  error: { fontSize: 13, color: '#b91c1c', lineHeight: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  chipTextActive: { color: '#1d4ed8' },
  slotsCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  slotsHeaderText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  slotChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  slotChipTextActive: { color: '#15803d' },
});

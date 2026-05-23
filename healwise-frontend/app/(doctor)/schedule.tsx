import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import {
  doctorScreenStyles as s,
  PLACEHOLDER_COLOR,
} from '@/styles/doctorScreen';
import {
  getMyAvailability,
  setMyAvailability,
  deleteMyAvailabilityDay,
  DoctorAvailabilityDay,
} from '@/services/doctorPanelService';

const formatDayLabel = (day: string) => {
  const date = new Date(day);
  if (Number.isNaN(date.getTime())) return day;
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${day}`;
};

export default function DoctorSchedule() {
  const router = useRouter();
  const [availability, setAvailability] = useState<DoctorAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayInput, setDayInput] = useState('');
  const [slotInput, setSlotInput] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getMyAvailability();
      const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day));
      setAvailability(sorted);
      setSelectedDay(sorted[0]?.day ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const selected = useMemo(
    () => availability.find((a) => a.day === selectedDay) || null,
    [availability, selectedDay]
  );

  const upsertLocalDay = (day: string) => {
    const trimmed = day.trim();
    if (!trimmed) return;
    setAvailability((prev) => {
      const exists = prev.some((d) => d.day === trimmed);
      if (exists) return prev;
      return [...prev, { _id: trimmed, doctorId: 'me', day: trimmed, slots: [] }].sort(
        (a, b) => a.day.localeCompare(b.day)
      );
    });
    setSelectedDay(trimmed);
  };

  const addSlotLocal = (slot: string) => {
    const value = slot.trim();
    if (!value || !selectedDay) return;
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== selectedDay) return d;
        if (d.slots.includes(value)) return d;
        return { ...d, slots: [...d.slots, value].sort() };
      })
    );
  };

  const removeSlotLocal = (slot: string) => {
    if (!selectedDay) return;
    setAvailability((prev) =>
      prev.map((d) =>
        d.day === selectedDay ? { ...d, slots: d.slots.filter((x) => x !== slot) } : d
      )
    );
  };

  const saveSelectedDay = async () => {
    if (!selectedDay) return;
    const dayData = availability.find((d) => d.day === selectedDay);
    if (!dayData) return;
    setSaving(true);
    setError(null);
    try {
      await setMyAvailability(dayData.day, dayData.slots);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedDay = async () => {
    if (!selectedDay) return;
    setSaving(true);
    setError(null);
    try {
      await deleteMyAvailabilityDay(selectedDay);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete day');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Manage Schedule"
        subtitle="Set days and time ranges patients can book"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <Text style={s.infoText}>Loading schedule...</Text>
        ) : null}
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <Card style={s.formCard}>
          <Text style={s.sectionTitle}>Add / select day</Text>
          <Text style={s.fieldLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={dayInput}
            onChangeText={setDayInput}
            placeholder="2026-05-20"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={[s.input, { marginBottom: 12 }]}
          />
          <DoctorPrimaryButton
            label="Add day"
            variant="primary"
            onPress={() => {
              upsertLocalDay(dayInput);
              setDayInput('');
            }}
          />

          {availability.length === 0 ? (
            <Text style={[s.infoText, { marginTop: 12 }]}>No days added yet.</Text>
          ) : (
            <View style={local.chipsRow}>
              {availability.map((d) => {
                const active = selectedDay === d.day;
                return (
                  <Pressable
                    key={d.day}
                    onPress={() => setSelectedDay(d.day)}
                    style={[local.chip, active && local.chipActive]}
                  >
                    <Text style={[local.chipText, active && local.chipTextActive]}>
                      {formatDayLabel(d.day)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        <Card style={s.formCard}>
          <Text style={s.sectionTitle}>Time slots</Text>
          {!selected ? (
            <Text style={s.infoText}>Select a day to manage slots.</Text>
          ) : (
            <>
              <Text style={s.fieldLabel}>Time range</Text>
              <TextInput
                value={slotInput}
                onChangeText={setSlotInput}
                placeholder="10:30 - 13:00"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[s.input, { marginBottom: 12 }]}
              />
              <DoctorPrimaryButton
                label="Add slot"
                variant="outline"
                onPress={() => {
                  addSlotLocal(slotInput);
                  setSlotInput('');
                }}
              />

              {selected.slots.length === 0 ? (
                <Text style={[s.infoText, { marginTop: 12 }]}>No slots for this day.</Text>
              ) : (
                <View style={local.slotsGrid}>
                  {selected.slots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => removeSlotLocal(slot)}
                      style={({ pressed }) => [
                        local.slotChip,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={local.slotChipText}>{slot}</Text>
                      <Text style={local.slotChipHint}>Tap to remove</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <DoctorPrimaryButton
                  label={saving ? 'Saving...' : 'Save selected day'}
                  variant="primary"
                  onPress={saveSelectedDay}
                  disabled={saving}
                />
                <DoctorPrimaryButton
                  label="Delete day"
                  variant="danger"
                  onPress={deleteSelectedDay}
                  disabled={saving}
                  style={{ marginTop: 10 }}
                />
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#1d4ed8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: {
    color: '#1e3a8a',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3730a3',
  },
  slotChipHint: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});

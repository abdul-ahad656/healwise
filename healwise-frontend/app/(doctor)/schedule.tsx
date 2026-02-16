import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  getMyAvailability,
  setMyAvailability,
  deleteMyAvailabilityDay,
  DoctorAvailabilityDay,
} from '@/services/doctorPanelService';
import { LinearGradient } from 'expo-linear-gradient';

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
      return [...prev, { _id: trimmed, doctorId: 'me', day: trimmed, slots: [] }].sort((a, b) =>
        a.day.localeCompare(b.day)
      );
    });
    setSelectedDay(trimmed);
  };

  const addSlotLocal = (slot: string) => {
    const s = slot.trim();
    if (!s || !selectedDay) return;

    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== selectedDay) return d;
        if (d.slots.includes(s)) return d;
        return { ...d, slots: [...d.slots, s].sort() };
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
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#1d4ed8', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Manage Schedule</Text>
              <Text style={styles.headerSubtitle}>
                Set days and time ranges patients can book
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.infoText}>Loading schedule...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add / Select Day</Text>
          <View style={styles.row}>
            <TextInput
              value={dayInput}
              onChangeText={setDayInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Pressable
              onPress={() => {
                upsertLocalDay(dayInput);
                setDayInput('');
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Add</Text>
            </Pressable>
          </View>

          {availability.length === 0 ? (
            <Text style={styles.infoText}>No days added yet.</Text>
          ) : (
            <View style={styles.chipsRow}>
              {availability.map((d) => (
                <Pressable
                  key={d.day}
                  onPress={() => setSelectedDay(d.day)}
                  style={[
                    styles.chip,
                    selectedDay === d.day && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedDay === d.day && styles.chipTextActive,
                    ]}
                  >
                    {formatDayLabel(d.day)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Time Slots</Text>
          {!selected ? (
            <Text style={styles.infoText}>Select a day to manage slots.</Text>
          ) : (
            <>
              <View style={styles.row}>
                <TextInput
                  value={slotInput}
                  onChangeText={setSlotInput}
                  placeholder="HH:MM - HH:MM (e.g. 10:30 - 13:00)"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => {
                    addSlotLocal(slotInput);
                    setSlotInput('');
                  }}
                  style={({ pressed }) => [
                    styles.outlineBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.outlineBtnText}>Add Slot</Text>
                </Pressable>
              </View>

              {selected.slots.length === 0 ? (
                <Text style={styles.infoText}>No slots for this day.</Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {selected.slots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => removeSlotLocal(slot)}
                      style={({ pressed }) => [
                        styles.slotChip,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={styles.slotChipText}>{slot}</Text>
                      <Text style={styles.slotChipHint}>Remove</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                onPress={saveSelectedDay}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { opacity: saving ? 0.6 : pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Selected Day'}
                </Text>
              </Pressable>

              <Pressable
                onPress={deleteSelectedDay}
                disabled={saving}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { opacity: saving ? 0.6 : pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.deleteBtnText}>Delete Day</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  scroll: { flex: 1, marginTop: -16 },
  scrollContent: { paddingBottom: 32, paddingHorizontal: 20 },
  infoText: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  outlineBtnText: { color: '#3b82f6', fontSize: 13, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  slotChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  slotChipText: { fontSize: 12, fontWeight: '700', color: '#3730a3' },
  slotChipHint: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  saveBtn: {
    marginTop: 12,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    marginTop: 8,
    backgroundColor: '#b91c1c',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});


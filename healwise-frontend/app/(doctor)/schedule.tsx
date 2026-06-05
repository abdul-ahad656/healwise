import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import {
  getMyAvailability,
  setMyAvailability,
  deleteMyAvailabilityDay,
  DoctorAvailabilityDay,
} from '@/services/doctorPanelService';
import {
  buildSlotFromStartTime,
  clampSlotStartTime,
  filterFutureSlots,
  formatTimeLabel,
  formatYmd,
  isPastDay,
  isPastSlot,
  SLOT_DURATION_MINUTES,
  startOfToday,
} from '@/utils/scheduleValidation';

const showScheduleAlert = (title: string, message: string) => {
  Alert.alert(title, message);
};

const formatDayLabel = (day: string) => {
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return day;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  if (Number.isNaN(date.getTime())) return day;
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${day}`;
};

const defaultSlotStartTime = () => clampSlotStartTime(new Date());

export default function DoctorSchedule() {
  const router = useRouter();
  const [availability, setAvailability] = useState<DoctorAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState(startOfToday);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slotStartTime, setSlotStartTime] = useState(defaultSlotStartTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  const minDate = useMemo(() => startOfToday(), []);

  const applyAvailability = useCallback((days: DoctorAvailabilityDay[]) => {
    const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
    setAvailability(sorted);
    setSelectedDay((current) => {
      if (current && sorted.some((d) => d.day === current)) return current;
      return sorted[0]?.day ?? null;
    });
  }, []);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getMyAvailability();
      applyAvailability(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTick((tick) => tick + 1);
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (nowTick === 0) return;
    getMyAvailability()
      .then(applyAvailability)
      .catch(() => {});
  }, [nowTick, applyAvailability]);

  useEffect(() => {
    setAvailability((prev) => {
      let changed = false;
      const next = prev
        .filter((entry) => {
          if (isPastDay(entry.day)) {
            changed = true;
            return false;
          }
          return true;
        })
        .map((entry) => {
          const futureSlots = filterFutureSlots(entry.day, entry.slots);
          if (futureSlots.length !== entry.slots.length) {
            changed = true;
          }
          return { ...entry, slots: futureSlots };
        })
        .filter((entry) => {
          if (entry.slots.length === 0) {
            changed = true;
            return false;
          }
          return true;
        });

      if (!changed) return prev;

      setSelectedDay((current) => {
        if (current && next.some((d) => d.day === current)) return current;
        return next[0]?.day ?? null;
      });
      return next;
    });
  }, [nowTick]);

  const selected = useMemo(
    () => availability.find((a) => a.day === selectedDay) || null,
    [availability, selectedDay]
  );

  const visibleSlots = useMemo(() => {
    if (!selected) return [];
    return filterFutureSlots(selected.day, selected.slots);
  }, [selected, nowTick]);

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

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (!date) return;
    setPickedDate(date);
    setError(null);
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (!date) return;
    setSlotStartTime(clampSlotStartTime(date));
    setError(null);
  };

  const saveSelectedDay = async () => {
    if (!selectedDay) return;
    const dayData = availability.find((d) => d.day === selectedDay);
    if (!dayData) return;
    const futureSlots = filterFutureSlots(dayData.day, dayData.slots);
    if (futureSlots.length === 0) {
      showScheduleAlert(
        'No future slots',
        'All slots for this day are in the past. Add a future slot or delete the day.'
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setMyAvailability(dayData.day, futureSlots);
      await refresh();
    } catch (err: any) {
      const message = err.message || 'Failed to save schedule';
      setError(message);
      showScheduleAlert('Could not save', message);
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

  const previewSlot = buildSlotFromStartTime(slotStartTime);

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
          <Text style={s.fieldLabel}>Date</Text>
          <Pressable
            onPress={() => {
              setError(null);
              setShowDatePicker(true);
            }}
            style={({ pressed }) => [local.pickerField, pressed && local.pickerFieldPressed]}
          >
            <Text style={local.pickerValue}>{formatYmd(pickedDate)}</Text>
            <Text style={local.pickerHint}>Tap to open calendar</Text>
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={pickedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={minDate}
              onChange={onDateChange}
            />
          ) : null}

          {Platform.OS === 'ios' && showDatePicker ? (
            <DoctorPrimaryButton
              label="Done"
              variant="outline"
              onPress={() => setShowDatePicker(false)}
              style={{ marginTop: 8 }}
            />
          ) : null}

          <DoctorPrimaryButton
            label="Add day"
            variant="primary"
            onPress={() => {
              const day = formatYmd(pickedDate);
              setError(null);
              upsertLocalDay(day);
            }}
            style={{ marginTop: 12 }}
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
                    onPress={() => {
                      setSelectedDay(d.day);
                      setError(null);
                    }}
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
              <Text style={s.fieldLabel}>
                Start time ({SLOT_DURATION_MINUTES}-minute slots)
              </Text>
              <Pressable
                onPress={() => {
                  setError(null);
                  setShowTimePicker(true);
                }}
                style={({ pressed }) => [local.pickerField, pressed && local.pickerFieldPressed]}
              >
                <Text style={local.pickerValue}>{formatTimeLabel(slotStartTime)}</Text>
                <Text style={local.pickerHint}>
                  {previewSlot
                    ? `Slot: ${previewSlot}`
                    : 'Latest slot: 23:00 – 23:30'}
                </Text>
              </Pressable>

              {showTimePicker ? (
                <DateTimePicker
                  value={slotStartTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour
                  minuteInterval={SLOT_DURATION_MINUTES}
                  onChange={onTimeChange}
                />
              ) : null}

              {Platform.OS === 'ios' && showTimePicker ? (
                <DoctorPrimaryButton
                  label="Done"
                  variant="outline"
                  onPress={() => setShowTimePicker(false)}
                  style={{ marginTop: 8 }}
                />
              ) : null}

              <DoctorPrimaryButton
                label="Add slot"
                variant="outline"
                onPress={() => {
                  if (!selectedDay) return;
                  setError(null);
                  const slot = buildSlotFromStartTime(slotStartTime);
                  if (!slot) {
                    showScheduleAlert(
                      'Invalid time',
                      'Choose a start time on a 30-minute mark. The latest slot is 23:00–23:30.'
                    );
                    return;
                  }
                  if (isPastSlot(selectedDay, slot)) {
                    showScheduleAlert(
                      'Past time',
                      'This time has already passed. Choose a future slot.'
                    );
                    return;
                  }
                  if (selected.slots.includes(slot)) {
                    showScheduleAlert('Duplicate slot', 'This slot is already added.');
                    return;
                  }
                  addSlotLocal(slot);
                }}
                style={{ marginTop: 12 }}
              />

              {visibleSlots.length === 0 ? (
                <Text style={[s.infoText, { marginTop: 12 }]}>No slots for this day.</Text>
              ) : (
                <View style={local.slotsGrid}>
                  {visibleSlots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        removeSlotLocal(slot);
                        setError(null);
                      }}
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
  pickerField: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  pickerFieldPressed: {
    backgroundColor: '#f9fafb',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pickerHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
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

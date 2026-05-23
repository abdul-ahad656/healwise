import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  getDoctorAvailability,
  DoctorAvailabilityDay,
} from '@/services/doctorService';

const formatDayLabel = (day: string) => {
  const date = new Date(day);
  if (Number.isNaN(date.getTime())) return day;
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${day}`;
};

export default function DoctorBooking() {
  const router = useRouter();
  const { doctorId, doctorName, symptomId } = useLocalSearchParams<{
    doctorId?: string;
    doctorName?: string;
    symptomId?: string;
  }>();

  const [availability, setAvailability] = useState<DoctorAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setError('Doctor not specified');
      setLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      try {
        const data = await getDoctorAvailability(doctorId as string);
        setAvailability(data);
        if (data.length > 0) {
          setSelectedDay(data[0].day);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [doctorId]);

  const selectedDayData = useMemo(
    () => availability.find((a) => a.day === selectedDay),
    [availability, selectedDay]
  );

  const handleBook = () => {
    if (!doctorId || !selectedDay || !selectedSlot) {
      setError('Please select a day and time slot');
      return;
    }

    setError(null);
    router.push({
      pathname: '/(patient)/payment',
      params: {
        doctorId,
        doctorName,
        appointmentDate: selectedDay,
        appointmentTime: selectedSlot,
        symptomId,
      },
    });
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title="Select slot"
        subtitle={doctorName || 'Doctor'}
        onBack={() => router.back()}
        colors={['#a855f7', '#ec4899']}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={s.infoText}>Loading availability...</Text>
        ) : error && !selectedDayData ? (
          <Text style={s.errorText}>{error}</Text>
        ) : availability.length === 0 ? (
          <Text style={s.infoText}>No availability set for this doctor.</Text>
        ) : (
          <>
            <Text style={s.sectionTitle}>Available days</Text>
            <View style={local.chipsRow}>
              {availability.map((day) => {
                const active = selectedDay === day.day;
                return (
                  <Pressable
                    key={day._id}
                    onPress={() => {
                      setSelectedDay(day.day);
                      setSelectedSlot(null);
                    }}
                    style={[local.chip, active && local.chipActive]}
                  >
                    <Text style={[local.chipText, active && local.chipTextActive]}>
                      {formatDayLabel(day.day)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[s.sectionTitle, { marginTop: 20 }]}>Available slots</Text>
            {selectedDayData && selectedDayData.slots.length > 0 ? (
              <Card style={local.slotsCard}>
                <View style={local.slotsHeader}>
                  <Clock size={16} color="#6b21a8" />
                  <Text style={local.slotsHeaderText}>
                    {formatDayLabel(selectedDayData.day)}
                  </Text>
                </View>
                <View style={local.slotsGrid}>
                  {selectedDayData.slots.map((slot) => {
                    const active = selectedSlot === slot;
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => setSelectedSlot(slot)}
                        style={[local.slotChip, active && local.slotChipActive]}
                      >
                        <Text
                          style={[
                            local.slotChipText,
                            active && local.slotChipTextActive,
                          ]}
                        >
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {error ? <Text style={s.errorText}>{error}</Text> : null}

                <PatientPrimaryButton
                  label="Continue to payment"
                  variant="accent"
                  onPress={handleBook}
                  disabled={!selectedSlot}
                  style={{ marginTop: 16 }}
                />
              </Card>
            ) : (
              <Text style={s.infoText}>
                No time slots available for the selected day.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    backgroundColor: '#f3e8ff',
    borderColor: '#9333ea',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: {
    color: '#6b21a8',
  },
  slotsCard: {
    padding: 18,
    borderRadius: 16,
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  slotsHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#c4b5fd',
  },
  slotChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#6b21a8',
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5b21b6',
  },
  slotChipTextActive: {
    color: '#ffffff',
  },
});

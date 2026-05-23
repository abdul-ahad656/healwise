import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getDoctorAvailability,
  DoctorAvailabilityDay,
  bookAppointment,
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
  const [booking, setBooking] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleBook = async () => {
    if (!doctorId || !selectedDay || !selectedSlot) {
      setError('Please select a day and time slot');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    // Navigate to payment screen (payment initiates appointment booking)
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#a855f7', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Select Slot</Text>
              <Text style={styles.headerSubtitle}>
                {doctorName || 'Doctor'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.infoText}>Loading availability...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : availability.length === 0 ? (
          <Text style={styles.infoText}>No availability set for this doctor.</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Available Days</Text>
            <View style={styles.daysRow}>
              {availability.map((day) => (
                <Pressable
                  key={day._id}
                  onPress={() => setSelectedDay(day.day)}
                  style={[
                    styles.dayChip,
                    selectedDay === day.day && styles.dayChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDay === day.day && styles.dayChipTextActive,
                    ]}
                  >
                    {formatDayLabel(day.day)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Available Slots</Text>
            {selectedDayData && selectedDayData.slots.length > 0 ? (
              <Card style={styles.slotsCard}>
                <View style={styles.slotsHeader}>
                  <Clock size={14} color="#4b5563" />
                  <Text style={styles.slotsHeaderText}>
                    {formatDayLabel(selectedDayData.day)}
                  </Text>
                </View>
                <View style={styles.slotsGrid}>
                  {selectedDayData.slots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotChip,
                        selectedSlot === slot && styles.slotChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          selectedSlot === slot && styles.slotChipTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button
                  title={booking ? 'Booking...' : 'Book Appointment'}
                  onPress={handleBook}
                  disabled={!selectedSlot || booking}
                  style={styles.bookButton}
                />
                {successMessage && (
                  <Text style={styles.successText}>{successMessage}</Text>
                )}
              </Card>
            ) : (
              <Text style={styles.infoText}>
                No time slots available for the selected day.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'white', opacity: 0.8 },
  scrollView: { flex: 1, marginTop: -20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  infoText: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 12 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  dayChipActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  dayChipText: { fontSize: 12, color: '#374151' },
  dayChipTextActive: { color: '#ffffff', fontWeight: '600' },
  slotsCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
  },
  slotsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  slotsHeaderText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  slotChipActive: {
    backgroundColor: '#a855f7',
  },
  slotChipText: { fontSize: 12, color: '#3730a3', fontWeight: '600' },
  slotChipTextActive: { color: '#ffffff' },
  bookButton: {
    marginTop: 16,
    borderRadius: 999,
  },
  successText: {
    marginTop: 8,
    fontSize: 13,
    color: '#15803d',
  },
});


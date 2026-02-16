import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { getDoctorAppointments, Appointment } from '@/services/doctorPanelService';

export default function PatientsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments();
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

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
              <Text style={styles.headerTitle}>My Patients</Text>
              <Text style={styles.headerSubtitle}>Appointments assigned to you</Text>
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
          <Text style={styles.infoText}>Loading patients...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.infoText}>No patients yet.</Text>
        ) : (
          appointments.map((a) => (
            <Card key={a._id} style={styles.patientCard}>
              <Text style={styles.patientTitle}>
                Patient: {a.patientId}
              </Text>
              <Text style={styles.patientMeta}>
                {a.appointmentDate} · {a.appointmentTime} · {a.status}
              </Text>
            </Card>
          ))
        )}
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
  scroll: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  infoText: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 12 },
  patientCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  patientTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  patientMeta: { fontSize: 12, color: '#4b5563', marginTop: 2 },
});

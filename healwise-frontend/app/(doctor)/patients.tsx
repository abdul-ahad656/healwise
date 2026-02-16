import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { getDoctorAppointments, Appointment } from '@/services/doctorPanelService';

export default function PatientsScreen() {
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
      <Text style={styles.title}>My Patients</Text>
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
            <View key={a._id} style={styles.patientCard}>
              <Text style={styles.patientTitle}>
                Patient: {a.patientId}
              </Text>
              <Text style={styles.patientMeta}>
                {a.appointmentDate} · {a.appointmentTime} · {a.status}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingBottom: 32 },
  infoText: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 12 },
  patientCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  patientTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  patientMeta: { fontSize: 12, color: '#4b5563', marginTop: 2 },
});

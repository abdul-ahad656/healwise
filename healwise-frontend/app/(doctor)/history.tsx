import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  Appointment,
} from '@/services/doctorPanelService';

export default function HistoryScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStatusChange = async (
    appointmentId: string,
    status: Appointment['status']
  ) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update appointment');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.infoText}>Loading appointments...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.infoText}>No appointments yet.</Text>
        ) : (
          appointments.map((a) => (
            <View key={a._id} style={styles.appointmentCard}>
              <Text style={styles.appointmentTitle}>
                {a.appointmentDate} · {a.appointmentTime}
              </Text>
              <Text style={styles.appointmentMeta}>
                Patient: {a.patientId}
              </Text>
              <Text style={styles.appointmentMeta}>Status: {a.status}</Text>

              {a.status === 'pending' && (
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleStatusChange(a._id, 'accepted')}
                  >
                    <Text style={styles.actionText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleStatusChange(a._id, 'rejected')}
                  >
                    <Text style={styles.actionText}>Reject</Text>
                  </Pressable>
                </View>
              )}
              {a.status === 'accepted' && (
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionBtn, styles.completeBtn]}
                    onPress={() => handleStatusChange(a._id, 'completed')}
                  >
                    <Text style={styles.actionText}>Mark completed</Text>
                  </Pressable>
                </View>
              )}
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
  appointmentCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appointmentTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  appointmentMeta: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#ef4444' },
  completeBtn: { backgroundColor: '#3b82f6' },
  actionText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  getDoctorAppointments,
  Appointment,
} from '@/services/doctorPanelService';

export default function DoctorDashboard() {
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
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const pending = appointments.filter((a) => a.status === 'pending');
  const upcoming = appointments.filter((a) =>
    ['pending', 'accepted'].includes(a.status)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>

      <View style={styles.linksRow}>
        <Link href="/(doctor)/patients" asChild>
          <Text style={styles.linkText}>My Patients</Text>
        </Link>
        <Link href={'/(doctor)/schedule' as any} asChild>
          <Text style={styles.linkText}>Manage Schedule</Text>
        </Link>
        <Link href="/(doctor)/teleconsult" asChild>
          <Text style={styles.linkText}>Teleconsult</Text>
        </Link>
        <Link href="/(doctor)/upload-prescription" asChild>
          <Text style={styles.linkText}>Upload Rx</Text>
        </Link>
        <Link href="/(doctor)/history" asChild>
          <Text style={styles.linkText}>History</Text>
        </Link>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appointments</Text>
          <Link href="/(doctor)/history" asChild>
            <Text style={styles.linkText}>View all</Text>
          </Link>
        </View>

        {loading ? (
          <Text style={styles.infoText}>Loading appointments...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.infoText}>No appointments yet.</Text>
        ) : (
          appointments.slice(0, 5).map((a) => (
            <Pressable
              key={a._id}
              style={styles.appointmentCard}
              onPress={() => {
                // Could navigate to a detailed view in future
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.appointmentTitle}>
                  {a.appointmentDate} · {a.appointmentTime}
                </Text>
                <Text style={styles.appointmentSubtitle}>
                  Status: {a.status}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ marginTop: 24 }}>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </Link>
        </View>
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
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  scroll: { flex: 1, marginTop: 8 },
  scrollContent: { paddingBottom: 32 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoText: { fontSize: 13, color: '#6b7280' },
  errorText: { fontSize: 13, color: '#b91c1c' },
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
  appointmentSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutText: {
    marginTop: 20,
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

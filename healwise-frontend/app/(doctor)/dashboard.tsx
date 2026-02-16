import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, User } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#1d4ed8', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Doctor Panel</Text>
              <Text style={styles.headerSubtitle}>Manage your appointments and schedule</Text>
            </View>
            <View style={styles.headerIcons}>
              <Pressable
                onPress={() => router.replace('/(doctor)/dashboard')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Home size={20} color="#ffffff" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(doctor)/profile' as any)}
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <User size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.linksRow}>
          <Pressable
            onPress={() => router.push('/(doctor)/patients')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.linkCard}>
              <Text style={styles.linkText}>My Patients</Text>
            </Card>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(doctor)/schedule' as any)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.linkCard}>
              <Text style={styles.linkText}>Manage Schedule</Text>
            </Card>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(doctor)/teleconsult')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.linkCard}>
              <Text style={styles.linkText}>Teleconsult</Text>
            </Card>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(doctor)/upload-prescription')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.linkCard}>
              <Text style={styles.linkText}>Upload Rx</Text>
            </Card>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(doctor)/history')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.linkCard}>
              <Text style={styles.linkText}>History</Text>
            </Card>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={styles.statValue}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appointments</Text>
          <Link href="/(doctor)/history" asChild>
            <Text style={styles.sectionLink}>View all</Text>
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
            <Card key={a._id} style={styles.appointmentCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appointmentTitle}>
                  {a.appointmentDate} · {a.appointmentTime}
                </Text>
                <Text style={styles.appointmentSubtitle}>
                  Status: {a.status}
                </Text>
              </View>
            </Card>
          ))
        )}

        <View style={styles.logoutWrapper}>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.logoutText}>Logout</Text>
          </Link>
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
    justifyContent: 'space-between',
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
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  linkCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
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
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  appointmentCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  appointmentSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutWrapper: {
    marginTop: 24,
  },
  logoutText: {
    marginTop: 20,
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

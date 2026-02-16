import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  getSymptomHistoryForAppointment,
  Appointment,
  SymptomHistoryItem,
} from '@/services/doctorPanelService';

export default function HistoryScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptomHistory, setSymptomHistory] = useState<Record<string, SymptomHistoryItem[]>>({});
  const [symptomLoadingId, setSymptomLoadingId] = useState<string | null>(null);

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

  const handleViewSymptoms = async (appointmentId: string) => {
    if (symptomHistory[appointmentId]) {
      const updated = { ...symptomHistory };
      delete updated[appointmentId];
      setSymptomHistory(updated);
      return;
    }

    setSymptomLoadingId(appointmentId);
    try {
      const history = await getSymptomHistoryForAppointment(appointmentId);
      setSymptomHistory((prev) => ({ ...prev, [appointmentId]: history }));
    } catch (err: any) {
      setError(err.message || 'Failed to load symptom history');
    } finally {
      setSymptomLoadingId(null);
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
              <Text style={styles.headerTitle}>Appointments</Text>
              <Text style={styles.headerSubtitle}>Manage and update appointment status</Text>
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
          <Text style={styles.infoText}>Loading appointments...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={styles.infoText}>No appointments yet.</Text>
        ) : (
          appointments.map((a) => (
            <Card key={a._id} style={styles.appointmentCard}>
              <Text style={styles.appointmentTitle}>
                {a.appointmentDate} · {a.appointmentTime}
              </Text>
              <Text style={styles.appointmentMeta}>
                Patient: {a.patientName || a.patientId}
              </Text>
              <Text style={styles.appointmentMeta}>Status: {a.status}</Text>

              <Pressable
                style={styles.symptomButton}
                onPress={() => handleViewSymptoms(a._id)}
              >
                <Text style={styles.symptomButtonText}>
                  {symptomHistory[a._id]
                    ? 'Hide symptom history'
                    : symptomLoadingId === a._id
                    ? 'Loading symptoms...'
                    : 'View symptom history'}
                </Text>
              </Pressable>

              {symptomHistory[a._id] && symptomHistory[a._id].length > 0 && (
                <View style={styles.symptomHistoryBox}>
                  {symptomHistory[a._id].map((item) => (
                    <View key={item._id} style={styles.symptomItem}>
                      <Text style={styles.symptomPrimary}>
                        {item.aiPrediction} ({Math.round(item.confidence * 100)}%)
                      </Text>
                      <Text style={styles.symptomText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}

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
  scroll: { flex: 1, marginTop: -16 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  infoText: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 12 },
  appointmentCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
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
  symptomButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  symptomButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  symptomHistoryBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  symptomItem: {
    marginBottom: 6,
  },
  symptomPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  symptomText: {
    fontSize: 12,
    color: '#4b5563',
  },
});

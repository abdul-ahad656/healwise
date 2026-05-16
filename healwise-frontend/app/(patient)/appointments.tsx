import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Video, PhoneOff, Calendar, Clock, User } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import { getPatientAppointments, Appointment } from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';

interface CallState {
  appointmentId: string;
  userID: string;
  userName: string;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setError(null);
      const data = await getPatientAppointments();
      setAppointments(data.sort((a, b) =>
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const startCall = (appointment: Appointment) => {
    const user = AuthStore.getUser();
    if (!user?.id) {
      Alert.alert('Error', 'Could not determine your user ID. Please log in again.');
      return;
    }
    if (appointment.status !== 'accepted') {
      Alert.alert('Cannot Join', 'You can only join video calls for accepted appointments.');
      return;
    }
    setActiveCall({
      appointmentId: appointment._id,
      userID: String(user.id),
      userName: user.name ?? 'Patient',
    });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d' };
      case 'pending':
        return { bg: '#fef3c7', border: '#fde68a', text: '#b45309' };
      case 'rejected':
        return { bg: '#fee2e2', border: '#fecaca', text: '#b91c1c' };
      case 'completed':
        return { bg: '#e0e7ff', border: '#c7d2fe', text: '#3730a3' };
      default:
        return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' };
    }
  };

  // Active call screen
  if (activeCall) {
    return (
      <View style={styles.callContainer}>
        <ConsultationRoom
          appointmentId={activeCall.appointmentId}
          userID={activeCall.userID}
          userName={activeCall.userName}
        />
        <Pressable
          onPress={endCall}
          style={({ pressed }) => [
            styles.leaveOverlayBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <PhoneOff size={18} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  // Appointments list screen
  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#06b6d4', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={20}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>My Appointments</Text>
              <Text style={styles.headerSubtitle}>Manage your doctor consultations</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={loadAppointments}
              style={({ pressed }) => [
                styles.retryBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Card>
        ) : appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Appointments Yet</Text>
            <Text style={styles.emptyText}>
              Your appointments with doctors will appear here. Book a consultation to get started.
            </Text>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const statusColor = getStatusColor(appointment.status);
            const isAccepted = appointment.status === 'accepted';
            return (
              <Card key={appointment._id} style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorNameRow}>
                      <User size={16} color="#6b7280" />
                      <Text style={styles.doctorName}>
                        {appointment.patientName || 'Doctor'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusColor.bg,
                        borderColor: statusColor.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor.text },
                      ]}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#6b7280" />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(appointment.appointmentDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Clock size={14} color="#6b7280" />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>
                        {appointment.appointmentTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {isAccepted && (
                  <Pressable
                    onPress={() => startCall(appointment)}
                    style={({ pressed }) => [
                      styles.joinCallBtn,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Video size={16} color="white" />
                    <Text style={styles.joinCallText}>Join Video Call</Text>
                  </Pressable>
                )}

                {!isAccepted && (
                  <View style={styles.disabledBtn}>
                    <Text style={styles.disabledBtnText}>
                      {appointment.status === 'pending'
                        ? 'Waiting for doctor to accept'
                        : 'Cannot join this appointment'}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  body: { flex: 1, marginTop: -20 },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  errorCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 40,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorInfo: { flex: 1 },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  joinCallBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinCallText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  disabledBtnText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  callContainer: { flex: 1 },
  leaveOverlayBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

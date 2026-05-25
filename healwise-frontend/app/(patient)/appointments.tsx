import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Video, Calendar, Clock, User } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import { getPatientAppointments, Appointment } from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  canStartTeleconsult,
  isJoinableStatus,
} from '@/utils/consultationTime';

interface CallState {
  appointmentId: string;
  userID: string;
  userName: string;
}

export default function AppointmentsScreen() {
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
      setAppointments(
        data.sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime()
        )
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load appointments';
      setError(message);
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

    const window = canStartTeleconsult(
      appointment.status,
      appointment.appointmentDate,
      appointment.appointmentTime
    );

    if (!window.canJoin) {
      Alert.alert('Cannot join yet', window.message);
      return;
    }

    setActiveCall({
      appointmentId: appointment._id,
      userID: String(user.id),
      userName: user.name ?? 'Patient',
    });
  };

  const handleCallEnded = useCallback(() => {
    setActiveCall(null);
  }, []);

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
      case 'confirmed':
        return { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d' };
      case 'in_progress':
        return { bg: '#dbeafe', border: '#bfdbfe', text: '#1d4ed8' };
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

  if (activeCall) {
    return (
      <View style={local.callContainer}>
        <ConsultationRoom
          appointmentId={activeCall.appointmentId}
          userID={activeCall.userID}
          userName={activeCall.userName}
          onLeave={handleCallEnded}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title="My Appointments"
        subtitle="Manage your doctor consultations"
        colors={['#06b6d4', '#22c55e']}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.tabListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={local.center}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={s.infoText}>Loading appointments…</Text>
          </View>
        ) : error ? (
          <Card style={local.errorCard}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={loadAppointments}
              style={local.retryBtn}
            >
              <Text style={local.retryText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : appointments.length === 0 ? (
          <Card style={local.emptyCard}>
            <Calendar size={48} color="#d1d5db" />
            <Text style={local.emptyTitle}>No Appointments Yet</Text>
            <Text style={local.emptyText}>
              Your appointments with doctors will appear here. Book a consultation to
              get started.
            </Text>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const statusColor = getStatusColor(appointment.status);
            const joinWindow = canStartTeleconsult(
              appointment.status,
              appointment.appointmentDate,
              appointment.appointmentTime
            );
            const canJoin =
              isJoinableStatus(appointment.status) && joinWindow.canJoin;

            return (
              <Card key={appointment._id} style={local.card}>
                <View style={local.cardHeader}>
                  <View style={local.doctorNameRow}>
                    <User size={16} color="#6b7280" />
                    <Text style={local.doctorName}>
                      {appointment.doctorName || 'Doctor'}
                    </Text>
                  </View>
                  <View
                    style={[
                      local.statusBadge,
                      {
                        backgroundColor: statusColor.bg,
                        borderColor: statusColor.border,
                      },
                    ]}
                  >
                    <Text style={[local.statusText, { color: statusColor.text }]}>
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={local.detailsSection}>
                  <View style={local.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <View style={local.detailText}>
                      <Text style={local.detailLabel}>Date</Text>
                      <Text style={local.detailValue}>
                        {formatDate(appointment.appointmentDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={local.detailRow}>
                    <Clock size={16} color="#6b7280" />
                    <View style={local.detailText}>
                      <Text style={local.detailLabel}>Time</Text>
                      <Text style={local.detailValue}>
                        {appointment.appointmentTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {canJoin ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => startCall(appointment)}
                    style={local.joinBtn}
                  >
                    <Video size={18} color="#ffffff" />
                    <Text style={local.joinBtnText}>Join video call</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={local.disabledBox}>
                    <Text style={local.disabledText}>
                      {appointment.status === 'pending'
                        ? 'Waiting for doctor to accept'
                        : isJoinableStatus(appointment.status)
                        ? joinWindow.message
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

const local = StyleSheet.create({
  callContainer: { flex: 1 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    paddingVertical: 24,
    gap: 12,
  },
  errorCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#991b1b',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailText: { flex: 1 },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0891b2',
    borderWidth: 2,
    borderColor: '#0e7490',
    borderRadius: 12,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 4,
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});

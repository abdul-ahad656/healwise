import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import {
  getDoctorAppointments,
  startConsultation,
  Appointment,
} from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';
import {
  canStartTeleconsult,
  isTeleconsultStatus,
} from '@/utils/consultationTime';

interface CallState {
  appointmentId: string;
  userID: string;
  userName: string;
}

export default function TeleconsultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    appointmentId?: string;
    userID?: string;
    userName?: string;
  }>();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const [activeCall, setActiveCall] = useState<CallState | null>(() => {
    if (params.appointmentId && params.userID && params.userName) {
      return {
        appointmentId: params.appointmentId,
        userID: params.userID,
        userName: params.userName,
      };
    }
    return null;
  });

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(
        data
          .filter((a) => isTeleconsultStatus(a.status))
          .sort((a, b) => {
            const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
            if (dateCompare !== 0) return dateCompare;
            return a.appointmentTime.localeCompare(b.appointmentTime);
          })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const startCall = async (appointment: Appointment) => {
    const window = canStartTeleconsult(
      appointment.status,
      appointment.appointmentDate,
      appointment.appointmentTime
    );

    if (!window.canJoin) {
      Alert.alert('Cannot start yet', window.message);
      return;
    }

    const user = AuthStore.getUser();
    if (!user?.id) {
      setError('Could not determine your user ID. Please log in again.');
      return;
    }

    setStartingId(appointment._id);
    setError(null);

    try {
      await startConsultation(appointment._id);
      setActiveCall({
        appointmentId: appointment._id,
        userID: String(user.id),
        userName: user.name ?? 'Doctor',
      });
    } catch (err: any) {
      Alert.alert('Cannot start consultation', err.message || 'Please try again');
    } finally {
      setStartingId(null);
    }
  };

  const activeCallRef = useRef<CallState | null>(activeCall);
  activeCallRef.current = activeCall;

  const handleCallEnded = useCallback(
    (result?: {
      autoCompleted?: boolean;
      consultationDurationMinutes?: number;
    }) => {
      const endedAppointmentId = activeCallRef.current?.appointmentId;
      setActiveCall(null);

      if (!endedAppointmentId) return;

      void (async () => {
        try {
          await loadAppointments();
          if (result?.autoCompleted) {
            Alert.alert(
              'Consultation completed',
              'Call duration was recorded and the appointment was marked complete.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Upload prescription',
                  onPress: () =>
                    router.push({
                      pathname: '/(doctor)/upload-prescription',
                      params: { appointmentId: endedAppointmentId },
                    }),
                },
              ]
            );
            return;
          }
          Alert.alert(
            'Consultation ended',
            result?.consultationDurationMinutes
              ? `Recorded ${result.consultationDurationMinutes} min. Mark complete from Appointments when ready, or wait for patient confirmation / auto-complete after 30 min.`
              : 'Duration is being recorded. Mark complete from Appointments after enough consultation time or patient confirmation.',
            [
              { text: 'OK', style: 'cancel' },
              {
                text: 'Upload prescription',
                onPress: () =>
                  router.push({
                    pathname: '/(doctor)/upload-prescription',
                    params: { appointmentId: endedAppointmentId },
                  }),
              },
            ]
          );
        } catch (err: any) {
          Alert.alert(
            'Could not refresh',
            err.message || 'The call ended but the list could not be updated.'
          );
        }
      })();
    },
    [loadAppointments, router]
  );

  if (activeCall) {
    return (
      <View style={styles.callContainer}>
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

      <DoctorScreenHeader
        title="Teleconsultation"
        subtitle="Video calls open 5 minutes before the booked slot"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Card style={local.emptyCard}>
            <Text style={local.emptyTitle}>No upcoming appointments</Text>
            <Text style={local.emptyBody}>
              Paid or accepted bookings will appear here for video consultation.
            </Text>
          </Card>
        ) : (
          appointments.map((a) => {
            const window = canStartTeleconsult(
              a.status,
              a.appointmentDate,
              a.appointmentTime
            );

            return (
              <Card key={a._id} style={s.listCard}>
                <Text style={s.listCardTitle}>
                  {a.appointmentDate} · {a.appointmentTime}
                </Text>
                {a.patientName ? (
                  <Text style={s.listCardMeta}>Patient: {a.patientName}</Text>
                ) : null}
                <View
                  style={[
                    local.badge,
                    a.status === 'accepted' || a.status === 'confirmed'
                      ? local.badgeAccepted
                      : a.status === 'in_progress'
                      ? local.badgeInProgress
                      : local.badgePending,
                  ]}
                >
                  <Text style={local.badgeText}>{a.status.replace('_', ' ')}</Text>
                </View>

                {!window.canJoin ? (
                  <Text style={local.windowHint}>{window.message}</Text>
                ) : null}

                {a.status === 'completed' ? (
                  <DoctorPrimaryButton
                    label="Upload prescription"
                    variant="success"
                    onPress={() =>
                      router.push({
                        pathname: '/(doctor)/upload-prescription',
                        params: { appointmentId: a._id },
                      })
                    }
                  />
                ) : null}

                {a.status !== 'completed' ? (
                  <DoctorPrimaryButton
                    label={
                      startingId === a._id
                        ? 'Starting...'
                        : window.canJoin
                        ? 'Start video call'
                        : 'Not available yet'
                    }
                    variant="primary"
                    onPress={() => startCall(a)}
                    disabled={!window.canJoin || startingId === a._id}
                  />
                ) : null}
              </Card>
            );
          })
        )}

        <Card style={local.infoCard}>
          <Text style={local.infoTitle}>How it works</Text>
          <Text style={local.infoBody}>
            Appointments appear here after payment or acceptance. You can start the
            video call up to 5 minutes before the booked time. The patient joins
            from My Appointments using the same slot.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  callContainer: { flex: 1 },
});

const local = StyleSheet.create({
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  badgeAccepted: { backgroundColor: '#dcfce7' },
  badgeInProgress: { backgroundColor: '#dbeafe' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'capitalize',
  },
  windowHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  infoCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});

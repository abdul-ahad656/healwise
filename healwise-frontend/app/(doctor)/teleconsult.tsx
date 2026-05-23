import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PhoneOff } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import {
  getDoctorAppointments,
  Appointment,
} from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';

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

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments();
        setAppointments(
          data.filter((a) => ['pending', 'accepted'].includes(a.status))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const startCall = (appointment: Appointment) => {
    const user = AuthStore.getUser();
    if (!user?.id) {
      setError('Could not determine your user ID. Please log in again.');
      return;
    }
    setActiveCall({
      appointmentId: appointment._id,
      userID: String(user.id),
      userName: user.name ?? 'Doctor',
    });
  };

  const endCall = () => setActiveCall(null);

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
          accessibilityLabel="Leave call"
        >
          <PhoneOff size={18} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Teleconsultation"
        subtitle="Select an appointment to start a video call"
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
              You have no pending or accepted appointments right now.
            </Text>
          </Card>
        ) : (
          appointments.map((a) => (
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
                  a.status === 'accepted' ? local.badgeAccepted : local.badgePending,
                ]}
              >
                <Text style={local.badgeText}>{a.status}</Text>
              </View>
              <View style={s.actionsColumn}>
                <DoctorPrimaryButton
                  label="Start video call"
                  variant="primary"
                  onPress={() => startCall(a)}
                />
              </View>
            </Card>
          ))
        )}

        <Card style={local.infoCard}>
          <Text style={local.infoTitle}>How it works</Text>
          <Text style={local.infoBody}>
            Tap Start video call on an appointment. Your patient joins from the
            same appointment in the patient app to enter the same room.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  callContainer: { flex: 1 },
  leaveOverlayBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
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
  badgePending: { backgroundColor: '#fef9c3' },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'capitalize',
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

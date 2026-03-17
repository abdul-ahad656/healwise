import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Video, PhoneOff } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import {
  getDoctorAppointments,
  Appointment,
} from '@/services/doctorPanelService';
import AuthStore from '@/services/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallState {
  appointmentId: string;
  userID: string;
  userName: string;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TeleconsultScreen() {
  const router = useRouter();

  // Route params: optionally jump straight into a call when navigating from
  // another screen (e.g. patient appointment list).
  const params = useLocalSearchParams<{
    appointmentId?: string;
    userID?: string;
    userName?: string;
  }>();

  // ── State ──────────────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // When all three deep-link params are present, start the call immediately.
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

  // ── Fetch accepted / upcoming appointments ─────────────────────────────────
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments();
        // Only show appointments that make sense to call into.
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

  // ── Start a call for a given appointment ──────────────────────────────────
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

  // ── End call (hang-up is also handled inside ConsultationRoom) ─────────────
  const endCall = () => {
    setActiveCall(null);
  };

  // ── Full-screen active-call view ───────────────────────────────────────────
  if (activeCall) {
    return (
      <View style={styles.callContainer}>
        <ConsultationRoom
          appointmentId={activeCall.appointmentId}
          userID={activeCall.userID}
          userName={activeCall.userName}
        />
        {/* Fallback manual-leave button overlaid at the top-left */}
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

  // ── Appointment-picker view ────────────────────────────────────────────────
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
              <Text style={styles.headerTitle}>Teleconsultation</Text>
              <Text style={styles.headerSubtitle}>
                Select an appointment to start a video call
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#1d4ed8"
            style={styles.loader}
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming appointments</Text>
            <Text style={styles.emptyBody}>
              You have no pending or accepted appointments right now. Ask a
              patient to book a slot from the patient portal.
            </Text>
          </Card>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments.map((a) => (
              <Card key={a._id} style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDate}>
                    {a.appointmentDate} · {a.appointmentTime}
                  </Text>
                  {a.patientName ? (
                    <Text style={styles.patientName}>{a.patientName}</Text>
                  ) : null}
                  <View
                    style={[
                      styles.statusBadge,
                      a.status === 'accepted'
                        ? styles.badgeAccepted
                        : styles.badgePending,
                    ]}
                  >
                    <Text style={styles.statusText}>{a.status}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => startCall(a)}
                  style={({ pressed }) => [
                    styles.startCallBtn,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  accessibilityLabel={`Start video call for appointment on ${a.appointmentDate}`}
                >
                  <Video size={16} color="#ffffff" />
                  <Text style={styles.startCallText}>Start Call</Text>
                </Pressable>
              </Card>
            ))}
          </>
        )}

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoBody}>
            Tap "Start Call" on an appointment above. Your patient joins from
            the same appointment in the patient portal. Both sides must use the
            same appointment to be connected to the same private video room.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Call overlay ────────────────────────────────────────────────────────
  callContainer: {
    flex: 1,
  },
  leaveOverlayBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // ── Picker layout ───────────────────────────────────────────────────────
  container: { flex: 1 },
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: '#ffffff', opacity: 0.9 },

  body: { flex: 1, marginTop: -12 },
  bodyContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },

  loader: { marginTop: 40 },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 12 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },

  // ── Appointment card ─────────────────────────────────────────────────────
  appointmentCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentInfo: { flex: 1, gap: 4 },
  appointmentDate: { fontSize: 14, fontWeight: '600', color: '#111827' },
  patientName: { fontSize: 12, color: '#4b5563' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeAccepted: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef9c3' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#374151' },

  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  startCallText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  // ── Empty / info cards ────────────────────────────────────────────────────
  emptyCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  infoCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
});

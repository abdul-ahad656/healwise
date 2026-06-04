import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  getSymptomHistoryForAppointment,
  cancelAppointment,
  rescheduleAppointment,
  markAppointmentComplete,
  Appointment,
  SymptomHistoryItem,
} from '@/services/doctorPanelService';
import { adminScreenStyles as adminS, PLACEHOLDER_COLOR } from '@/styles/adminScreen';

export default function HistoryScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptomHistory, setSymptomHistory] = useState<Record<string, SymptomHistoryItem[]>>({});
  const [symptomLoadingId, setSymptomLoadingId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const refresh = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data);
      setError(null);
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

  const handleCancel = (appointmentId: string) => {
    Alert.alert('Cancel appointment', 'Cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAppointment(appointmentId);
            await refresh();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const handleMarkComplete = async (appointment: Appointment) => {
    try {
      await markAppointmentComplete(appointment._id);
      await refresh();
    } catch (err: any) {
      Alert.alert('Cannot mark complete', err.message || 'Failed to update');
    }
  };

  const submitReschedule = async (appointmentId: string) => {
    if (!rescheduleDate.trim() || !rescheduleTime.trim()) {
      Alert.alert('Validation', 'Enter new date and time');
      return;
    }
    try {
      await rescheduleAppointment(
        appointmentId,
        rescheduleDate.trim(),
        rescheduleTime.trim()
      );
      setRescheduleId(null);
      setRescheduleDate('');
      setRescheduleTime('');
      await refresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reschedule');
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
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Appointments"
        subtitle="Manage and update appointment status"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={s.infoText}>Loading appointments...</Text>
        ) : error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : appointments.length === 0 ? (
          <Text style={s.infoText}>No appointments yet.</Text>
        ) : (
          appointments.map((a) => (
            <Card key={a._id} style={s.listCard}>
              <Text style={s.listCardTitle}>
                {a.appointmentDate} · {a.appointmentTime}
              </Text>
              <Text style={s.listCardMeta}>
                Patient: {a.patientName || a.patientId}
              </Text>
              <Text style={s.listCardMeta}>Status: {a.status}</Text>
              {a.consultationDurationMinutes != null ? (
                <Text style={s.listCardMeta}>
                  Consultation: {a.consultationDurationMinutes} min recorded
                </Text>
              ) : null}
              {a.patientMarkedComplete ? (
                <Text style={s.listCardMeta}>Patient marked complete</Text>
              ) : null}

              <View style={s.actionsColumn}>
                <DoctorPrimaryButton
                  label={
                    symptomHistory[a._id]
                      ? 'Hide symptom history'
                      : symptomLoadingId === a._id
                      ? 'Loading symptoms...'
                      : 'View symptom history'
                  }
                  variant="neutral"
                  onPress={() => handleViewSymptoms(a._id)}
                  disabled={symptomLoadingId === a._id}
                />

                {symptomHistory[a._id] && symptomHistory[a._id].length > 0 ? (
                  <View style={local.symptomBox}>
                    {symptomHistory[a._id].map((item) => (
                      <View key={item._id} style={local.symptomItem}>
                        <Text style={local.symptomPrimary}>
                          {item.aiPrediction} ({Math.round(item.confidence * 100)}%)
                        </Text>
                        <Text style={local.symptomText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {a.status === 'pending' ? (
                  <>
                    <DoctorPrimaryButton
                      label="Accept appointment"
                      variant="success"
                      onPress={() => handleStatusChange(a._id, 'accepted')}
                    />
                    <DoctorPrimaryButton
                      label="Reject appointment"
                      variant="danger"
                      onPress={() => handleStatusChange(a._id, 'rejected')}
                    />
                  </>
                ) : null}

                {(a.status === 'accepted' ||
                  a.status === 'confirmed' ||
                  a.status === 'in_progress') && (
                  <>
                    <DoctorPrimaryButton
                      label="Mark consultation complete"
                      variant="primary"
                      onPress={() => handleMarkComplete(a)}
                    />
                    <DoctorPrimaryButton
                      label={
                        rescheduleId === a._id ? 'Hide reschedule' : 'Reschedule'
                      }
                      variant="neutral"
                      onPress={() => {
                        if (rescheduleId === a._id) {
                          setRescheduleId(null);
                        } else {
                          setRescheduleId(a._id);
                          setRescheduleDate(a.appointmentDate);
                          setRescheduleTime(a.appointmentTime);
                        }
                      }}
                    />
                    <DoctorPrimaryButton
                      label="Cancel appointment"
                      variant="danger"
                      onPress={() => handleCancel(a._id)}
                    />
                  </>
                )}

                {rescheduleId === a._id ? (
                  <View style={local.rescheduleBox}>
                    <Text style={s.fieldLabel}>New date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={adminS.input}
                      value={rescheduleDate}
                      onChangeText={setRescheduleDate}
                      placeholder="2026-05-25"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                    />
                    <Text style={[s.fieldLabel, { marginTop: 8 }]}>
                      New time (must match your schedule slot)
                    </Text>
                    <TextInput
                      style={adminS.input}
                      value={rescheduleTime}
                      onChangeText={setRescheduleTime}
                      placeholder="10:30 - 13:00"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                    />
                    <DoctorPrimaryButton
                      label="Save reschedule"
                      variant="success"
                      onPress={() => submitReschedule(a._id)}
                      style={{ marginTop: 10 }}
                    />
                  </View>
                ) : null}

                {(a.status === 'in_progress' || a.status === 'completed') &&
                !a.hasPrescription ? (
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

                {(a.status === 'in_progress' || a.status === 'completed') &&
                a.hasPrescription ? (
                  <Text style={[s.listCardMeta, { color: '#16a34a' }]}>
                    Prescription uploaded
                  </Text>
                ) : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  symptomBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  symptomItem: { marginBottom: 8 },
  symptomPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  symptomText: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  rescheduleBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

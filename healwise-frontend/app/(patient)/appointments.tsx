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
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Video, Calendar, Clock, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import ConsultationRoom from '@/components/VideoCall/ConsultationRoom';
import { RescheduleSlotPicker } from '@/components/scheduling/RescheduleSlotPicker';
import {
  getPatientAppointments,
  cancelAppointment,
  cancelAppointmentWithRefund,
  rescheduleAppointment,
  markAppointmentComplete,
  Appointment,
} from '@/services/doctorPanelService';
import { isPastAppointment } from '@/utils/appointmentHistory';
import {
  canCancelAppointment,
  shouldUseRefundCancellation,
} from '@/utils/appointmentActions';
import AuthStore from '@/services/authStore';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  CONSULTATION_EARLY_MINUTES,
  canPatientJoinTeleconsult,
  isJoinableStatus,
} from '@/utils/consultationTime';

function formatAppointmentStatus(status: string, t: TFunction) {
  const key = `appointment_status_${status}`;
  const translated = t(key);
  return translated === key
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : translated;
}

function translateJoinMessage(
  message: string,
  minutesUntilStart: number | null,
  t: TFunction
) {
  if (!message) return '';
  if (message === 'Invalid appointment date') return t('appointments_invalid_date');
  if (message === 'Invalid appointment time') return t('appointments_invalid_time');
  if (message === 'This consultation window has ended') {
    return t('appointments_join_ended');
  }
  if (message === 'Accept this appointment before starting a video call') {
    return t('appointments_pending_video');
  }
  if (message === 'This appointment is not available for video consultation') {
    return t('appointments_not_available_video');
  }
  if (message === 'Your doctor will start the consultation when ready') {
    return t('appointments_wait_doctor_start');
  }
  if (message === 'Wait for your doctor to start the video consultation') {
    return t('appointments_wait_doctor_in_progress');
  }
  if (message.includes('minutes before start')) {
    return t('appointments_join_available_before', {
      early: CONSULTATION_EARLY_MINUTES,
      minutes: minutesUntilStart ?? 0,
    });
  }
  return message;
}

interface CallState {
  appointmentId: string;
  userID: string;
  userName: string;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<CallState | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [refundTarget, setRefundTarget] = useState<Appointment | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundNumber, setRefundNumber] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setError(null);
      const data = await getPatientAppointments();
      const upcoming = data.filter(
        (a) =>
          !['completed', 'cancelled', 'rejected'].includes(a.status) &&
          !isPastAppointment(a)
      );
      setAppointments(
        upcoming.sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        )
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('appointments_error_load');
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
      Alert.alert('Error', t('appointments_error_user'));
      return;
    }

    const window = canPatientJoinTeleconsult(
      appointment.status,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.consultationStartedAt
    );

    if (!window.canJoin) {
      Alert.alert(
        t('appointments_cannot_join_title'),
        translateJoinMessage(window.message, window.minutesUntilStart, t)
      );
      return;
    }

    setActiveCall({
      appointmentId: appointment._id,
      userID: String(user.id),
      userName: user.name ?? 'Patient',
    });
  };

  const activeCallRef = React.useRef<CallState | null>(activeCall);
  activeCallRef.current = activeCall;

  const handleCallEnded = useCallback(
    (result?: {
      consultationDurationMinutes?: number;
      autoCompleted?: boolean;
    }) => {
      setActiveCall(null);
      void (async () => {
        await loadAppointments();
        if (result?.autoCompleted) {
          Alert.alert(
            t('appointments_title'),
            'Consultation recorded and marked complete.'
          );
          return;
        }
        if (result?.consultationDurationMinutes) {
          Alert.alert(
            t('appointments_title'),
            `Consultation recorded: ${result.consultationDurationMinutes} min.`
          );
        }
      })();
    },
    [t, loadAppointments]
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const locale = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
      return date.toLocaleDateString(locale, {
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
      case 'cancelled':
        return { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280' };
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
        title={t('appointments_title')}
        subtitle={t('appointments_subtitle')}
        colors={['#06b6d4', '#22c55e']}
        onBack={() => router.navigate('/(patient)/home' as Href)}
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
            <Text style={s.infoText}>{t('appointments_loading')}</Text>
          </View>
        ) : error ? (
          <Card style={local.errorCard}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={loadAppointments}
              style={local.retryBtn}
            >
              <Text style={local.retryText}>{t('appointments_retry')}</Text>
            </TouchableOpacity>
          </Card>
        ) : appointments.length === 0 ? (
          <Card style={local.emptyCard}>
            <Calendar size={48} color="#d1d5db" />
            <Text style={local.emptyTitle}>{t('appointments_empty_title')}</Text>
            <Text style={local.emptyText}>{t('appointments_empty_text')}</Text>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const statusColor = getStatusColor(appointment.status);
            const joinWindow = canPatientJoinTeleconsult(
              appointment.status,
              appointment.appointmentDate,
              appointment.appointmentTime,
              appointment.consultationStartedAt
            );
            const canJoin =
              isJoinableStatus(appointment.status) && joinWindow.canJoin;
            const cancelCheck = canCancelAppointment(appointment);
            const useRefundCancel = shouldUseRefundCancellation(appointment);

            return (
              <Card key={appointment._id} style={local.card}>
                <View style={local.cardHeader}>
                  <View style={local.doctorNameRow}>
                    <User size={16} color="#6b7280" />
                    <Text style={local.doctorName}>
                      {appointment.doctorName || t('appointments_doctor_fallback')}
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
                      {formatAppointmentStatus(appointment.status, t)}
                    </Text>
                  </View>
                </View>

                <View style={local.detailsSection}>
                  <View style={local.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <View style={local.detailText}>
                      <Text style={local.detailLabel}>{t('appointments_date')}</Text>
                      <Text style={local.detailValue}>
                        {formatDate(appointment.appointmentDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={local.detailRow}>
                    <Clock size={16} color="#6b7280" />
                    <View style={local.detailText}>
                      <Text style={local.detailLabel}>{t('appointments_time')}</Text>
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
                    <Text style={local.joinBtnText}>{t('appointments_join_call')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={local.disabledBox}>
                    <Text style={local.disabledText}>
                      {appointment.status === 'pending'
                        ? t('appointments_waiting_accept')
                        : isJoinableStatus(appointment.status)
                        ? translateJoinMessage(
                            joinWindow.message,
                            joinWindow.minutesUntilStart,
                            t
                          )
                        : t('appointments_cannot_join')}
                    </Text>
                  </View>
                )}

                {appointment.patientMarkedComplete &&
                appointment.status !== 'completed' ? (
                  <View style={local.markedBanner}>
                    <Text style={local.markedBannerText}>
                      {t('appointments_patient_marked_banner')}
                    </Text>
                  </View>
                ) : null}

                {appointment.doctorMarkedComplete &&
                !appointment.patientMarkedComplete &&
                appointment.status !== 'completed' ? (
                  <View style={[local.markedBanner, local.markedBannerDoctor]}>
                    <Text style={local.markedBannerText}>
                      {t('appointments_doctor_marked_banner')}
                    </Text>
                  </View>
                ) : null}

                {(appointment.status === 'accepted' ||
                  appointment.status === 'confirmed' ||
                  appointment.status === 'in_progress') && (
                  <View style={local.actionsCol}>
                    {!appointment.patientMarkedComplete ? (
                      <PatientPrimaryButton
                        label={t('appointments_mark_complete')}
                        variant="primary"
                        onPress={async () => {
                          try {
                            const updated = await markAppointmentComplete(
                              appointment._id
                            );
                            setAppointments((prev) =>
                              prev.map((a) =>
                                a._id === appointment._id
                                  ? { ...a, ...updated }
                                  : a
                              )
                            );
                            if (updated.status === 'completed') {
                              Alert.alert(
                                t('appointments_title'),
                                t('appointments_mark_complete_done')
                              );
                              await loadAppointments();
                            } else {
                              Alert.alert(
                                t('appointments_title'),
                                t('appointments_mark_complete_success')
                              );
                            }
                          } catch (err: unknown) {
                            Alert.alert(
                              'Error',
                              err instanceof Error ? err.message : 'Failed'
                            );
                          }
                        }}
                      />
                    ) : null}
                    <PatientPrimaryButton
                      label={
                        rescheduleId === appointment._id
                          ? 'Hide reschedule'
                          : 'Reschedule'
                      }
                      variant="outline"
                      onPress={() => {
                        if (rescheduleId === appointment._id) {
                          setRescheduleId(null);
                          setRescheduleDate('');
                          setRescheduleTime('');
                        } else {
                          setRescheduleId(appointment._id);
                          setRescheduleDate('');
                          setRescheduleTime('');
                        }
                      }}
                    />
                    <PatientPrimaryButton
                      label={
                        useRefundCancel
                          ? t('appointments_cancel_refund')
                          : t('appointments_cancel')
                      }
                      variant="danger"
                      disabled={!cancelCheck.allowed}
                      onPress={() => {
                        if (!cancelCheck.allowed) {
                          Alert.alert(
                            t('appointments_cannot_cancel_title'),
                            cancelCheck.reason || t('appointments_cannot_cancel')
                          );
                          return;
                        }
                        if (useRefundCancel) {
                          setRefundTarget(appointment);
                          setRefundReason('');
                          setRefundNumber('');
                          return;
                        }
                        Alert.alert(
                          t('appointments_cancel_title'),
                          t('appointments_cancel_confirm'),
                          [
                            { text: t('appointments_no'), style: 'cancel' },
                            {
                              text: t('appointments_yes'),
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await cancelAppointment(appointment._id);
                                  await loadAppointments();
                                } catch (err: unknown) {
                                  Alert.alert(
                                    'Error',
                                    err instanceof Error ? err.message : 'Failed'
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                    />
                  </View>
                )}

                {rescheduleId === appointment._id ? (
                  <View style={local.rescheduleBox}>
                    <Text style={local.detailLabel}>
                      {t('appointments_reschedule_pick')}
                    </Text>
                    <RescheduleSlotPicker
                      doctorId={appointment.doctorId}
                      selectedDay={rescheduleDate || null}
                      selectedSlot={rescheduleTime || null}
                      onDayChange={setRescheduleDate}
                      onSlotChange={setRescheduleTime}
                    />
                    <PatientPrimaryButton
                      label={t('appointments_reschedule_save')}
                      variant="primary"
                      disabled={!rescheduleDate.trim() || !rescheduleTime.trim()}
                      onPress={async () => {
                        try {
                          await rescheduleAppointment(
                            appointment._id,
                            rescheduleDate.trim(),
                            rescheduleTime.trim()
                          );
                          setRescheduleId(null);
                          setRescheduleDate('');
                          setRescheduleTime('');
                          Alert.alert(
                            t('appointments_title'),
                            'Appointment rescheduled successfully.'
                          );
                          await loadAppointments();
                        } catch (err: unknown) {
                          Alert.alert(
                            'Error',
                            err instanceof Error ? err.message : 'Failed'
                          );
                        }
                      }}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={!!refundTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setRefundTarget(null)}
      >
        <View style={local.modalBackdrop}>
          <View style={local.modalCard}>
            <Text style={local.modalTitle}>{t('appointments_cancel_refund')}</Text>
            <Text style={local.modalHint}>{t('appointments_refund_hint')}</Text>
            <Text style={local.modalLabel}>{t('appointments_refund_reason')}</Text>
            <TextInput
              value={refundReason}
              onChangeText={setRefundReason}
              placeholder={t('appointments_refund_reason_placeholder')}
              placeholderTextColor="#9ca3af"
              multiline
              style={local.modalInput}
            />
            <Text style={local.modalLabel}>{t('appointments_refund_number')}</Text>
            <TextInput
              value={refundNumber}
              onChangeText={setRefundNumber}
              placeholder="03XXXXXXXXX"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              style={local.modalInput}
            />
            <View style={local.modalActions}>
              <PatientPrimaryButton
                label={t('appointments_no')}
                variant="outline"
                onPress={() => setRefundTarget(null)}
              />
              <PatientPrimaryButton
                label={
                  submittingRefund
                    ? t('profile_saving')
                    : t('appointments_submit_refund')
                }
                variant="danger"
                disabled={
                  submittingRefund ||
                  !refundReason.trim() ||
                  refundNumber.trim().length < 10
                }
                onPress={async () => {
                  if (!refundTarget) return;
                  setSubmittingRefund(true);
                  try {
                    await cancelAppointmentWithRefund(
                      refundTarget._id,
                      refundReason.trim(),
                      refundNumber.trim()
                    );
                    setRefundTarget(null);
                    Alert.alert(
                      t('appointments_title'),
                      t('appointments_refund_submitted')
                    );
                    await loadAppointments();
                  } catch (err: unknown) {
                    Alert.alert(
                      'Error',
                      err instanceof Error ? err.message : 'Failed'
                    );
                  } finally {
                    setSubmittingRefund(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  actionsCol: { marginTop: 12, gap: 8 },
  markedBanner: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  markedBannerDoctor: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  markedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    lineHeight: 18,
  },
  rescheduleBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
    minHeight: 44,
  },
  modalActions: {
    marginTop: 16,
    gap: 10,
  },
});

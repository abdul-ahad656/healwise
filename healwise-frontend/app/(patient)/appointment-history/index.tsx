import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, Clock, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import {
  getPatientAppointments,
  Appointment,
} from '@/services/doctorPanelService';
import { filterPastAppointments } from '@/utils/appointmentHistory';

function formatAppointmentStatus(status: string, t: TFunction) {
  const key = `appointment_status_${status}`;
  const translated = t(key);
  return translated === key
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : translated;
}

function getStatusColor(status: string) {
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
}

export default function AppointmentHistoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const locale = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
      return new Date(dateString).toLocaleDateString(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await getPatientAppointments();
      setItems(filterPastAppointments(data));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('appointment_history_error_load');
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title={t('appointment_history_title')}
        subtitle={t('appointment_history_subtitle')}
        colors={['#06b6d4', '#0891b2']}
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.tabListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadHistory();
            }}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={s.infoText}>{t('appointment_history_loading')}</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={s.errorText}>{error}</Text>
            <PatientPrimaryButton
              label={t('appointments_retry')}
              onPress={loadHistory}
              variant="primary"
              style={{ marginTop: 12, alignSelf: 'stretch' }}
            />
          </Card>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Calendar size={48} color="#a5f3fc" />
            <Text style={styles.emptyTitle}>
              {t('appointment_history_empty_title')}
            </Text>
            <Text style={styles.emptyBody}>
              {t('appointment_history_empty_body')}
            </Text>
            <PatientPrimaryButton
              label={t('appointment_history_book_cta')}
              onPress={() => router.push('/(patient)/consult-doctor')}
              variant="primary"
              style={{ marginTop: 16, alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          items.map((appointment) => {
            const statusColor = getStatusColor(appointment.status);
            return (
              <Card key={appointment._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.doctorRow}>
                    <User size={16} color="#6b7280" />
                    <Text style={styles.doctorName} numberOfLines={1}>
                      {appointment.doctorName || t('appointments_doctor_fallback')}
                    </Text>
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
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {formatAppointmentStatus(appointment.status, t)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>{t('appointments_date')}</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(appointment.appointmentDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#6b7280" />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>{t('appointments_time')}</Text>
                      <Text style={styles.detailValue}>
                        {appointment.appointmentTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {appointment.consultationDurationMinutes != null &&
                appointment.consultationDurationMinutes > 0 ? (
                  <Text style={styles.metaLine}>
                    Consultation: {appointment.consultationDurationMinutes} min
                    {appointment.completionType === 'auto_duration'
                      ? ' (auto-completed)'
                      : ''}
                  </Text>
                ) : null}
                {appointment.hasPrescription ? (
                  <Text style={styles.prescriptionHint}>
                    {t('appointment_history_has_prescription')}
                  </Text>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingVertical: 24,
    gap: 12,
  },
  errorCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
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
  doctorRow: {
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
  metaLine: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
  },
  prescriptionHint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
});

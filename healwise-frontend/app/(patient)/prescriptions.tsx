import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { FileText, Calendar, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { getPatientPrescriptions, Prescription } from '@/services/doctorPanelService';
import {
  downloadPrescriptionFile,
  openPrescriptionInBrowser,
} from '@/utils/downloadPrescription';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await getPatientPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      Alert.alert('Error', t('prescriptions_error_load'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
    setRefreshing(false);
  };

  const handleViewPrescription = async (prescription: Prescription) => {
    try {
      await openPrescriptionInBrowser(prescription.cloudinaryUrl);
    } catch (error) {
      Alert.alert('Error', t('prescriptions_error_open'));
      console.error(error);
    }
  };

  const handleDownloadPrescription = async (prescription: Prescription) => {
    setDownloadingId(prescription._id);
    try {
      await downloadPrescriptionFile(prescription.cloudinaryUrl, {
        fileType: prescription.fileType,
        baseName: `prescription_${prescription._id}`,
      });
      Alert.alert(t('prescriptions_title'), t('prescriptions_download_success'));
    } catch (error) {
      Alert.alert('Error', t('prescriptions_error_download'));
      console.error(error);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const locale = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader
        title={t('prescriptions_title')}
        subtitle={t('prescriptions_subtitle')}
        colors={['#22c55e', '#3b82f6']}
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
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={s.infoText}>{t('prescriptions_loading')}</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <Card style={local.emptyCard}>
            <FileText size={48} color="#d1d5db" />
            <Text style={local.emptyTitle}>{t('prescriptions_empty_title')}</Text>
            <Text style={local.emptyText}>{t('prescriptions_empty_text')}</Text>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription._id} style={local.card}>
              <View style={local.cardHeader}>
                <View style={local.doctorInfo}>
                  <Text style={local.doctorName}>
                    {prescription.doctorName || t('prescriptions_doctor_fallback')}
                  </Text>
                  {prescription.doctorSpecialization ? (
                    <Text style={local.specialization}>
                      {prescription.doctorSpecialization}
                    </Text>
                  ) : null}
                </View>
                <FileText size={28} color="#22c55e" />
              </View>

              <View style={local.detailsSection}>
                {prescription.appointmentDate ? (
                  <View style={local.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <View style={local.detailText}>
                      <Text style={local.detailLabel}>
                        {t('prescriptions_appointment_label')}
                      </Text>
                      <Text style={local.detailValue}>
                        {formatDate(prescription.appointmentDate)}
                        {prescription.appointmentTime
                          ? ` · ${prescription.appointmentTime}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={[local.detailRow, local.detailRowLast]}>
                  <Download size={16} color="#6b7280" />
                  <View style={local.detailText}>
                    <Text style={local.detailLabel}>
                      {t('prescriptions_uploaded_label')}
                    </Text>
                    <Text style={local.detailValue}>
                      {formatDate(prescription.uploadedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {prescription.notes ? (
                <View style={local.notesSection}>
                  <Text style={local.notesLabel}>{t('prescriptions_notes_label')}</Text>
                  <Text style={local.notesText}>{prescription.notes}</Text>
                </View>
              ) : null}

              <View style={local.actionRow}>
                <PatientPrimaryButton
                  label={t('prescriptions_view')}
                  variant="outline"
                  fullWidth={false}
                  onPress={() => handleViewPrescription(prescription)}
                  style={local.actionBtnHalf}
                />
                <PatientPrimaryButton
                  label={t('prescriptions_download')}
                  variant="primary"
                  fullWidth={false}
                  onPress={() => handleDownloadPrescription(prescription)}
                  style={local.actionBtnHalf}
                  disabled={downloadingId === prescription._id}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    paddingVertical: 24,
    gap: 12,
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
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  doctorInfo: { flex: 1 },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
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
  detailRowLast: { marginBottom: 0 },
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
  notesSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnHalf: {
    flex: 1,
  },
});

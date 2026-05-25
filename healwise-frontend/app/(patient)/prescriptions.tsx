import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { FileText, Calendar, Download } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { getPatientPrescriptions, Prescription } from '@/services/doctorPanelService';

export default function PrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await getPatientPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load prescriptions');
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

  const handleViewPrescription = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to open prescription');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
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
        title="My Prescriptions"
        subtitle="View prescriptions from your doctors"
        colors={['#22c55e', '#3b82f6']}
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
            <Text style={s.infoText}>Loading prescriptions…</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <Card style={local.emptyCard}>
            <FileText size={48} color="#d1d5db" />
            <Text style={local.emptyTitle}>No Prescriptions Yet</Text>
            <Text style={local.emptyText}>
              Your prescriptions from doctors will appear here once they upload them.
            </Text>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription._id} style={local.card}>
              <View style={local.cardHeader}>
                <View style={local.doctorInfo}>
                  <Text style={local.doctorName}>
                    {prescription.doctorName || 'Doctor'}
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
                      <Text style={local.detailLabel}>Appointment</Text>
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
                    <Text style={local.detailLabel}>Uploaded</Text>
                    <Text style={local.detailValue}>
                      {formatDate(prescription.uploadedAt)}
                    </Text>
                  </View>
                </View>
              </View>

              {prescription.notes ? (
                <View style={local.notesSection}>
                  <Text style={local.notesLabel}>Doctor&apos;s notes</Text>
                  <Text style={local.notesText}>{prescription.notes}</Text>
                </View>
              ) : null}

              <PatientPrimaryButton
                label="View / Download"
                variant="primary"
                onPress={() => handleViewPrescription(prescription.cloudinaryUrl)}
                style={local.actionBtn}
              />
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
  actionBtn: {
    marginTop: 4,
  },
});

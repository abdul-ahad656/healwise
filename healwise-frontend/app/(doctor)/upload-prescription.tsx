import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '@/components/ui/card';
import { DoctorScreenHeader } from '@/components/doctor/DoctorScreenHeader';
import { DoctorPrimaryButton } from '@/components/doctor/DoctorPrimaryButton';
import { doctorScreenStyles as s } from '@/styles/doctorScreen';
import {
  getDoctorAppointments,
  uploadPrescription,
  Appointment,
} from '@/services/doctorPanelService';

interface AugmentedAppointment extends Appointment {
  prescriptionUploaded?: boolean;
}

export default function UploadPrescriptionScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AugmentedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(
        data.filter((a) => a.status === 'completed' || a.status === 'accepted')
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async (appointmentId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const ext = file.name?.toLowerCase().split('.').pop();

        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
          Alert.alert('Invalid File', 'Only PDF and image files are allowed');
          return;
        }

        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Maximum file size is 10MB');
          return;
        }

        await handleUpload(appointmentId, file.uri, file.name || 'prescription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
      console.error(error);
    }
  };

  const handleUpload = async (
    appointmentId: string,
    fileUri: string,
    fileName: string
  ) => {
    setUploading(appointmentId);
    try {
      await uploadPrescription(appointmentId, fileUri, fileName, '');
      Alert.alert('Success', 'Prescription uploaded successfully');
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentId ? { ...a, prescriptionUploaded: true } : a
        )
      );
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload prescription');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <DoctorScreenHeader
        title="Upload Prescriptions"
        subtitle="Share prescriptions with your patients"
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={local.center}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={s.infoText}>Loading appointments...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <Card style={local.emptyCard}>
            <FileText size={48} color="#9ca3af" />
            <Text style={local.emptyTitle}>No appointments</Text>
            <Text style={local.emptyText}>
              You have no completed or accepted appointments yet.
            </Text>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id} style={s.listCard}>
              <View style={local.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.listCardTitle}>
                    {appointment.patientName || 'Patient'}
                  </Text>
                  <Text style={s.listCardMeta}>
                    {appointment.appointmentDate} at {appointment.appointmentTime}
                  </Text>
                  <View style={local.badge}>
                    <Text style={local.badgeText}>{appointment.status}</Text>
                  </View>
                </View>
                {appointment.prescriptionUploaded ? (
                  <CheckCircle size={28} color="#16a34a" />
                ) : null}
              </View>

              {!appointment.prescriptionUploaded ? (
                <View style={s.actionsColumn}>
                  {uploading === appointment._id ? (
                    <View style={local.uploadingRow}>
                      <ActivityIndicator size="small" color="#1d4ed8" />
                      <Text style={local.uploadingText}>Uploading...</Text>
                    </View>
                  ) : (
                    <DoctorPrimaryButton
                      label="Select & upload file"
                      variant="success"
                      onPress={() => handlePickFile(appointment._id)}
                    />
                  )}
                </View>
              ) : (
                <Text style={[s.listCardMeta, { marginTop: 8, color: '#16a34a' }]}>
                  Prescription uploaded
                </Text>
              )}
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
    paddingVertical: 40,
    gap: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
    textTransform: 'capitalize',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
  },
  uploadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
});

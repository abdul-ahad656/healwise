import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, FileText, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card } from '@/components/ui/card';
import { getDoctorAppointments, uploadPrescription } from '@/services/doctorPanelService';
import { Appointment } from '@/services/doctorPanelService';

interface AugmentedAppointment extends Appointment {
  prescriptionUploaded?: boolean;
}

export default function UploadPrescriptionScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AugmentedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadingNotes, setUploadingNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await getDoctorAppointments();
      const filtered = data.filter(
        (a) => a.status === 'completed' || a.status === 'accepted'
      );
      setAppointments(filtered);
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

  const handleUpload = async (appointmentId: string, fileUri: string, fileName: string) => {
    setUploading(appointmentId);
    try {
      const notes = uploadingNotes[appointmentId] || '';
      await uploadPrescription(appointmentId, fileUri, fileName, notes);

      Alert.alert('Success', 'Prescription uploaded successfully');
      setUploadingNotes((prev) => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });

      const updated = appointments.map((a) =>
        a._id === appointmentId ? { ...a, prescriptionUploaded: true } : a
      );
      setAppointments(updated);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload prescription');
      console.error(error);
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#22c55e', '#3b82f6']}
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
              <Text style={styles.headerTitle}>Upload Prescriptions</Text>
              <Text style={styles.headerSubtitle}>Share prescriptions with your patients</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptyText}>
              You have no completed or accepted appointments yet.
            </Text>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment._id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.patientName}>{appointment.patientName || 'Patient'}</Text>
                  <Text style={styles.appointmentTime}>
                    {appointment.appointmentDate} at {appointment.appointmentTime}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{appointment.status}</Text>
                  </View>
                </View>

                {appointment.prescriptionUploaded && (
                  <CheckCircle size={24} color="#22c55e" />
                )}
              </View>

              {!appointment.prescriptionUploaded && (
                <View style={styles.uploadSection}>
                  <Pressable
                    onPress={() => handlePickFile(appointment._id)}
                    disabled={uploading === appointment._id}
                    style={({ pressed }) => [
                      styles.uploadButton,
                      { opacity: pressed ? 0.8 : 1 },
                      uploading === appointment._id && styles.uploadButtonDisabled,
                    ]}
                  >
                    {uploading === appointment._id ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.uploadButtonText}>Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Upload size={18} color="#ffffff" />
                        <Text style={styles.uploadButtonText}>Select & Upload</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </Card>
          ))
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerSubtitle: { fontSize: 14, color: '#ffffff', opacity: 0.9 },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  uploadSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  uploadButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#86efac',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});

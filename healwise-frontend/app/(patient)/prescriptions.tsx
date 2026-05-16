import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Pressable, ScrollView, ActivityIndicator, Alert, Linking, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Download, Calendar, User } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { getPatientPrescriptions, Prescription } from '@/services/doctorPanelService';

export default function PrescriptionsScreen() {
  const router = useRouter();
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
              <Text style={styles.headerTitle}>My Prescriptions</Text>
              <Text style={styles.headerSubtitle}>View prescriptions from your doctors</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Loading prescriptions...</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FileText size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Prescriptions Yet</Text>
            <Text style={styles.emptyText}>
              Your prescriptions from doctors will appear here once they upload them.
            </Text>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription._id} style={styles.prescriptionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{prescription.doctorName || 'Doctor'}</Text>
                  {prescription.doctorSpecialization && (
                    <Text style={styles.specialization}>{prescription.doctorSpecialization}</Text>
                  )}
                </View>
                <FileText size={28} color="#22c55e" />
              </View>

              <View style={styles.detailsSection}>
                {prescription.appointmentDate && (
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Appointment Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(prescription.appointmentDate)} {prescription.appointmentTime}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Download size={16} color="#6b7280" />
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Uploaded</Text>
                    <Text style={styles.detailValue}>{formatDate(prescription.uploadedAt)}</Text>
                  </View>
                </View>
              </View>

              {prescription.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Doctor's Notes</Text>
                  <Text style={styles.notesText}>{prescription.notes}</Text>
                </View>
              )}

              <Pressable
                onPress={() => handleViewPrescription(prescription.cloudinaryUrl)}
                style={({ pressed }) => [
                  styles.viewButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Download size={18} color="#ffffff" />
                <Text style={styles.viewButtonText}>View/Download</Text>
              </Pressable>
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
  prescriptionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  specialization: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailsSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  detailRow_last: {
    marginBottom: 0,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  notesSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  viewButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});

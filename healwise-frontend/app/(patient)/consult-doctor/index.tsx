import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Star, Clock, Phone, Info } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { PatientPrimaryButton } from '@/components/patient/PatientPrimaryButton';
import { patientScreenStyles as ps } from '@/styles/patientScreen';
import { getPublicDoctors, Doctor } from '@/services/doctorService';
import { useTranslation } from 'react-i18next';

export default function DoctorConsultation() {
  const router = useRouter();
  const { t } = useTranslation();

  const params = useLocalSearchParams<{ symptomId?: string }>();
  const symptomId = params.symptomId as string | undefined;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getPublicDoctors();
        setDoctors(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const goToBooking = (doctor: Doctor) => {
    router.push({
      pathname: '/(patient)/consult-doctor/booking',
      params: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        symptomId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, ps.pageBg]} />

      <PatientScreenHeader
        title={t('doctor_consult_title')}
        onBack={() => router.navigate('/(patient)/home' as Href)}
        colors={['#a855f7', '#ec4899']}
      />

      <ScrollView
        style={ps.scroll}
        contentContainerStyle={ps.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("doctor_available_title")}</Text>
          {loading ? (
            <Text style={styles.loadingText}>{t("doctor_loading")}</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : doctors.length === 0 ? (
            <Text style={styles.emptyText}>{t("doctor_empty")}</Text>
          ) : doctors.map((doctor) => (
            <Card key={doctor.id} style={[styles.doctorCard, { marginBottom: 16 }]}>
                <View style={styles.doctorInfoRow}>
                  {/* Placeholder avatar; backend does not provide image */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>
                      {doctor.name?.charAt(0) || 'D'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <View>
                        <Text style={styles.doctorName}>{doctor.name}</Text>
                      </View>
                      <View style={styles.feeColumn}>
                        <Text style={styles.feeText}>
                          {doctor.consultationFee
                            ? `PKR ${doctor.consultationFee}`
                            : t("doctor_fee_not_set")}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Star size={12} color="#eab308" fill="#eab308" />
                          <Text style={styles.ratingText}>{doctor.rating}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={styles.specialtyText}>{doctor.specialization || 'Doctor'}</Text>
                    {doctor.hospital && (
                      <Text style={styles.specialtyUrdu}>{doctor.hospital}</Text>
                    )}
                    
                    <View style={styles.experienceRow}>
                      <Text style={styles.expText}>
                        {doctor.experience
                          ? `${doctor.experience} exp.`
                          : t("doctor_experience_not_specified")}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#f3f4f6' }]}>
                        <Clock size={10} color="#6b7280" />
                        <Text style={[styles.statusText, { color: '#4b5563' }]}>
                          {t("doctor_online_consultation")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <PatientPrimaryButton
                  label={t('doctor_view_slots')}
                  variant="accent"
                  onPress={() => goToBooking(doctor)}
                  style={{ marginTop: 12 }}
                />
              </Card>
          ))}
        </View>

        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <Phone size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>{t("doctor_emergency_title")}</Text>
            <Text style={styles.emergencyText}>{t("doctor_emergency_text")}</Text>
          </View>
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL('tel:1122')}>
            <Text style={styles.callBtnText}>{t("doctor_emergency_call")}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1, marginTop: -20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 16 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6b7280' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  doctorCard: { padding: 16, borderRadius: 24, marginBottom: 16, elevation: 2 },
  doctorInfoRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  doctorNameUrdu: { fontSize: 12, color: '#6b7280' },
  feeColumn: { alignItems: 'flex-end' },
  feeText: { fontSize: 14, fontWeight: '700', color: '#a855f7' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  specialtyText: { fontSize: 14, color: '#374151' },
  specialtyUrdu: { fontSize: 12, color: '#9333ea', marginBottom: 8 },
  experienceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  expText: { fontSize: 12, color: '#6b7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    gap: 12,
    marginTop: 8,
  },
  emergencyIcon: { width: 40, height: 40, backgroundColor: '#ef4444', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  emergencyText: { fontSize: 12, color: '#b91c1c' },
  callBtn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  callBtnText: { color: 'white', fontWeight: '700', fontSize: 12 },
  disclaimer: { flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 4 },
  disclaimerText: { fontSize: 11, color: '#854d0e', flex: 1, lineHeight: 16 },
  loadingText: { fontSize: 12, color: '#6b7280' },
  errorText: { fontSize: 12, color: '#b91c1c' },
  emptyText: { fontSize: 12, color: '#6b7280' },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#4b5563' },
});

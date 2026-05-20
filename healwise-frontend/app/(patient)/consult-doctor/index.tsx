import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Video, 
  MessageCircle, 
  Star, 
  Clock, 
  Phone,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#a855f7", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable 
              onPress={() => router.back()} 
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>{t("doctor_consult_title")}</Text>
              {/* <Text style={styles.headerSubtitle}>{t("doctor_consult_subtitle")}</Text> */}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: '#f5f3ff' }]}>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>{t("doctor_stats_doctors")}</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>{t("doctor_stats_available")}</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>{t("doctor_stats_rating")}</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("doctor_available_title")}</Text>
          {loading ? (
            <Text style={styles.loadingText}>{t("doctor_loading")}</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : doctors.length === 0 ? (
            <Text style={styles.emptyText}>{t("doctor_empty")}</Text>
          ) : doctors.map((doctor) => (
            <Pressable
              key={doctor.id}
              onPress={() =>
                router.push({
                  pathname: '/(patient)/consult-doctor/booking',
                  params: {
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    symptomId,
                  },
                })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <Card style={styles.doctorCard}>
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

                <View style={styles.actionButtons}>
                  <Button 
                    title={t("doctor_view_slots")} 
                    style={styles.videoBtn}
                  />
                  <Button 
                    title={t("doctor_chat")} 
                    variant="outline" 
                    style={styles.chatBtn}
                  />
                </View>
              </Card>
            </Pressable>
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

        <View style={styles.disclaimer}>
          <Info size={14} color="#854d0e" />
          <Text style={styles.disclaimerText}>
            {t("doctor_disclaimer")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'white', opacity: 0.8 },
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
  actionButtons: { flexDirection: 'row', gap: 10 },
  videoBtn: { flex: 1, backgroundColor: '#a855f7', height: 40, borderRadius: 12 },
  chatBtn: { flex: 1, height: 40, borderRadius: 12, borderColor: '#a855f7' },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fef2f2', borderColor: '#fecaca', gap: 12 },
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

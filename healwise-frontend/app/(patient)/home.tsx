import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Thermometer,
  Pill,
  Shield,
  BookOpen,
  Video,
  FileText
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function HomeDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const features = [
    {
      icon: Thermometer,
      titleKey: 'home_symptom_title',
      subtitleKey: 'home_symptom_subtitle',
      descKey: 'home_symptom_desc',
      color: '#ef4444',
      route: '/(patient)/symptom-checker'
    },
    {
      icon: Pill,
      titleKey: 'home_medicine_compare_title',
      subtitleKey: 'home_medicine_compare_subtitle',
      descKey: 'home_medicine_compare_desc',
      color: '#3b82f6',
      route: '/(patient)/medicine-compare'
    },
    {
      icon: Shield,
      titleKey: 'home_medicine_awareness_title',
      subtitleKey: 'home_medicine_awareness_subtitle',
      descKey: 'home_medicine_awareness_desc',
      color: '#f97316',
      route: '/(patient)/medicine-awareness'
    },
    {
      icon: BookOpen,
      titleKey: 'home_health_edu_title',
      subtitleKey: 'home_health_edu_subtitle',
      descKey: 'home_health_edu_desc',
      color: '#22c55e',
      route: '/(patient)/health-tips'
    },
    {
      icon: FileText,
      titleKey: 'home_prescription_title',
      subtitleKey: 'home_prescription_subtitle',
      descKey: 'home_prescription_desc',
      color: '#06b6d4',
      route: '/(patient)/prescriptions'
    },
    {
      icon: Video,
      titleKey: 'home_doctor_title',
      subtitleKey: 'home_doctor_subtitle',
      descKey: 'home_doctor_desc',
      color: '#a855f7',
      route: '/consult-doctor'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      {/* Header */}
      <LinearGradient
        colors={["#22c55e", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{t('home_welcome')}</Text>
              <Text style={styles.headerSubtitle}>{t('home_welcome_urdu')}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {features.map((feature, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(feature.route as any)}
              style={({ pressed }: { pressed: boolean }) => [
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
            >
              <Card style={styles.featureCard}>
                <View style={styles.cardInner}>
                  <View style={[styles.iconBox, { backgroundColor: feature.color }]}>
                    <feature.icon size={24} color="white" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                    <Text style={styles.featureSubtitle}>{t(feature.subtitleKey)}</Text>
                    <Text style={styles.featureDesc}>{t(feature.descKey)}</Text>
                  </View>
                  <ChevronRight size={20} color="#d1d5db" />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { marginTop: 20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 16, color: "#FFFFFF", opacity: 0.9 },
  scrollView: { flex: 1, marginTop: -20 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  grid: { gap: 16 },
  featureCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  featureSubtitle: { fontSize: 14, color: '#4b5563', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#9ca3af' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280' },
});
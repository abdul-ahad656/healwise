import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Thermometer,
  Pill,
  Shield,
  BookOpen,
  Video,
} from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { patientScreenStyles as s } from '@/styles/patientScreen';
import { useTranslation } from 'react-i18next';

export default function HomeDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const features = [
    {
      icon: Thermometer,
      titleKey: 'home_symptom_title',
      descKey: 'home_symptom_desc',
      color: '#ef4444',
      route: '/(patient)/symptom-checker',
    },
    {
      icon: Pill,
      titleKey: 'home_medicine_compare_title',
      descKey: 'home_medicine_compare_desc',
      color: '#3b82f6',
      route: '/(patient)/medicine-compare',
    },
    {
      icon: Shield,
      titleKey: 'home_medicine_awareness_title',
      descKey: 'home_medicine_awareness_desc',
      color: '#f97316',
      route: '/(patient)/medicine-awareness',
    },
    {
      icon: BookOpen,
      titleKey: 'home_health_edu_title',
      descKey: 'home_health_edu_desc',
      color: '#22c55e',
      route: '/(patient)/health-tips',
    },
    {
      icon: Video,
      titleKey: 'home_doctor_title',
      descKey: 'home_doctor_desc',
      color: '#a855f7',
      route: '/(patient)/consult-doctor',
    },
  ];

  return (
    <View style={s.container}>
      <View style={[StyleSheet.absoluteFill, s.pageBg]} />

      <PatientScreenHeader title={t('home_welcome')} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {features.map((feature, index) => (
          <Pressable
            key={index}
            onPress={() => router.push(feature.route as any)}
            style={({ pressed }) => [
              styles.featurePressable,
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Card style={styles.featureCard}>
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: feature.color }]}>
                  <feature.icon size={24} color="white" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                  <Text style={styles.featureDesc}>{t(feature.descKey)}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  featurePressable: {
    marginBottom: 16,
  },
  featureCard: {
    padding: 18,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});

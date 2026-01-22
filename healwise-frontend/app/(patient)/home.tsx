import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronRight, 
  Thermometer, 
  Pill, 
  Shield, 
  BookOpen, 
  Video 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';

export default function HomeDashboard() {
  const router = useRouter();

  const features = [
    {
      icon: Thermometer,
      title: 'Symptom Checker',
      subtitle: 'علامات کی جانچ',
      description: 'Check your symptoms with AI',
      color: '#ef4444',
      route: '/symptom-checker'
    },
    {
      icon: Pill,
      title: 'Medicine Comparison',
      subtitle: 'دوا کا موازنہ',
      description: 'Compare medicine prices',
      color: '#3b82f6',
      route: '/(patient)/medicine-compare'
    },
    {
      icon: Shield,
      title: 'Medicine Awareness',
      subtitle: 'دوا کی آگاہی',
      description: 'Check drug interactions',
      color: '#f97316',
      route: '/(patient)/medicine-awareness'
    },
    {
      icon: BookOpen,
      title: 'Health Education',
      subtitle: 'صحت کی تعلیم',
      description: 'Learn about health topics',
      color: '#22c55e',
      route: '/(patient)/health-tips'
    },
    {
      icon: Video,
      title: 'Doctor Consultation',
      subtitle: 'ڈاکٹر سے مشورہ',
      description: 'Talk to qualified doctors',
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
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Welcome to HealWise</Text>
              <Text style={styles.headerSubtitle}>HealWise میں خوش آمدید</Text>
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
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                    <Text style={styles.featureDesc}>{feature.description}</Text>
                  </View>
                  <ChevronRight size={20} color="#d1d5db" />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={styles.statValue}>24/7</Text>
            <Text style={styles.statLabel}>Available</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </Card>
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
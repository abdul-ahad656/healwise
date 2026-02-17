import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#0f766e', '#22c55e']}
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
              <Text style={styles.headerTitle}>Analytics</Text>
              <Text style={styles.headerSubtitle}>
                High-level overview of platform activity
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.metricLabel}>Total Registered Users</Text>
          <Text style={styles.metricValue}>—</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.metricLabel}>Total Appointments</Text>
          <Text style={styles.metricValue}>—</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.metricLabel}>Health Tips Published</Text>
          <Text style={styles.metricValue}>—</Text>
        </Card>
        <Text style={styles.hintText}>
          Backend analytics endpoints can be integrated later to populate these
          metrics in real time.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  scroll: { flex: 1, marginTop: -16 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  card: {
    padding: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  hintText: {
    marginTop: 16,
    fontSize: 12,
    color: '#6b7280',
  },
});

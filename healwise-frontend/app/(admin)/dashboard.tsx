import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, UserCog, Activity, FileText, Pill } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
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
            <View>
              <Text style={styles.headerTitle}>Admin Panel</Text>
              <Text style={styles.headerSubtitle}>Manage doctors, content, and insights</Text>
            </View>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [
                styles.logoutPill,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <Pressable
            onPress={() => router.push('/(admin)/manage-doctors')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.cardIcon}>
                <UserCog size={20} color="#0f172a" />
              </View>
              <Text style={styles.cardTitle}>Manage Doctors</Text>
              <Text style={styles.cardSubtitle}>
                Approve, disable, and create doctor accounts
              </Text>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(admin)/manage-health-tips')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.cardIcon}>
                <FileText size={20} color="#0f172a" />
              </View>
              <Text style={styles.cardTitle}>Health Tips</Text>
              <Text style={styles.cardSubtitle}>
                Publish and deactivate health tips
              </Text>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(admin)/manage-medicine')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.cardIcon}>
                <Pill size={20} color="#0f172a" />
              </View>
              <Text style={styles.cardTitle}>Medicine Types</Text>
              <Text style={styles.cardSubtitle}>
                Edit awareness content for medicine types
              </Text>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(admin)/analytics')}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Card style={styles.card}>
              <View style={styles.cardIcon}>
                <Activity size={20} color="#0f172a" />
              </View>
              <Text style={styles.cardTitle}>Analytics</Text>
              <Text style={styles.cardSubtitle}>
                View system usage and key metrics
              </Text>
            </Card>
          </Pressable>
        </View>
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
    justifyContent: 'space-between',
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
  logoutPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(248,250,252,0.2)',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  grid: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});

import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, History, LogOut } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

export default function DoctorProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#1d4ed8', '#22c55e']}
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
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>History and account actions</Text>
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
          <Pressable
            onPress={() => router.push('/(doctor)/history')}
            style={({ pressed }) => [
              styles.rowItem,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={styles.iconCircle}>
              <History size={18} color="#111827" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Appointment history</Text>
              <Text style={styles.rowSubtitle}>View and manage all past appointments</Text>
            </View>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed }) => [
              styles.rowItem,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
              <LogOut size={18} color="#b91c1c" />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: '#b91c1c' }]}>Logout</Text>
              <Text style={styles.rowSubtitle}>Sign out from your doctor account</Text>
            </View>
          </Pressable>
        </Card>
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
  scroll: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    marginTop: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    marginLeft: 10,
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});


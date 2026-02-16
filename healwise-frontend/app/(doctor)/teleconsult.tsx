import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

export default function TeleconsultScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f9fafb' }]} />

      <LinearGradient
        colors={['#a855f7', '#ec4899']}
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
              <Text style={styles.headerTitle}>Teleconsultation</Text>
              <Text style={styles.headerSubtitle}>Connect with patients via video</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <Card style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Video interface coming soon</Text>
          <Text style={styles.placeholderText}>
            This will show live video calls and chat with your patients.
          </Text>
        </Card>
      </View>
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
  placeholderCard: {
    padding: 20,
    borderRadius: 20,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: '#6b7280',
  },
});

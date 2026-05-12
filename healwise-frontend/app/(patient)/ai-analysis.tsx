import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain } from 'lucide-react-native';
import { Card } from '@/components/ui/card';

/**
 * Placeholder route so Expo Router has a valid default export.
 * Deep links to AI symptom analysis should use symptom-checker + result flow.
 */
export default function AiAnalysisScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0ea5e9', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <Brain size={28} color="#fff" />
            <Text style={styles.title}>AI analysis</Text>
            <Text style={styles.subtitle}>
              Get AI-assisted insights from your symptoms.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        <Card style={styles.card}>
          <Text style={styles.bodyText}>
            Use the symptom checker to describe how you feel. After analysis, you can review
            results and consult a doctor if needed.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/(patient)/symptom-checker')}
          >
            <Text style={styles.buttonLabel}>Open symptom checker</Text>
          </Pressable>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerInner: { paddingHorizontal: 24, paddingTop: 8, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  card: { padding: 18, borderRadius: 16, gap: 16 },
  bodyText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

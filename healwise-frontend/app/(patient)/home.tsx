import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PatientHomeScreen() {
  const router = useRouter();

  const features = [
    { name: 'Symptom Checker', route: '/(patient)/symptom-checker', icon: 'heart.fill' },
    { name: 'AI Analysis', route: '/(patient)/ai-analysis', icon: 'sparkles' },
    { name: 'Consult Doctor', route: '/(patient)/consult-doctor', icon: 'person.2.fill' },
    { name: 'Appointments', route: '/(patient)/appointments', icon: 'calendar' },
    { name: 'Medicine Compare', route: '/(patient)/medicine-compare', icon: 'pills.fill' }, // customized icon name if valid
    { name: 'Medical Reports', route: '/(patient)/medical-reports', icon: 'doc.text.fill' },
    { name: 'Health Tips', route: '/(patient)/health-tips', icon: 'leaf.fill' },
    { name: 'Medicine Awareness', route: '/(patient)/medicine-awareness', icon: 'info.circle.fill' },
    { name: 'Feedback', route: '/(patient)/feedback', icon: 'envelope.fill' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Welcome, Patient</ThemedText>
          <ThemedText style={styles.subtitle}>How can we help you today?</ThemedText>
        </View>

        <View style={styles.grid}>
          {features.map((feature, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card} 
              onPress={() => router.push(feature.route as any)}
            >
              {/* Note: Icon names might need adjustment based on available SF Symbols or mapping */}
              <IconSymbol size={32} name={feature.icon as any} color="#0a7ea4" />
              <ThemedText style={styles.cardText}>{feature.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  subtitle: {
    marginTop: 5,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

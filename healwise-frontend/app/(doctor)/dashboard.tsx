import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DoctorDashboard() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Doctor Dashboard</ThemedText>
      
      <View style={styles.links}>
        <Link href="/(doctor)/patients" asChild>
          <ThemedText type="link">My Patients</ThemedText>
        </Link>
        <Link href="/(doctor)/teleconsult" asChild>
          <ThemedText type="link">Teleconsultation</ThemedText>
        </Link>
        <Link href="/(doctor)/upload-prescription" asChild>
          <ThemedText type="link">Upload Prescription</ThemedText>
        </Link>
        <Link href="/(doctor)/history" asChild>
          <ThemedText type="link">History</ThemedText>
        </Link>
        <Link href="/(auth)/login" asChild>
          <ThemedText type="link" style={{marginTop: 20, color: 'red'}}>Logout</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  links: {
    marginTop: 30,
    gap: 15,
    alignItems: 'center',
  },
});

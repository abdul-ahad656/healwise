import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PatientsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">My Patients</ThemedText>
      <ThemedText>List of patients assigned to you.</ThemedText>
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
});

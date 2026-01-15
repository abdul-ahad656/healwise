import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function UploadPrescriptionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Upload Prescription</ThemedText>
      <ThemedText>Form to upload patient prescriptions.</ThemedText>
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

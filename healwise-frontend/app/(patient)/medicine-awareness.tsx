import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MedicineAwarenessScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Medicine Awareness</ThemedText>
      <ThemedText>Learn about medicines and side effects.</ThemedText>
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

import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TeleconsultScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Teleconsultation</ThemedText>
      <ThemedText>Video consultation interface.</ThemedText>
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

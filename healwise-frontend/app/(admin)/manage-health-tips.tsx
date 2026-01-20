import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ManageHealthTipsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Manage Health Tips</ThemedText>
      <ThemedText>Create and publish health tips.</ThemedText>
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

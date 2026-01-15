import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ManageDoctorsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Manage Doctors</ThemedText>
      <ThemedText>Add, remove, or edit doctor profiles.</ThemedText>
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

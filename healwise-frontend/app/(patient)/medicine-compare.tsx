import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MedicineCompareScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Medicine Compare</ThemedText>
      <ThemedText>Compare medicines and prices.</ThemedText>
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

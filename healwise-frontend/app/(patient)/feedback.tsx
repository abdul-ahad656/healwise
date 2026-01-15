import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FeedbackScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Feedback</ThemedText>
      <ThemedText>Give us your feedback.</ThemedText>
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

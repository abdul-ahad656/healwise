import { StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Implement logout logic
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Profile</ThemedText>
      <ThemedText style={styles.text}>User Profile Details</ThemedText>
      
      <Button title="Logout" onPress={handleLogout} color="#d9534f" />
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
  title: {
    marginBottom: 20,
  },
  text: {
    marginBottom: 40,
  },
});

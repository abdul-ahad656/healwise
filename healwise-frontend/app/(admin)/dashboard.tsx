import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AdminDashboard() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Admin Dashboard</ThemedText>
      
      <View style={styles.links}>
        <Link href="/(admin)/manage-doctors" asChild>
          <ThemedText type="link">Manage Doctors</ThemedText>
        </Link>
        <Link href="/(admin)/manage-health-tips" asChild>
          <ThemedText type="link">Manage Health Tips</ThemedText>
        </Link>
        <Link href="/(admin)/manage-medicine" asChild>
          <ThemedText type="link">Manage Medicine</ThemedText>
        </Link>
        <Link href="/(admin)/analytics" asChild>
          <ThemedText type="link">Analytics</ThemedText>
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function LandingScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Healwise</ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>Welcome to Healwise App</ThemedText>

      <View style={styles.linkContainer}>
        <Link href="/(auth)/login" asChild>
          <ThemedText type="link">Login</ThemedText>
        </Link>
        <Link href="/(auth)/register" asChild>
          <ThemedText type="link">Register</ThemedText>
        </Link>
      </View>

      <View style={styles.divider} />

      <ThemedText type="defaultSemiBold">Dev Links:</ThemedText>
      <View style={styles.linkContainer}>
        <Link href="/(patient)/home" asChild>
          <ThemedText type="link">Patient Home</ThemedText>
        </Link>
        <Link href="/(doctor)/dashboard" asChild>
          <ThemedText type="link">Doctor Dashboard</ThemedText>
        </Link>
        <Link href="/(admin)/dashboard" asChild>
          <ThemedText type="link">Admin Dashboard</ThemedText>
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
  title: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 30,
  },
  linkContainer: {
    marginTop: 20,
    gap: 15,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
    marginVertical: 30,
  },
});

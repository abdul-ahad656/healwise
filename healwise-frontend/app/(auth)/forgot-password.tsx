import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    // Implement reset logic here
    console.log('Reset password for:', email);
    alert('Reset link sent to your email');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Forgot Password</ThemedText>
      <ThemedText style={styles.subtitle}>Enter your email to receive a reset link</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#888"
      />

      <TouchableOpacity onPress={handleReset} style={styles.button}>
        <ThemedText style={styles.buttonText}>Send Reset Link</ThemedText>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Link href="/(auth)/login" asChild>
          <ThemedText type="link">Back to Login</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

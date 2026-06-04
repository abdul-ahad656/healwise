import { Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { applyEnglishLocale } from '@/utils/locale';

export default function AuthLayout() {
  useFocusEffect(
    useCallback(() => {
      applyEnglishLocale();
    }, [])
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="language" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthStore from '@/services/authStore';
import { applyEnglishLocale, applyPatientLocale } from '@/utils/locale';
import Constants from 'expo-constants';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const publishableKey = Constants.expoConfig?.extra?.stripePublishableKey || '';

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const user = AuthStore.getUser();
    if (!user) {
      applyEnglishLocale();
    } else if (user.role === 'patient') {
      applyPatientLocale(user.language);
    } else {
      applyEnglishLocale();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={publishableKey}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(patient)" options={{ headerShown: false }} />
            <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}

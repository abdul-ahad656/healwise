import { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { applyEnglishLocale } from '@/utils/locale';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBrandIcon } from '@/components/AppBrandIcon';
import { APP_NAME } from '@/constants/branding';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    applyEnglishLocale();
  }, []);

  const handleContinue = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#ffffff', '#eff6ff']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.circle, styles.circleTopLeft]} />
      <View style={[styles.circle, styles.circleTopRight]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />
      <View style={[styles.circle, styles.circleBottomRight]} />

      <SafeAreaView style={styles.content}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoContainer}>
            <AppBrandIcon size={128} style={styles.logoImage} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{APP_NAME}</Text>
            <LinearGradient
              colors={['#22c55e', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
            <Text style={styles.subtitle}>Your Smart Health Companion</Text>
            <Text style={styles.subtitleUrdu}>آپ کا ذہین صحت ساتھی</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable onPress={handleContinue}>
            {({ pressed }) => (
              <LinearGradient
                colors={pressed ? ['#16a34a', '#2563eb'] : ['#22c55e', '#3b82f6']}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started / شروع کریں</Text>
                <Sparkles size={18} color="white" />
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  circleTopLeft: {
    top: 40,
    left: 40,
    backgroundColor: '#bbf7d0',
    width: 80,
    height: 80,
  },
  circleTopRight: {
    top: 120,
    right: 30,
    backgroundColor: '#bfdbfe',
    width: 60,
    height: 60,
  },
  circleBottomLeft: {
    bottom: 200,
    left: 20,
    backgroundColor: '#86efac',
    width: 50,
    height: 50,
  },
  circleBottomRight: {
    bottom: 100,
    right: 50,
    backgroundColor: '#93c5fd',
    width: 90,
    height: 90,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  logoImage: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  underline: {
    width: 64,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleUrdu: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 5,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

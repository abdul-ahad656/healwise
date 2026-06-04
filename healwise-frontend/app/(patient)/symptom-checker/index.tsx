import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Mic, MicOff, Search, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { analyzeSymptoms } from '@/services/symptomService';
import {
  getVoiceModule,
  isVoiceNativeLinked,
  isVoicePlatformSupported,
} from '@/services/voiceRecognition';
import { useTranslation } from 'react-i18next';

export default function SymptomChecker() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVoiceSupported = isVoicePlatformSupported();
  const isVoiceLinked = isVoiceNativeLinked();

  useEffect(() => {
    if (!isVoiceSupported || !isVoiceLinked || !isFocused) return;

    const Voice = getVoiceModule();
    if (!Voice) return;

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      if (isFocused) {
        setError(t("speech_error"));
        setIsListening(false);
        console.error(e);
      }
    };
    Voice.onSpeechResults = (e) => {
      if (isFocused && e.value && e.value[0]) {
        setSymptoms((prev) => prev + (prev ? " " : "") + e.value![0]);
      }
    };

    return () => {
      Voice.destroy()
        .then(() => {
          try {
            Voice.removeAllListeners();
          } catch {}
        })
        .catch(() => {
          try {
            Voice.removeAllListeners();
          } catch {}
        });
    };
  }, [isVoiceSupported, isVoiceLinked, isFocused, t]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSymptoms('');
        setError(null);
      };
    }, [])
  );

  const toggleListening = async () => {
    try {
      if (!isVoiceSupported) {
        setError("Voice input is not supported on this platform");
        return;
      }
      if (!isVoiceLinked) {
        setError(t("voice_native_unavailable"));
        return;
      }
      const Voice = getVoiceModule();
      if (!Voice) {
        setError(t("voice_native_unavailable"));
        return;
      }
      if (isListening) {
        await Voice.stop();
      } else {
        setError(null);
        await Voice.start('en-US');
      }
    } catch (e) {
      console.error(e);
      setError(t("speech_error"));
    }
  };

  const handleCheck = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSymptoms(symptoms);
      router.push({
        pathname: "/(patient)/symptom-checker/result",
        params: { data: JSON.stringify(result) }
      });
      } catch (error: any) {
      setError(error.message || t("generic_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fef2f2", "#ffffff", "#fff7ed"]}
        style={StyleSheet.absoluteFill}
      />

      <PatientScreenHeader
        title={t('symptom_checker_title')}
        colors={['#ef4444', '#f97316']}
        onBack={() => router.navigate('/(patient)/home' as Href)}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={styles.errorCard}>
            <Info size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t("describe_symptoms")}</Text>
          
          <View style={[styles.inputContainer, isListening && styles.inputActive]}>
            <TextInput
              placeholder={isListening ? t("symptom_placeholder_listening") : t("symptom_placeholder_typing")}
              placeholderTextColor={isListening ? "#ef4444" : "#9CA3AF"}
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              style={styles.input}
            />
            
            <Pressable 
              onPress={toggleListening}
              style={[styles.micButton, isListening && styles.micButtonActive]}
            >
              {isListening ? (
                <MicOff size={20} color="white" />
              ) : (
                <Mic size={20} color="#6b7280" />
              )}
            </Pressable>
          </View>

          {!isVoiceLinked && isVoiceSupported && (
            <Text style={styles.voiceUnavailableHint}>{t("voice_native_unavailable")}</Text>
          )}
          {isListening && (
            <Text style={styles.listeningHint}>{t("listening_hint")}</Text>
          )}

          <Pressable
            onPress={handleCheck}
            disabled={!symptoms.trim() || loading || isListening}
            style={({ pressed }) => [
              styles.checkButtonWrapper,
              (!symptoms.trim() || loading || isListening) && { opacity: 0.5 },
              pressed && { opacity: 0.9 }
            ]}
          >
            <LinearGradient
              colors={["#ef4444", "#f97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Search size={20} color="white" />
                  <Text style={styles.checkButtonText}>{t("analyze_symptoms")}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  card: { padding: 20, borderRadius: 20, backgroundColor: 'white', elevation: 5 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 16 },
  inputContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 150,
    marginBottom: 12,
  },
  inputActive: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  input: { fontSize: 16, color: '#1f2937', textAlignVertical: 'top', flex: 1, lineHeight: 24 },
  micButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  micButtonActive: { backgroundColor: '#ef4444' },
  micButtonDisabled: { opacity: 0.55 },
  voiceUnavailableHint: { fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 18 },
  listeningHint: { textAlign: 'center', color: '#ef4444', fontSize: 12, marginBottom: 15, fontWeight: '500' },
  checkButtonWrapper: { borderRadius: 12, overflow: 'hidden' },
  checkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  checkButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', marginBottom: 20, gap: 12 },
  errorText: { flex: 1, color: '#ef4444', fontSize: 14 },
});

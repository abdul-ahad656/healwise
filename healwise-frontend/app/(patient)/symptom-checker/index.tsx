import React, { useState, useEffect, useCallback } from 'react';
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
import { Mic, MicOff, Search, Info, Plus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import {
  analyzeSymptoms,
  suggestSymptoms,
  resolveSymptomsToEnglish,
  formatSymptomLabel,
} from '@/services/symptomService';
import {
  getVoiceModule,
  getVoiceRecognitionLocale,
  isBenignSpeechError,
  isVoiceNativeLinked,
  isVoicePlatformSupported,
} from '@/services/voiceRecognition';
import { useTranslation } from 'react-i18next';

export default function SymptomChecker() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { t, i18n } = useTranslation();

  const [symptomInput, setSymptomInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationNote, setTranslationNote] = useState<string | null>(null);

  const voiceLocale = getVoiceRecognitionLocale(i18n.language);

  const isVoiceSupported = isVoicePlatformSupported();
  const isVoiceLinked = isVoiceNativeLinked();

  const fetchSuggestions = useCallback(async (updatedSymptoms: string[]) => {
    if (updatedSymptoms.length === 0) {
      setSuggestions([]);
      setCanAnalyze(false);
      return;
    }

    setLoadingSuggestions(true);
    setError(null);
    try {
      const result = await suggestSymptoms(updatedSymptoms);
      setSelectedSymptoms(result.selected_symptoms);
      setSuggestions(result.suggestions);
      setCanAnalyze(result.can_analyze);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('generic_error');
      setError(message);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [t]);

  const handleAddSymptom = useCallback(
    async (raw: string) => {
      if (!raw.trim()) return;

      setError(null);
      setTranslationNote(null);
      try {
        const resolved = await resolveSymptomsToEnglish(raw.trim());
        const newcomers = resolved.symptoms.filter(
          (token) => !selectedSymptoms.includes(token)
        );
        if (newcomers.length === 0) {
          setError(t('symptom_duplicate'));
          return;
        }

        const translated = resolved.mappings.filter(
          (m) => m.input.trim() !== m.english.trim()
        );
        if (translated.length > 0) {
          setTranslationNote(
            translated.map((m) => `${m.input} → ${m.english}`).join(', ')
          );
        }

        setSymptomInput('');
        const updated = [...selectedSymptoms, ...newcomers];
        setSelectedSymptoms(updated);
        await fetchSuggestions(updated);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t('generic_error');
        setError(message);
      }
    },
    [selectedSymptoms, fetchSuggestions, t]
  );

  const handleRemoveSymptom = useCallback(
    async (symptom: string) => {
      const updated = selectedSymptoms.filter((s) => s !== symptom);
      setSelectedSymptoms(updated);
      setError(null);
      await fetchSuggestions(updated);
    },
    [selectedSymptoms, fetchSuggestions]
  );

  const handleAnalyze = async () => {
    if (!canAnalyze || selectedSymptoms.length < 3) return;

    const text = selectedSymptoms.map((s) => formatSymptomLabel(s)).join(', ');
    setPredictionLoading(true);
    setError(null);
    try {
      const result = await analyzeSymptoms(text);
      router.push({
        pathname: '/(patient)/symptom-checker/result',
        params: { data: JSON.stringify(result) },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('generic_error');
      setError(message);
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    if (!isVoiceSupported || !isVoiceLinked || !isFocused) return;

    const Voice = getVoiceModule();
    if (!Voice) return;

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      if (!isFocused) return;
      setIsListening(false);
      if (isBenignSpeechError(e)) {
        setError(t('speech_no_match'));
        return;
      }
      setError(t('speech_error'));
    };
    Voice.onSpeechResults = (e) => {
      if (!isFocused || !e.value?.[0]) return;
      void (async () => {
        try {
          const resolved = await resolveSymptomsToEnglish(e.value![0]);
          const label = resolved.symptoms.map((s) => formatSymptomLabel(s)).join(', ');
          setSymptomInput(label || e.value![0]);
          const translated = resolved.mappings.filter(
            (m) => m.input.trim() !== m.english.trim()
          );
          if (translated.length > 0) {
            setTranslationNote(
              translated.map((m) => `${m.input} → ${m.english}`).join(', ')
            );
          }
        } catch {
          setSymptomInput(e.value![0]);
        }
      })();
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
        setSymptomInput('');
        setSelectedSymptoms([]);
        setSuggestions([]);
        setCanAnalyze(false);
        setError(null);
        setTranslationNote(null);
      };
    }, [])
  );

  const toggleListening = async () => {
    try {
      if (!isVoiceSupported) {
        setError('Voice input is not supported on this platform');
        return;
      }
      if (!isVoiceLinked) {
        setError(t('voice_native_unavailable'));
        return;
      }
      const Voice = getVoiceModule();
      if (!Voice) {
        setError(t('voice_native_unavailable'));
        return;
      }
      if (isListening) {
        await Voice.stop();
      } else {
        setError(null);
        await Voice.start(voiceLocale);
      }
    } catch (e) {
      if (isBenignSpeechError(e)) {
        setError(t('speech_no_match'));
        return;
      }
      setError(t('speech_error'));
    }
  };

  const onSubmitInput = () => {
    if (symptomInput.trim()) {
      void handleAddSymptom(symptomInput);
    }
  };

  const busy = loadingSuggestions || predictionLoading || isListening;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fef2f2', '#ffffff', '#fff7ed']}
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
          <Text style={styles.cardTitle}>{t('describe_symptoms')}</Text>

          <View style={[styles.inputContainer, isListening && styles.inputContainerActive]}>
            <TextInput
              placeholder={
                isListening
                  ? t('symptom_placeholder_listening')
                  : t('symptom_add_placeholder')
              }
              placeholderTextColor={isListening ? '#ef4444' : '#9CA3AF'}
              value={symptomInput}
              onChangeText={setSymptomInput}
              onSubmitEditing={onSubmitInput}
              returnKeyType="done"
              style={styles.input}
              multiline
              numberOfLines={2}
              editable={!busy}
            />

            <View style={styles.inputActions}>
              <Pressable
                onPress={toggleListening}
                style={[styles.micButton, isListening && styles.micButtonActive]}
                disabled={predictionLoading}
              >
                {isListening ? (
                  <MicOff size={18} color="white" />
                ) : (
                  <Mic size={18} color="#6b7280" />
                )}
              </Pressable>

              <Pressable
                onPress={onSubmitInput}
                disabled={!symptomInput.trim() || busy}
                style={[
                  styles.addButton,
                  (!symptomInput.trim() || busy) && styles.addButtonDisabled,
                ]}
              >
                <Plus size={18} color="white" />
                <Text style={styles.addButtonText}>{t('symptom_add_button')}</Text>
              </Pressable>
            </View>
          </View>

          {!isVoiceLinked && isVoiceSupported && (
            <Text style={styles.voiceUnavailableHint}>{t('voice_native_unavailable')}</Text>
          )}
          {i18n.language?.startsWith('ur') && (
            <Text style={styles.voiceUnavailableHint}>{t('symptom_voice_urdu_hint')}</Text>
          )}
          {isListening && (
            <Text style={styles.listeningHint}>{t('listening_hint')}</Text>
          )}

          {selectedSymptoms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('symptom_selected_title')}</Text>
              <View style={styles.chipsRow}>
                {selectedSymptoms.map((symptom) => (
                  <Pressable
                    key={symptom}
                    onPress={() => void handleRemoveSymptom(symptom)}
                    style={styles.selectedChip}
                    disabled={busy}
                  >
                    <Text style={styles.selectedChipText}>
                      {formatSymptomLabel(symptom)}
                    </Text>
                    <X size={14} color="#b91c1c" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {selectedSymptoms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('symptom_suggestions_title')}</Text>
              {loadingSuggestions ? (
                <ActivityIndicator color="#ef4444" style={styles.suggestionsLoader} />
              ) : suggestions.length > 0 ? (
                <View style={styles.chipsRow}>
                  {suggestions.map((symptom) => (
                    <Pressable
                      key={symptom}
                      onPress={() => void handleAddSymptom(symptom)}
                      style={styles.suggestionChip}
                      disabled={busy}
                    >
                      <Text style={styles.suggestionChipText}>
                        {formatSymptomLabel(symptom)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSuggestionsText}>{t('symptom_no_suggestions')}</Text>
              )}
            </View>
          )}

          {!canAnalyze && selectedSymptoms.length > 0 && (
            <Text style={styles.hintText}>{t('symptom_min_three_hint')}</Text>
          )}

          <Pressable
            onPress={() => void handleAnalyze()}
            disabled={!canAnalyze || busy}
            style={({ pressed }) => [
              styles.checkButtonWrapper,
              (!canAnalyze || busy) && { opacity: 0.5 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={['#ef4444', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkButton}
            >
              {predictionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Search size={20} color="white" />
                  <Text style={styles.checkButtonText}>{t('analyze_symptoms')}</Text>
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  inputContainerActive: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  input: {
    minHeight: 56,
    maxHeight: 96,
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
    textAlignVertical: 'top',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  micButtonActive: { backgroundColor: '#ef4444' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  addButtonDisabled: { opacity: 0.45 },
  voiceUnavailableHint: { fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 18 },
  listeningHint: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  selectedChipText: { fontSize: 14, fontWeight: '600', color: '#b91c1c' },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  suggestionChipText: { fontSize: 14, fontWeight: '600', color: '#c2410c' },
  suggestionsLoader: { marginVertical: 8 },
  noSuggestionsText: { fontSize: 13, color: '#9ca3af', lineHeight: 20 },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  checkButtonWrapper: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  checkButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 20,
    gap: 12,
  },
  errorText: { flex: 1, color: '#ef4444', fontSize: 14 },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
    gap: 10,
  },
  noteText: { flex: 1, color: '#047857', fontSize: 13, lineHeight: 20 },
});

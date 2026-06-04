import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, DollarSign, Star, Info, Mic, MicOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { PatientScreenHeader } from '@/components/patient/PatientScreenHeader';
import { compareMedicines, getMedicineSuggestions, getMedicinePotencies, CompareResult, MedicineSuggestion } from '@/services/medicineService';
import { useTranslation } from 'react-i18next';
import {
  getVoiceModule,
  isVoiceNativeLinked,
  isVoicePlatformSupported,
} from '@/services/voiceRecognition';

export default function MedicineComparison() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const [strength, setStrength] = useState('');
  const [potencies, setPotencies] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingPotencies, setLoadingPotencies] = useState(false);
  const [results, setResults] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { t } = useTranslation();

  const isVoiceSupported = isVoicePlatformSupported();
  const isVoiceLinked = isVoiceNativeLinked();

  useEffect(() => {
    if (!isVoiceSupported || !isVoiceLinked || !isFocused) return;

    const Voice = getVoiceModule();
    if (!Voice) return;

    Voice.onSpeechStart = () => {
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (e) => {
      if (isFocused && e.value && e.value[0]) {
        setSearchTerm(e.value[0]);
        setSelectedMedicineName('');
        setStrength('');
        setPotencies([]);
      }
    };

    Voice.onSpeechError = (e) => {
      if (isFocused) {
        setIsListening(false);
        console.error('Voice error:', e);
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
  }, [isVoiceSupported, isVoiceLinked, isFocused]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSearchTerm('');
        setSelectedMedicineName('');
        setStrength('');
        setPotencies([]);
        setSuggestions([]);
        setShowSuggestions(false);
        setResults(null);
        setError(null);
      };
    }, [])
  );

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (selectedMedicineName && query.toLowerCase() === selectedMedicineName.toLowerCase()) {
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await getMedicineSuggestions(query);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Suggestions error:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedMedicineName]);

  useEffect(() => {
    if (!selectedMedicineName) {
      setPotencies([]);
      setStrength('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingPotencies(true);
      try {
        const data = await getMedicinePotencies(selectedMedicineName);
        if (cancelled) return;
        setPotencies(data.potencies);
        setSelectedMedicineName(data.medicine || selectedMedicineName);
        setSearchTerm(data.medicine || selectedMedicineName);
        setStrength((prev) =>
          data.potencies.includes(prev) ? prev : ''
        );
      } catch (err) {
        console.error('Potencies error:', err);
        if (!cancelled) setPotencies([]);
      } finally {
        if (!cancelled) setLoadingPotencies(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMedicineName]);

  const handleMedicineNameChange = (text: string) => {
    setSearchTerm(text);
    if (selectedMedicineName && text.trim().toLowerCase() !== selectedMedicineName.toLowerCase()) {
      setSelectedMedicineName('');
      setStrength('');
      setPotencies([]);
    }
  };

  const handleSelectSuggestion = (item: MedicineSuggestion) => {
    setSearchTerm(item.name);
    setSelectedMedicineName(item.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setStrength('');
    setResults(null);
    setError(null);
  };

  const startListening = async () => {
    try {
      if (!isVoiceSupported) {
        Alert.alert('Error', 'Voice input is not supported on this platform');
        return;
      }
      if (!isVoiceLinked) {
        Alert.alert('Error', 'Voice recognition is not available');
        return;
      }
      const Voice = getVoiceModule();
      if (!Voice) {
        Alert.alert('Error', 'Voice recognition is not available');
        return;
      }
      setError(null);
      await Voice.start('en-US');
    } catch (err) {
      console.error('Start listening error:', err);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      const Voice = getVoiceModule();
      if (Voice) {
        await Voice.stop();
      }
    } catch (err) {
      console.error('Stop listening error:', err);
    }
  };

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const handleSearch = async () => {
    const name = (selectedMedicineName || searchTerm).trim();
    const potency = strength.trim();

    if (!name || !potency) {
      setError(t('medicine_strength_required'));
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const data = await compareMedicines(name, potency);
      setResults(data);
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('required')) {
        setError(error.message.includes('required')
          ? t('medicine_strength_required')
          : t('medicine_no_medicine_found'));
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const canSearch =
    (selectedMedicineName || searchTerm.trim()).length > 0 && strength.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Background Tint */}
      <LinearGradient
        colors={["#f0f9ff", "#ffffff", "#f0fdf4"]}
        style={StyleSheet.absoluteFill}
      />

      <PatientScreenHeader
        title={t('medicine_compare_title')}
        colors={['#3b82f6', '#06b6d4']}
        onBack={() => router.navigate('/(patient)/home' as Href)}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t("medicine_find_alternatives")}</Text>

          <View style={styles.suggestBlock}>
            <View style={[styles.inputWrapper, isListening && styles.inputWrapperActive]}>
              <Search size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                placeholder={isListening ? "Listening..." : t("medicine_search_placeholder")}
                placeholderTextColor={isListening ? "#3b82f6" : "#9CA3AF"}
                value={searchTerm}
                onChangeText={handleMedicineNameChange}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                style={styles.input}
                editable={!loading}
              />
              <Pressable
                onPress={handleMicPress}
                disabled={!isVoiceLinked}
                style={({ pressed }) => [
                  styles.micButton,
                  isListening && styles.micButtonActive,
                  !isVoiceLinked && styles.micButtonDisabled,
                  pressed && { opacity: 0.7 }
                ]}
              >
                {isListening ? (
                  <Mic size={18} color="white" />
                ) : (
                  <MicOff size={18} color="#9CA3AF" />
                )}
              </Pressable>
            </View>

            {loadingSuggestions ? (
              <Text style={styles.hintText}>{t('medicine_loading_suggestions')}</Text>
            ) : null}

            {showSuggestions && searchTerm.trim().length >= 2 ? (
              <View style={styles.suggestionsList}>
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectSuggestion(item)}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        pressed && { backgroundColor: '#eff6ff' },
                      ]}
                    >
                      <Text style={styles.suggestionText}>{item.name}</Text>
                    </Pressable>
                  ))
                ) : (
                  !loadingSuggestions && (
                    <Text style={styles.hintText}>{t('medicine_no_suggestions')}</Text>
                  )
                )}
              </View>
            ) : null}
          </View>

          <Text style={styles.potencyLabel}>{t('medicine_select_potency')}</Text>
          {loadingPotencies ? (
            <ActivityIndicator color="#3b82f6" style={{ marginBottom: 12 }} />
          ) : selectedMedicineName && potencies.length > 0 ? (
            <View style={styles.potencyGrid}>
              {potencies.map((pot) => {
                const active = strength === pot;
                return (
                  <Pressable
                    key={pot}
                    onPress={() => setStrength(pot)}
                    style={[styles.potencyChip, active && styles.potencyChipActive]}
                  >
                    <Text
                      style={[
                        styles.potencyChipText,
                        active && styles.potencyChipTextActive,
                      ]}
                    >
                      {pot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : selectedMedicineName ? (
            <Text style={styles.hintText}>{t('medicine_no_potencies')}</Text>
          ) : (
            <Text style={styles.hintText}>{t('medicine_select_potency')}</Text>
          )}

          {!isVoiceLinked && isVoiceSupported && (
            <Text style={styles.voiceUnavailableHint}>Voice recognition not available</Text>
          )}
          {isListening && (
            <Text style={styles.listeningHint}>🎤 Listening...</Text>
          )}

          <Pressable
            onPress={handleSearch}
            disabled={!canSearch || loading}
            style={({ pressed }: { pressed: boolean }) => [
              styles.buttonWrapper,
              (!canSearch || loading) && { opacity: 0.5 },
              pressed && { opacity: 0.9 }
            ]}
          >
            <LinearGradient
              colors={["#3b82f6", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>{t("medicine_compare_button")}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </Card>

        {error && (
          <View style={styles.errorCard}>
             <Info size={24} color="#ef4444" />
             <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results && (
          <View style={styles.resultsContainer}>
            {/* Active Salt Info */}
            <View style={styles.saltCard}>
              <View style={styles.saltHeader}>
                <Info size={16} color="#0369a1" />
                <Text style={styles.saltLabel}>{t("medicine_active_salt")}</Text>
              </View>
              <Text style={styles.saltName}>{results.salt}</Text>
              {(results.input_strength || strength) && (
                <Text style={styles.strengthHint}>
                  {t("medicine_searched_strength")}: {results.input_strength || strength}
                </Text>
              )}
            </View>

            <View style={styles.listHeader}>
              <DollarSign size={20} color="#16a34a" />
              <Text style={styles.listTitle}>{t("medicine_alternative_brands")}</Text>
            </View>
            
            {/* Alternatives List */}
            {results.alternatives.map((med, index) => {
              const isAffordable = index === 0; // First one is cheapest (sorted by backend)
              return (
                <Card key={index} style={[
                  styles.medCard,
                  isAffordable ? styles.affordableCard : styles.standardCard
                ]}>
                  <View style={styles.medHeader}>
                    <View style={styles.medBrandRow}>
                      <Text style={styles.brandName}>{med.name}</Text>
                      {isAffordable && (
                        <View style={styles.badge}>
                          <Star size={10} color="white" fill="white" />
                          <Text style={styles.badgeText}>{t("medicine_best_price_badge")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.priceText}>PKR {med.price}</Text>
                  </View>
                  <Text style={styles.manufacturerText}>Manufacturer: {med.manufacturer}</Text>
                  <Text style={styles.manufacturerText}>Strength: {med.strength}</Text>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: 'center'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 16,
  },
  inputWrapperActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  suggestBlock: { marginBottom: 8, zIndex: 10 },
  suggestionsList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  potencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  potencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  potencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  potencyChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  potencyChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  potencyChipTextActive: {
    color: '#1d4ed8',
  },
  micButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  micButtonActive: {
    backgroundColor: '#3b82f6',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  voiceUnavailableHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 18,
  },
  listeningHint: {
    textAlign: 'center',
    color: '#3b82f6',
    fontSize: 12,
    marginBottom: 15,
    fontWeight: '500',
  },
  buttonWrapper: { borderRadius: 12, overflow: 'hidden' },
  searchButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  resultsContainer: { marginTop: 24 },
  saltCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 20,
  },
  saltHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  saltLabel: { fontSize: 12, color: '#0369a1', fontWeight: '600' },
  saltName: { fontSize: 16, fontWeight: '700', color: '#075985' },
  strengthHint: {
    fontSize: 13,
    color: '#0369a1',
    marginTop: 6,
    fontWeight: '600',
  },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  medCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  standardCard: { borderColor: '#f3f4f6', backgroundColor: '#ffffff' },
  affordableCard: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  medBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  priceText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  badge: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
  manufacturerText: { fontSize: 13, color: '#6b7280' },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginTop: 8,
    gap: 12,
  },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 2 },
  tipText: { fontSize: 13, color: '#15803d', lineHeight: 18 },
  errorCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 16,
    color: '#b91c1c',
    fontWeight: '500',
  },
});

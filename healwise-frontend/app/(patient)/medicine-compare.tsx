import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Search, DollarSign, Star, Info, Mic, MicOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { compareMedicines, CompareResult } from '@/services/medicineService';
import { useTranslation } from 'react-i18next';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

export default function MedicineComparison() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { t } = useTranslation();

  const isVoiceSupported = Platform.OS === 'ios' || Platform.OS === 'android';
  const isVoiceNativeLinked = useMemo(
    () =>
      isVoiceSupported &&
      (NativeModules.RCTVoice != null || NativeModules.Voice != null),
    [isVoiceSupported]
  );

  useEffect(() => {
    if (!isVoiceSupported || !isVoiceNativeLinked || !isFocused) return;

    Voice.onSpeechStart = () => {
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (isFocused && e.value && e.value[0]) {
        setSearchTerm(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: any) => {
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
  }, [isVoiceSupported, isVoiceNativeLinked, isFocused]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSearchTerm('');
        setResults(null);
        setError(null);
      };
    }, [])
  );

  const startListening = async () => {
    try {
      if (!isVoiceSupported) {
        Alert.alert('Error', 'Voice input is not supported on this platform');
        return;
      }
      if (!isVoiceNativeLinked) {
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
      await Voice.stop();
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
    if (!searchTerm.trim()) return;

    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const data = await compareMedicines(searchTerm);
      setResults(data);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        setError("No medicine found / کوئی دوا نہیں ملی");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Tint */}
      <LinearGradient
        colors={["#f0f9ff", "#ffffff", "#f0fdf4"]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={["#3b82f6", "#06b6d4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} hitSlop={20} style={styles.backButton}>
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>{t("medicine_compare_title")}</Text>
              {/* <Text style={styles.headerSubtitle}>{t("medicine_compare_subtitle")}</Text> */}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t("medicine_find_alternatives")}</Text>

          <View style={[styles.inputWrapper, isListening && styles.inputWrapperActive]}>
            <Search size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              placeholder={isListening ? "Listening..." : t("medicine_search_placeholder")}
              placeholderTextColor={isListening ? "#3b82f6" : "#9CA3AF"}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.input}
              editable={!loading}
            />
            <Pressable
              onPress={handleMicPress}
              disabled={!isVoiceNativeLinked}
              style={({ pressed }) => [
                styles.micButton,
                isListening && styles.micButtonActive,
                !isVoiceNativeLinked && styles.micButtonDisabled,
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

          {!isVoiceNativeLinked && isVoiceSupported && (
            <Text style={styles.voiceUnavailableHint}>Voice recognition not available</Text>
          )}
          {isListening && (
            <Text style={styles.listeningHint}>🎤 Listening...</Text>
          )}

          <Pressable
            onPress={handleSearch}
            disabled={!searchTerm.trim() || loading}
            style={({ pressed }: { pressed: boolean }) => [
              styles.buttonWrapper,
              (!searchTerm.trim() || loading) && { opacity: 0.5 },
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

            {/* Savings Tip */}
            <View style={styles.tipCard}>
              <Star size={20} color="#15803d" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{t("medicine_money_saving_tip_title")}</Text>
                <Text style={styles.tipText}>
                  {t("medicine_money_saving_tip_text")}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 14, color: "#FFFFFF", opacity: 0.9 },
  scrollView: { flex: 1, marginTop: -20 },
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

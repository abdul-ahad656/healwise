import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Search, AlertCircle, Circle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card'; // Using your existing Card component

export default function SymptomChecker() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleCheck = () => {
    // Mock results for demo
    setResults({
      condition: 'Common Cold',
      severity: 'Mild',
      recommendations: [
        'Rest and stay hydrated',
        'Take over-the-counter pain relievers',
        'Consult a doctor if symptoms worsen'
      ]
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient matching Theme */}
      <LinearGradient
        colors={["#fef2f2", "#ffffff", "#fff7ed"]} // Light red to light orange tint
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <LinearGradient
        colors={["#ef4444", "#f97316"]}
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
              <Text style={styles.headerTitle}>Symptom Checker</Text>
              <Text style={styles.headerSubtitle}>علامات کی جانچ</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Describe Your Symptoms</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Type or speak symptoms... / اپنی علامات بتائیں"
              placeholderTextColor="#9CA3AF"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              style={styles.input}
            />
            <Pressable style={styles.micButton}>
              <Mic size={20} color="#6b7280" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleCheck}
            disabled={!symptoms.trim()}
            style={({ pressed }) => [
              styles.checkButtonWrapper,
              !symptoms.trim() && { opacity: 0.5 },
              pressed && { opacity: 0.9 }
            ]}
          >
            <LinearGradient
              colors={["#ef4444", "#f97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkButton}
            >
              <Search size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.checkButtonText}>Check Symptoms</Text>
            </LinearGradient>
          </Pressable>
        </Card>

        {/* Results Card */}
        {results && (
          <Card style={[styles.card, styles.resultsCard]}>
            <View style={styles.resultsHeader}>
              <AlertCircle size={20} color="#f97316" />
              <Text style={styles.resultsTitle}>Analysis Results</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Possible Condition</Text>
              <Text style={styles.conditionText}>{results.condition}</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Severity</Text>
              <View style={[
                styles.severityBadge,
                results.severity === 'Mild' ? styles.bgGreen : 
                results.severity === 'Moderate' ? styles.bgYellow : styles.bgRed
              ]}>
                <Text style={[
                  styles.severityText,
                  results.severity === 'Mild' ? styles.textGreen : 
                  results.severity === 'Moderate' ? styles.textYellow : styles.textRed
                ]}>
                  {results.severity}
                </Text>
              </View>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Recommendations</Text>
              {results.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ This is AI analysis only. Please consult a qualified doctor for proper diagnosis.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    alignItems: 'flex-start'
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingTop: 0,
    textAlignVertical: 'top'
  },
  micButton: {
    padding: 4,
  },
  checkButtonWrapper: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkButton: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  resultsCard: {
    marginTop: 0,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  resultItem: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginTop: 6,
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  warningBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  bgGreen: { backgroundColor: '#dcfce7' },
  textGreen: { color: '#15803d' },
  bgYellow: { backgroundColor: '#fef9c3' },
  textYellow: { color: '#a16207' },
  bgRed: { backgroundColor: '#fee2e2' },
  textRed: { color: '#b91c1c' },
});
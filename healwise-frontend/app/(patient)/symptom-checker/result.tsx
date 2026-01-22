import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  Pressable,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, CheckCircle2, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { SymptomAnalysisResult } from '@/services/symptomService';

export default function SymptomResult() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  let result: SymptomAnalysisResult | null = null;
  
  try {
    if (params.data) {
      result = JSON.parse(params.data as string);
    }
  } catch (e) {
    console.error("Failed to parse result", e);
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <SafeAreaView>
          <Text>No results found</Text>
          <Pressable onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const confidencePercentage = Math.round(result.confidence * 100);

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={["#fef2f2", "#ffffff", "#fff7ed"]}
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
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color="white" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Analysis Result</Text>
              <Text style={styles.headerSubtitle}>تشخیص کا نتیجہ</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Prediction Card */}
        <Card style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Activity size={32} color="#ef4444" />
          </View>
          
          <Text style={styles.labelTitle}>Possible Condition</Text>
          <Text style={styles.conditionName}>{result.prediction}</Text>
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>AI Confidence:</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{confidencePercentage}%</Text>
            </View>
          </View>

          <View style={styles.disclaimerBox}>
            <AlertCircle size={16} color="#b91c1c" />
            <Text style={styles.disclaimerText}>
              This is AI-generated advice, not a medical diagnosis. Please consult a doctor.
            </Text>
          </View>
        </Card>

        {/* Other Possibilities */}
        {result.allPredictions.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Possibilities</Text>
            {result.allPredictions.slice(1, 3).map((pred, index) => (
              <Card key={index} style={styles.possibilityCard}>
                <View style={styles.row}>
                  <Text style={styles.possibilityName}>{pred.label}</Text>
                  <Text style={styles.possibilityScore}>
                    {Math.round(pred.score * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${pred.score * 100}%` }
                    ]} 
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Actions */}
        <Pressable 
          style={styles.consultButton}
          onPress={() => router.push("/(patient)/consult-doctor")}
        >
          <Text style={styles.consultButtonText}>Consult a Doctor Now</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  labelTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  conditionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  confidenceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  confidenceText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    width: '100%',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginLeft: 4,
  },
  possibilityCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  possibilityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  possibilityScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 3,
  },
  consultButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  consultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

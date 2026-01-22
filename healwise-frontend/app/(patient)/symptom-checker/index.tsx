import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mic, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/card';
import { analyzeSymptoms } from '@/services/symptomService';

export default function SymptomChecker() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    try {
      const result = await analyzeSymptoms(symptoms);
      
      // Pass result to result page
      // Note: expo-router params are strings. We need to stringify the object.
      router.push({
        pathname: "/(patient)/symptom-checker/result",
        params: { data: JSON.stringify(result) }
      });
      
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient matching Theme */}
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
            disabled={!symptoms.trim() || loading}
            style={({ pressed }: { pressed: boolean }) => [
              styles.checkButtonWrapper,
              (!symptoms.trim() || loading) && { opacity: 0.5 },
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
                  <Text style={styles.checkButtonText}>Analyze Symptoms</Text>
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
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top',
    flex: 1,
    lineHeight: 24,
  },
  micButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

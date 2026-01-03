import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, Button, Text } from 'react-native';

const defaultApiBase = 'http://localhost:5000';

export default function HomeScreen() {
  const apiBase = useMemo(
    () => process.env.EXPO_PUBLIC_API_BASE || defaultApiBase,
    [],
  );

  const [userId, setUserId] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [language, setLanguage] = useState('en');
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [symptomId, setSymptomId] = useState('');
  const [symptomResult, setSymptomResult] = useState<string | null>(null);
  const [symptomLoading, setSymptomLoading] = useState(false);

  const [historyUserId, setHistoryUserId] = useState('');
  const [historyResult, setHistoryResult] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitResult(null);
    try {
      const res = await fetch(`${apiBase}/api/symptoms/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text: symptomText, language }),
      });
      const data = await res.json();
      setSubmitResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setSubmitResult(`Error: ${e.message || e}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFetchSymptom = async () => {
    if (!symptomId) return;
    setSymptomLoading(true);
    setSymptomResult(null);
    try {
      const res = await fetch(`${apiBase}/api/symptoms/${symptomId}`);
      const data = await res.json();
      setSymptomResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setSymptomResult(`Error: ${e.message || e}`);
    } finally {
      setSymptomLoading(false);
    }
  };

  const handleFetchHistory = async () => {
    if (!historyUserId) return;
    setHistoryLoading(true);
    setHistoryResult(null);
    try {
      const res = await fetch(`${apiBase}/api/symptoms/history/${historyUserId}`);
      const data = await res.json();
      setHistoryResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setHistoryResult(`Error: ${e.message || e}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>HealWise Backend Tester</Text>
      <Text style={styles.subtext}>API base: {apiBase}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Submit Symptoms</Text>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Symptom text"
          value={symptomText}
          onChangeText={setSymptomText}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Language (default: en)"
          value={language}
          onChangeText={setLanguage}
        />
        <Button title={submitLoading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} />
        {submitResult && <Text style={styles.result}>{submitResult}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fetch Symptom</Text>
        <TextInput
          style={styles.input}
          placeholder="Symptom ID"
          value={symptomId}
          onChangeText={setSymptomId}
        />
        <Button
          title={symptomLoading ? 'Loading...' : 'Fetch'}
          onPress={handleFetchSymptom}
          disabled={!symptomId}
        />
        {symptomResult && <Text style={styles.result}>{symptomResult}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>User History</Text>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={historyUserId}
          onChangeText={setHistoryUserId}
        />
        <Button
          title={historyLoading ? 'Loading...' : 'Fetch History'}
          onPress={handleFetchHistory}
          disabled={!historyUserId}
        />
        {historyResult && <Text style={styles.result}>{historyResult}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtext: {
    color: '#666',
  },
  card: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  result: {
    backgroundColor: '#1e1e1e',
    color: '#d0ffd0',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

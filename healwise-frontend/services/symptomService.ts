import { API_BASE_URL } from './config';
import AuthStore from './authStore';

export interface SymptomPrediction {
  label: string;
  score: number;
}

export interface SymptomAnalysisResult {
  symptomId: string;
  prediction: string;
  confidence: number;
  allPredictions: SymptomPrediction[];
}

export interface SymptomHistoryEntry {
  _id: string;
  text: string;
  language?: string;
  aiPrediction: string;
  confidence: number;
  createdAt?: string;
}

export const analyzeSymptoms = async (text: string): Promise<SymptomAnalysisResult> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/symptoms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze symptoms');
    }

    return data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const getSymptomHistory = async (): Promise<SymptomHistoryEntry[]> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/symptoms/history`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch symptom history');
    }

    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error';
    throw new Error(message);
  }
};

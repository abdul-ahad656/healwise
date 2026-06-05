import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import { fetchJson } from './httpClient';

export function normalizeSymptomToken(value: string): string {
  const s = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) return '';
  return s.replace(/ /g, '_');
}

/** Split comma-separated input into individual normalized symptom tokens. */
export function parseSymptomInput(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(',')) {
    const token = normalizeSymptomToken(part);
    if (token && !seen.has(token)) {
      seen.add(token);
      result.push(token);
    }
  }
  return result;
}

export function formatSymptomLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

export interface SymptomSuggestionResult {
  selected_symptoms: string[];
  suggestions: string[];
  can_analyze: boolean;
}

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

function normalizeSymptomHistoryEntry(raw: Record<string, unknown>): SymptomHistoryEntry {
  const createdAt = raw.createdAt;
  return {
    _id: String(raw._id ?? raw.id ?? ''),
    text: String(raw.text ?? raw.symptoms ?? ''),
    language: typeof raw.language === 'string' ? raw.language : undefined,
    aiPrediction: String(
      raw.aiPrediction ?? raw.prediction ?? raw.disease ?? 'Unknown'
    ),
    confidence: Number(raw.confidence ?? 0),
    createdAt:
      typeof createdAt === 'string'
        ? createdAt
        : createdAt instanceof Date
          ? createdAt.toISOString()
          : undefined,
  };
}

export const suggestSymptoms = async (
  symptoms: string[]
): Promise<SymptomSuggestionResult> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const { response, data } = await fetchJson<SymptomSuggestionResult & { error?: string }>(
    `${API_BASE_URL}/suggest-symptoms`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symptoms }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch symptom suggestions');
  }

  return data;
};

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

    return Array.isArray(data)
      ? data.map((item) => normalizeSymptomHistoryEntry(item))
      : [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error';
    throw new Error(message);
  }
};

import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import i18n from '@/i18n';

export interface Medicine {
  name: string;
  salt: string;
  manufacturer: string;
  strength: string;
  price: number;
  affordable?: boolean; // We might calculate this on frontend
}

export interface CompareResult {
  input_medicine: string;
  salt: string;
  alternatives: Medicine[];
}

export interface MedicineHistoryEntry {
  _id: string;
  query: string;
  result: CompareResult;
  createdAt?: string;
}

export interface MedicineTypeAwareness {
  medicine_type: string;
  description: string;
  common_uses: string[] | string;
  how_to_use: string[] | string;
  precautions: string[] | string;
  side_effects: string[] | string;
  warnings: string[] | string;
  otc: boolean;
  disclaimer: string;
}

export const compareMedicines = async (query: string): Promise<CompareResult> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medicines/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: query }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to compare medicines');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const getMedicineHistory = async (): Promise<MedicineHistoryEntry[]> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medicines/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch medicine history');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const getMedicineTypeAwareness = async (
  medicineType: string
): Promise<MedicineTypeAwareness> => {
  try {
    const langParam = i18n.language === 'ur' ? '?lang=ur' : '';
    const response = await fetch(
      `${API_BASE_URL}/medicine-awareness/type-awareness/${encodeURIComponent(medicineType)}${langParam}`,
      {
        method: 'GET',
      }
    );

    const contentType = response.headers.get('content-type') || '';

    // If backend didn't return JSON (e.g. HTML error page), avoid JSON parse crash
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Unexpected response from server: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch medicine awareness');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const getMedicineTypes = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/medicine-awareness/types`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Unexpected response from server: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch medicine types');
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => (typeof item === 'string' ? item : item?.medicine_type))
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
    }

    const types = data.types ?? data.data ?? [];
    if (!Array.isArray(types)) {
      return [];
    }

    return types
      .map((item: unknown) => (typeof item === 'string' ? item : (item as { medicine_type?: string })?.medicine_type))
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error';
    throw new Error(msg);
  }
};

import { API_BASE_URL } from './config';
import AuthStore from './authStore';

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

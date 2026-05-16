import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import { isUrduLocale, withLangQuery } from '@/utils/locale';

export interface HealthTip {
  _id: string;
  title: string;
  description: string;
  type: 'general' | 'disease';
  disease?: string;
  language: string;
  media?: {
    image?: string;
    video?: string;
  };
  active: boolean;
  createdAt: string;
}

export interface HealthTipCategory {
  key: string;
  label: string;
  type: 'general' | 'disease';
  disease: string | null;
}

function authHeaders(): HeadersInit {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const getHealthTipCategories = async (): Promise<HealthTipCategory[]> => {
  try {
    const response = await fetch(
      withLangQuery(`${API_BASE_URL}/health-tips/categories?language=en`),
      { method: 'GET', headers: authHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch health categories');
    }

    const categories = data.categories ?? [];
    if (!Array.isArray(categories)) return [];

    return categories.filter(
      (c: HealthTipCategory) => c && typeof c.key === 'string' && typeof c.label === 'string'
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error';
    throw new Error(msg);
  }
};

export const getHealthTips = async (
  category?: HealthTipCategory | null
): Promise<HealthTip[]> => {
  try {
    const queryParams = new URLSearchParams({ language: 'en' });

    if (category) {
      queryParams.append('type', category.type);
      if (category.type === 'disease' && category.disease) {
        queryParams.append('disease', category.disease);
      }
    }

    if (isUrduLocale()) {
      queryParams.append('lang', 'ur');
    }

    const response = await fetch(
      `${API_BASE_URL}/health-tips/?${queryParams.toString()}`,
      { method: 'GET', headers: authHeaders() }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch health tips');
    }

    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Network error';
    throw new Error(msg);
  }
};

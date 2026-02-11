import { API_BASE_URL } from './config';
import AuthStore from './authStore';

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

export const getHealthTips = async (language: string = 'en', disease?: string): Promise<HealthTip[]> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const queryParams = new URLSearchParams({ language });
    if (disease) queryParams.append('disease', disease);

    const response = await fetch(`${API_BASE_URL}/health-tips/?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch health tips');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

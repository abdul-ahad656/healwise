import { API_BASE_URL } from './config';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  experience?: string;
  hospital?: string;
  consultationFee?: number | string;
  rating?: number | string;
}

export const getPublicDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/doctors`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load doctors');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};


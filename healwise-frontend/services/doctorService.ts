import { API_BASE_URL } from './config';
import AuthStore from './authStore';

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

export interface DoctorAvailabilityDay {
  _id: string;
  doctorId: string;
  day: string;
  slots: string[];
}

export const bookAppointment = async (
  doctorId: string,
  date: string,
  time: string,
  symptomId?: string
): Promise<void> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        doctorId,
        date,
        time,
        symptomId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to book appointment');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

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

export const getDoctorAvailability = async (
  doctorId: string
): Promise<DoctorAvailabilityDay[]> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/availability/${doctorId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load availability');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};


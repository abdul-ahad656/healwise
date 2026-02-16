import { API_BASE_URL } from './config';
import AuthStore from './authStore';

export interface DoctorProfilePayload {
  specialization?: string;
  experience?: string;
  hospital?: string;
  consultationFee?: number;
  qualification?: string;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  symptomId?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface DoctorAvailabilityDay {
  _id: string;
  doctorId: string;
  day: string;
  slots: string[];
}

const getAuthHeaders = () => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const updateDoctorProfile = async (
  payload: DoctorProfilePayload
): Promise<void> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/doctor_profile/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }
};

export const getDoctorAppointments = async (): Promise<Appointment[]> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/appointments/doctor`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load appointments');
  }

  return data;
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  status: Appointment['status']
): Promise<void> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/appointments/update/${appointmentId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update appointment');
  }
};

export const getMyAvailability = async (): Promise<DoctorAvailabilityDay[]> => {
  const headers = getAuthHeaders();
  const user = AuthStore.getUser();
  const doctorId = user?.id;

  if (!doctorId) {
    throw new Error('Doctor not found in session');
  }

  const response = await fetch(`${API_BASE_URL}/availability/${doctorId}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load availability');
  }

  return data;
};

export const setMyAvailability = async (
  day: string,
  slots: string[]
): Promise<void> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/availability/set`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ day, slots }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save availability');
  }
};


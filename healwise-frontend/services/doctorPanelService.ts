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
  patientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface SymptomHistoryItem {
  _id: string;
  text: string;
  language: string;
  aiPrediction: string;
  confidence: number;
  createdAt?: string;
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

export const deleteMyAvailabilityDay = async (day: string): Promise<void> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/availability/day/${encodeURIComponent(day)}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete availability day');
  }
};

export const getSymptomHistoryForAppointment = async (
  appointmentId: string
): Promise<SymptomHistoryItem[]> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/symptoms/history/appointment/${appointmentId}`,
    {
      method: 'GET',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load symptom history');
  }

  return data;
};

export interface Prescription {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileType: string;
  notes?: string;
  uploadedAt: string;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export const uploadPrescription = async (
  appointmentId: string,
  fileUri: string,
  fileName: string,
  notes?: string
): Promise<Prescription> => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const formData = new FormData();
  formData.append('prescription', {
    uri: fileUri,
    name: fileName,
    type: getMimeType(fileName),
  } as any);

  if (notes) {
    formData.append('notes', notes);
  }

  const response = await fetch(
    `${API_BASE_URL}/prescriptions/upload/${appointmentId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload prescription');
  }

  return data.prescription;
};

export const getPatientPrescriptions = async (): Promise<Prescription[]> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/prescriptions`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load prescriptions');
  }

  return data;
};

export const getPrescription = async (appointmentId: string): Promise<Prescription> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/prescriptions/${appointmentId}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load prescription');
  }

  return data;
};

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeTypes[ext || 'pdf'] || 'application/octet-stream';
}

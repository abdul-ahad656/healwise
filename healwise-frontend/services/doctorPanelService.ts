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
  doctorName?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'confirmed'
    | 'in_progress'
    | 'rejected'
    | 'completed'
    | 'cancelled';
  hasPrescription?: boolean;
  consultationDurationSeconds?: number;
  consultationDurationMinutes?: number;
  patientMarkedComplete?: boolean;
  doctorMarkedComplete?: boolean;
  completionType?: string;
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

export const getPatientAppointments = async (): Promise<Appointment[]> => {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/appointments/my`, {
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

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
    { method: 'POST', headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to cancel appointment');
  }
};

export const rescheduleAppointment = async (
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/reschedule`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentDate, appointmentTime }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reschedule appointment');
  }
};

export const markAppointmentComplete = async (
  appointmentId: string
): Promise<Appointment> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/mark-complete`,
    { method: 'POST', headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to mark appointment complete');
  }
  return data.appointment as Appointment;
};

export const recordConsultationJoin = async (
  appointmentId: string
): Promise<void> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/consultation-join`,
    { method: 'POST', headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to record consultation join');
  }
};

export const recordConsultationLeave = async (
  appointmentId: string
): Promise<{
  consultationDurationMinutes?: number;
  status?: string;
  autoCompleted?: boolean;
}> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/consultation-leave`,
    { method: 'POST', headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to record consultation leave');
  }
  return data;
};

export const startConsultation = async (
  appointmentId: string
): Promise<{ message: string; appointmentId: string; status: string }> => {
  const headers = getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/appointments/start-consultation/${appointmentId}`,
    {
      method: 'POST',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Cannot start consultation yet');
  }

  return data;
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

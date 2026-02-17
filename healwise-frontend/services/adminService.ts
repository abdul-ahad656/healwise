import { API_BASE_URL } from './config';
import AuthStore from './authStore';

export interface AdminDoctor {
  _id: string;
  name: string;
  email: string;
  specialization?: string;
  experience?: string;
  hospital?: string;
  consultationFee?: number;
  active?: boolean;
  language?: string;
}

export interface CreateDoctorPayload {
  name: string;
  email: string;
  password: string;
  language?: string;
  specialization?: string;
  experience?: string;
  hospital?: string;
  consultationFee?: number;
}

export interface AdminHealthTip {
  _id: string;
  title: string;
  description: string;
  type: 'general' | 'disease';
  disease?: string;
  language: string;
  active: boolean;
  createdAt?: string;
}

export interface MedicineTypePayload {
  medicine_type: string;
  description: string;
  common_uses?: string;
  how_to_use?: string;
  precautions?: string;
  side_effects?: string;
  warnings?: string;
  otc?: boolean;
}

export interface MedicineTypeRecord extends MedicineTypePayload {
  _id: string;
}

const getAdminHeaders = () => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminDoctors = async (): Promise<AdminDoctor[]> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load doctors');
  }

  return data;
};

export const createAdminDoctor = async (
  payload: CreateDoctorPayload
): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/admin/doctor`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create doctor');
  }
};

export const toggleDoctorStatus = async (doctorId: string): Promise<boolean> => {
  const headers = getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/admin/doctor/${doctorId}/status`,
    {
      method: 'PUT',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update doctor status');
  }

  return data.active;
};

export const updateAdminDoctor = async (
  doctorId: string,
  payload: Partial<CreateDoctorPayload> & { active?: boolean }
): Promise<AdminDoctor> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/admin/doctor/${doctorId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update doctor');
  }

  return data;
};

export const deleteAdminDoctor = async (doctorId: string): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/admin/doctor/${doctorId}`, {
    method: 'DELETE',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete doctor');
  }
};

export const getAdminHealthTips = async (): Promise<AdminHealthTip[]> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/health-tips/`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load health tips');
  }

  return data;
};

export const createHealthTip = async (
  payload: Omit<AdminHealthTip, '_id' | 'active' | 'createdAt'>
): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/health-tips/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create health tip');
  }
};

export const deactivateHealthTip = async (tipId: string): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/health-tips/${tipId}/deactivate`,
    {
      method: 'PUT',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to deactivate health tip');
  }
};

export const updateHealthTip = async (
  tipId: string,
  payload: Partial<Omit<AdminHealthTip, '_id' | 'active' | 'createdAt'>>
): Promise<AdminHealthTip> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/health-tips/${tipId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update health tip');
  }

  return data;
};

export const deleteHealthTip = async (tipId: string): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(`${API_BASE_URL}/health-tips/${tipId}`, {
    method: 'DELETE',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete health tip');
  }
};

export const saveMedicineTypeAwareness = async (
  payload: MedicineTypePayload
): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/medicine-awareness/type-awareness`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save medicine awareness');
  }
};

export const getAllMedicineAwareness = async (): Promise<
  MedicineTypeRecord[]
> => {
  const headers = getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/medicine-awareness/type-awareness`,
    {
      method: 'GET',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load medicine awareness');
  }

  return data;
};

export const deleteMedicineAwareness = async (
  medicineType: string
): Promise<void> => {
  const headers = getAdminHeaders();

  const response = await fetch(
    `${API_BASE_URL}/medicine-awareness/type-awareness/${encodeURIComponent(
      medicineType
    )}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete medicine awareness');
  }
};


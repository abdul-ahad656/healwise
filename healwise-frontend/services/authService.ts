import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import { fetchJson } from './httpClient';
import { applyPatientLocale } from '@/utils/locale';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  language?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { response, data } = await fetchJson<AuthResponse>(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      throw new Error((data as { error?: string }).error || 'Login failed');
    }

    AuthStore.setToken(data.token);
    AuthStore.setUser(data.user);

    if (data.user?.role === 'patient' && data.user.language) {
      applyPatientLocale(data.user.language);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const register = async (
  name: string,
  email: string,
  password: string,
  role: string = 'patient',
  verificationToken: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        verification_token: verificationToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    AuthStore.setToken(data.token);
    AuthStore.setUser(data.user);

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const setLanguagePreference = async (language: 'en' | 'ur'): Promise<void> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const { response, data } = await fetchJson<{ error?: string }>(
    `${API_BASE_URL}/auth/language`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update language');
  }

  // Update local session + UI language immediately
  const user = AuthStore.getUser();
  AuthStore.setUser({ ...(user || {}), language });
  applyPatientLocale(language);
};

export const updateProfileName = async (name: string): Promise<User> => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const { response, data } = await fetchJson<{ user: User; error?: string }>(
    `${API_BASE_URL}/auth/profile`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim() }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  AuthStore.setUser(data.user);
  return data.user;
};

export const sendProfilePasswordOtp = async (): Promise<void> => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const { response, data } = await fetchJson<{ error?: string; message?: string }>(
    `${API_BASE_URL}/auth/profile/send-password-otp`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
};

export const updateProfilePassword = async (
  password: string,
  verificationToken: string
): Promise<void> => {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const { response, data } = await fetchJson<{ error?: string; message?: string }>(
    `${API_BASE_URL}/auth/profile/password`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password,
        verification_token: verificationToken,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password');
  }
};

export const resetPassword = async (
  email: string,
  password: string,
  verificationToken: string
): Promise<void> => {
  const { response, data } = await fetchJson<{ error?: string; message?: string }>(
    `${API_BASE_URL}/auth/reset-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        verification_token: verificationToken,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
};

import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import i18n from '@/i18n';
import { fetchJson } from './httpClient';

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

    const userLang = data.user?.language;
    if (userLang) {
      i18n.changeLanguage(userLang);
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
  role: string = 'patient'
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    AuthStore.setToken(data.token);
    AuthStore.setUser(data.user);

    const userLang = data.user?.language;
    if (userLang) {
      i18n.changeLanguage(userLang);
    }

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
  i18n.changeLanguage(language);
};

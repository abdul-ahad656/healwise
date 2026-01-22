import { API_BASE_URL } from './config';

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
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

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

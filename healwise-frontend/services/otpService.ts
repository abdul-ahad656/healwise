import { API_BASE_URL } from './config';
import { fetchJson } from './httpClient';

export type OtpPurpose = 'register' | 'reset_password' | 'change_password';

export interface SendOtpResponse {
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  temp_token: string;
  email: string;
  expires_in: number;
}

export const sendOtp = async (
  email: string,
  purpose: OtpPurpose
): Promise<SendOtpResponse> => {
  const { response, data } = await fetchJson<SendOtpResponse & { error?: string; retry_after?: number }>(
    `${API_BASE_URL}/auth/send-otp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
    }
  );

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }

  return data;
};

export const verifyOtp = async (
  email: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  const { response, data } = await fetchJson<
    VerifyOtpResponse & { error?: string; remaining_attempts?: number }
  >(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    }),
  });

  if (!response.ok) {
    const extra =
      data.remaining_attempts !== undefined
        ? ` (${data.remaining_attempts} attempts left)`
        : '';
    throw new Error((data.error || 'Invalid OTP') + extra);
  }

  return data;
};

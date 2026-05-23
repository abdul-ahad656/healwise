import { API_BASE_URL } from './config';
import AuthStore from './authStore';

export type PaymentMethod = 'stripe' | 'easypaisa';

export interface StripePaymentResponse {
  payment_method: 'stripe';
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
  message: string;
}

export interface EasypaisaPaymentResponse {
  payment_method: 'easypaisa';
  receiver_number: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: string;
  instructions: string;
}

export type PaymentResponse = StripePaymentResponse | EasypaisaPaymentResponse;

export interface PaymentHistory {
  paymentId: string;
  payment_method: PaymentMethod;
  amount: number;
  currency: string;
  status: 'pending' | 'pending_review' | 'paid' | 'failed' | 'refunded';
  cardLast4?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentStatus?: string;
  createdAt: string;
  easypaisa_proof_url?: string;
  easypaisa_transaction_id?: string;
}

export interface RefundResponse {
  refundId: string;
  status: string;
  amount: number;
  message: string;
}

export interface SubmitProofResponse {
  message: string;
  payment_id: string;
  status: string;
}

/**
 * Create payment for appointment booking.
 * Supports both Stripe (auto-confirm) and Easypaisa (manual approval) payment methods.
 *
 * Frontend sends doctor_id (not doctor object).
 * Backend fetches and verifies doctor consultation price from database.
 */
export const createPayment = async (
  appointmentId: string,
  appointmentDate: string,
  appointmentTime: string,
  doctorId: string,
  paymentMethod: PaymentMethod = 'stripe',
  symptomId?: string
): Promise<PaymentResponse> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        appointment_id: appointmentId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        doctor_id: doctorId,
        payment_method: paymentMethod,
        symptom_id: symptomId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment');
    }

    return data as PaymentResponse;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

/**
 * Submit payment proof for Easypaisa payments.
 * User submits screenshot or transaction ID after making manual transfer.
 */
export const submitPaymentProof = async (
  paymentId: string,
  proofType: 'screenshot' | 'transaction_id',
  proof: string
): Promise<SubmitProofResponse> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/submit-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        payment_id: paymentId,
        proof_type: proofType,
        proof: proof,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit proof');
    }

    return data as SubmitProofResponse;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

/**
 * Get payment history for the current user.
 */
export const getPaymentHistory = async (): Promise<PaymentHistory[]> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch payment history');
    }

    return data as PaymentHistory[];
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

/**
 * Request a refund for a payment.
 * This cancels the appointment and refunds the payment (Stripe only).
 */
export const refundPayment = async (paymentId: string): Promise<RefundResponse> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_id: paymentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process refund');
    }

    return data as RefundResponse;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

/**
 * Poll for payment status confirmation.
 * Useful for verifying webhook processing or checking Easypaisa proof review status.
 */
export const pollPaymentStatus = async (
  paymentId: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000
): Promise<PaymentHistory> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const payments = await getPaymentHistory();
      const payment = payments.find(p => p.paymentId === paymentId);

      if (payment && payment.status === 'paid') {
        return payment;
      }

      if (payment && payment.status === 'failed') {
        throw new Error('Payment failed');
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Payment confirmation timeout');
};

/**
 * Format payment amount to currency display.
 * Stripe stores amounts in smallest currency units (cents for USD).
 */
export const formatPaymentAmount = (amountInCents: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });

  return formatter.format(amountInCents / 100);
};

/**
 * Convert USD cents to PKR for Easypaisa display.
 * Rough conversion: 1 USD = 278 PKR (adjust based on current rates)
 */
export const convertUsdToPkr = (amountInCents: number, exchangeRate: number = 278): number => {
  const amountInUsd = amountInCents / 100;
  return Math.round(amountInUsd * exchangeRate);
};

/**
 * Get payment method display name.
 */
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'stripe':
      return 'Credit/Debit Card (Stripe)';
    case 'easypaisa':
      return 'Easypaisa Transfer';
    default:
      return 'Unknown';
  }
};

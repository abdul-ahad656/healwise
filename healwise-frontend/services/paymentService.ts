import { API_BASE_URL } from './config';
import AuthStore from './authStore';

export type PaymentMethod = 'stripe' | 'easypaisa';

export interface StripePaymentResponse {
  payment_method: 'stripe';
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
  fee_pkr?: number;
  message: string;
}

export interface EasypaisaPaymentResponse {
  payment_method: 'easypaisa';
  receiver_number: string;
  amount: number;
  currency: string;
  fee_pkr?: number;
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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text || !text.trim()) {
    throw new Error(
      `Server returned an empty response (${response.status}). Check backend is running and reachable.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid server response (${response.status}). ${text.slice(0, 120)}`
    );
  }
}

function proofImageMimeType(fileName?: string): string {
  const ext = (fileName || '').toLowerCase().split('.').pop();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return map[ext || ''] || 'image/jpeg';
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
    const requestBody = {
      appointment_id: appointmentId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      doctor_id: doctorId,
      payment_method: paymentMethod,
      symptom_id: symptomId,
    };

    console.log('Payment request body:', requestBody);

    const response = await fetch(`${API_BASE_URL}/payments/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await parseJsonResponse<PaymentResponse & { error?: string }>(response);

    if (!response.ok) {
      const errorMessage = data.error || (data as { message?: string }).message || 'Failed to create payment';
      throw new Error(errorMessage);
    }

    return data as PaymentResponse;
  } catch (error: any) {
    console.error('Payment error:', error);
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

    const data = await parseJsonResponse<SubmitProofResponse & { error?: string }>(response);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit proof');
    }

    return data as SubmitProofResponse;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

/**
 * Submit payment proof with image upload for Easypaisa payments.
 * Uploads screenshot image to Cloudinary via backend.
 */
export const submitPaymentProofWithImage = async (
  paymentId: string,
  proofType: 'screenshot' | 'transaction_id',
  proof: string,
  imageUri?: string,
  imageName?: string
): Promise<SubmitProofResponse> => {
  const token = AuthStore.getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    if (proofType === 'screenshot' && imageUri) {
      const fileName = imageName || 'payment_proof.jpg';
      const formData = new FormData();
      formData.append('payment_id', paymentId);
      formData.append('proof_type', proofType);
      formData.append('proof_image', {
        uri: imageUri,
        name: fileName,
        type: proofImageMimeType(fileName),
      } as any);

      const response = await fetch(`${API_BASE_URL}/payments/submit-proof`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await parseJsonResponse<SubmitProofResponse & { error?: string }>(
        response
      );

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit proof');
      }

      return data as SubmitProofResponse;
    } else {
      // Submit transaction ID as JSON
      return submitPaymentProof(paymentId, proofType, proof);
    }
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
 * Display PKR amount from payment API (doctor consultationFee from users collection).
 */
export const getPaymentAmountPkr = (
  amountMinor: number,
  currency?: string,
  feePkr?: number
): number => {
  if (feePkr != null && feePkr > 0) {
    return feePkr;
  }
  if (currency?.toLowerCase() === 'pkr') {
    return amountMinor / 100;
  }
  return amountMinor / 100;
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

export interface RefundRequest {
  _id: string;
  appointmentId: string;
  paymentId: string;
  reason: string;
  easypaisa_number: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'approved' | 'rejected';
  refundProofUrl?: string;
  requestedAt?: string;
  processedAt?: string;
  adminNotes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  patientName?: string;
}

export const getMyRefundRequests = async (): Promise<RefundRequest[]> => {
  const token = AuthStore.getToken();
  if (!token) throw new Error('User not authenticated');

  const response = await fetch(`${API_BASE_URL}/payments/refunds/my`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load refund requests');
  }
  return data as RefundRequest[];
};

export const getPendingRefundsAdmin = async (): Promise<RefundRequest[]> => {
  const token = AuthStore.getToken();
  if (!token) throw new Error('User not authenticated');

  const response = await fetch(`${API_BASE_URL}/payments/admin/pending-refunds`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load refund requests');
  }
  return (data.refunds || []) as RefundRequest[];
};

export const approveRefundAdmin = async (
  refundId: string,
  imageUri: string,
  fileName: string,
  adminNotes?: string
): Promise<void> => {
  const token = AuthStore.getToken();
  if (!token) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('refund_id', refundId);
  if (adminNotes) formData.append('admin_notes', adminNotes);
  formData.append('refund_proof', {
    uri: imageUri,
    name: fileName,
    type: proofImageMimeType(fileName),
  } as any);

  const response = await fetch(`${API_BASE_URL}/payments/admin/approve-refund`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to approve refund');
  }
};

export const rejectRefundAdmin = async (
  refundId: string,
  adminNotes?: string
): Promise<void> => {
  const token = AuthStore.getToken();
  if (!token) throw new Error('User not authenticated');

  const response = await fetch(`${API_BASE_URL}/payments/admin/reject-refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refund_id: refundId, admin_notes: adminNotes }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to reject refund');
  }
};

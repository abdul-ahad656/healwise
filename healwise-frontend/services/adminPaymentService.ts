import { API_BASE_URL } from './config';
import AuthStore from './authStore';
import { getPaymentAmountPkr } from './paymentService';

export interface AdminPaymentRecord {
  _id: string;
  amount: number;
  currency?: string;
  status: string;
  payment_method?: string;
  easypaisa_proof_url?: string;
  easypaisa_transaction_id?: string;
  proof_submitted_at?: string;
  admin_approved_at?: string;
  paid_at?: string;
  admin_notes?: string;
  createdAt: string;
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  fee_pkr?: number;
  patient_name?: string;
  patient_email?: string;
  metadata?: {
    doctorName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    feePkr?: number;
  };
}

export function normalizeAdminPayment(
  raw: Record<string, unknown>
): AdminPaymentRecord {
  const meta = (raw.metadata as AdminPaymentRecord['metadata']) || {};
  return {
    _id: String(raw._id),
    amount: Number(raw.amount) || 0,
    currency: raw.currency as string | undefined,
    status: String(raw.status || 'paid'),
    payment_method: raw.payment_method as string | undefined,
    easypaisa_proof_url: raw.easypaisa_proof_url as string | undefined,
    easypaisa_transaction_id: raw.easypaisa_transaction_id as string | undefined,
    proof_submitted_at: raw.proof_submitted_at as string | undefined,
    admin_approved_at: raw.admin_approved_at as string | undefined,
    paid_at: raw.paid_at as string | undefined,
    admin_notes: raw.admin_notes as string | undefined,
    createdAt: String(raw.createdAt || ''),
    doctor_name: (raw.doctor_name as string) || meta.doctorName,
    appointment_date: (raw.appointment_date as string) || meta.appointmentDate,
    appointment_time: (raw.appointment_time as string) || meta.appointmentTime,
    fee_pkr:
      (raw.fee_pkr as number) ||
      meta.feePkr ||
      (raw.doctor_consultation_price as number),
    patient_name: raw.patient_name as string | undefined,
    patient_email: raw.patient_email as string | undefined,
    metadata: meta,
  };
}

export function formatAdminPaymentPkr(payment: AdminPaymentRecord): string {
  const pkr = getPaymentAmountPkr(
    payment.amount,
    payment.currency,
    payment.fee_pkr
  );
  return `PKR ${pkr}`;
}

export async function getAdminApprovedPayments(): Promise<AdminPaymentRecord[]> {
  const token = AuthStore.getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/payments/admin/approved-history`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load approved payments');
  }

  return (data.payments || []).map((p: Record<string, unknown>) =>
    normalizeAdminPayment(p)
  );
}

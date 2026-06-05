import type { Appointment } from '@/services/doctorPanelService';

export function hasRecordedConsultation(appointment: Appointment): boolean {
  const seconds = appointment.consultationDurationSeconds ?? 0;
  const minutes = appointment.consultationDurationMinutes ?? 0;
  if (seconds > 0 || minutes > 0) return true;
  if (appointment.patientJoinedAt && appointment.doctorJoinedAt) return true;
  return false;
}

export function canCancelAppointment(appointment: Appointment): {
  allowed: boolean;
  reason?: string;
} {
  if (hasRecordedConsultation(appointment)) {
    return {
      allowed: false,
      reason:
        'This appointment cannot be cancelled because consultation time was recorded.',
    };
  }
  return { allowed: true };
}

export function shouldUseRefundCancellation(appointment: Appointment): boolean {
  return (
    !!appointment.paymentId &&
    appointment.paymentMethod === 'easypaisa' &&
    ['paid', 'succeeded'].includes(appointment.paymentStatus || '')
  );
}

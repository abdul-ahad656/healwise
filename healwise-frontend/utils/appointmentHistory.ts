import type { Appointment } from '@/services/doctorPanelService';
import { getAppointmentWindow } from '@/utils/consultationTime';

const TERMINAL_STATUSES = new Set<Appointment['status']>([
  'completed',
  'rejected',
  'cancelled',
]);

/** True when the appointment is finished or its scheduled window has ended. */
export function isPastAppointment(
  appointment: Appointment,
  now: Date = new Date()
): boolean {
  if (TERMINAL_STATUSES.has(appointment.status)) {
    return true;
  }
  const { end } = getAppointmentWindow(
    appointment.appointmentDate,
    appointment.appointmentTime
  );
  return Boolean(end && now > end);
}

export function filterPastAppointments(
  appointments: Appointment[],
  now: Date = new Date()
): Appointment[] {
  return appointments
    .filter((apt) => isPastAppointment(apt, now))
    .sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    );
}

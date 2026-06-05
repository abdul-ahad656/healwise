/** Minutes before scheduled start when join is allowed. */
export const CONSULTATION_EARLY_MINUTES = 5;

/** Default slot length when end time is not in the slot string. */
export const DEFAULT_CONSULTATION_MINUTES = 30;

export const TELECONSULT_STATUSES = [
  'pending',
  'accepted',
  'confirmed',
  'in_progress',
] as const;

export const JOINABLE_STATUSES = ['accepted', 'confirmed', 'in_progress'] as const;

export type TeleconsultStatus = (typeof TELECONSULT_STATUSES)[number];
export type JoinableStatus = (typeof JOINABLE_STATUSES)[number];

export interface ConsultationWindow {
  canJoin: boolean;
  message: string;
  minutesUntilStart: number | null;
}

function parseDateParts(date: string): { year: number; month: number; day: number } | null {
  const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseClock(value: string): { hours: number; minutes: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** Extract start/end from strings like "10:30 - 13:00" or "10:30". */
export function getAppointmentWindow(
  appointmentDate: string,
  appointmentTime: string,
  now: Date = new Date()
): ConsultationWindow & { start: Date | null; end: Date | null } {
  const dateParts = parseDateParts(appointmentDate);
  if (!dateParts) {
    return {
      canJoin: false,
      message: 'Invalid appointment date',
      minutesUntilStart: null,
      start: null,
      end: null,
    };
  }

  const trimmed = appointmentTime.trim();
  const rangeMatch = trimmed.match(
    /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
  );
  const startClock = parseClock(rangeMatch?.[1] ?? trimmed);
  if (!startClock) {
    return {
      canJoin: false,
      message: 'Invalid appointment time',
      minutesUntilStart: null,
      start: null,
      end: null,
    };
  }

  const start = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    startClock.hours,
    startClock.minutes,
    0,
    0
  );

  let end: Date;
  const endClock = rangeMatch?.[2] ? parseClock(rangeMatch[2]) : null;
  if (endClock) {
    end = new Date(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      endClock.hours,
      endClock.minutes,
      0,
      0
    );
  } else {
    end = new Date(start.getTime() + DEFAULT_CONSULTATION_MINUTES * 60 * 1000);
  }

  const joinOpens = new Date(
    start.getTime() - CONSULTATION_EARLY_MINUTES * 60 * 1000
  );

  if (now < joinOpens) {
    const minutesUntilStart = Math.max(
      1,
      Math.ceil((start.getTime() - now.getTime()) / 60000)
    );
    return {
      canJoin: false,
      message: `Available ${CONSULTATION_EARLY_MINUTES} minutes before start (${minutesUntilStart} min remaining)`,
      minutesUntilStart,
      start,
      end,
    };
  }

  if (now > end) {
    return {
      canJoin: false,
      message: 'This consultation window has ended',
      minutesUntilStart: 0,
      start,
      end,
    };
  }

  return {
    canJoin: true,
    message: '',
    minutesUntilStart: 0,
    start,
    end,
  };
}

export function isTeleconsultStatus(status: string): status is TeleconsultStatus {
  return (TELECONSULT_STATUSES as readonly string[]).includes(status);
}

export function isJoinableStatus(status: string): status is JoinableStatus {
  return (JOINABLE_STATUSES as readonly string[]).includes(status);
}

export function canPatientJoinTeleconsult(
  status: string,
  appointmentDate: string,
  appointmentTime: string,
  consultationStartedAt?: string | null
): ConsultationWindow {
  if (status === 'pending') {
    return {
      canJoin: false,
      message: 'Accept this appointment before starting a video call',
      minutesUntilStart: null,
    };
  }

  if (!isJoinableStatus(status)) {
    return {
      canJoin: false,
      message: 'This appointment is not available for video consultation',
      minutesUntilStart: null,
    };
  }

  if (!consultationStartedAt) {
    return {
      canJoin: false,
      message: 'Your doctor will start the consultation when ready',
      minutesUntilStart: null,
    };
  }

  if (status !== 'in_progress') {
    return {
      canJoin: false,
      message: 'Wait for your doctor to start the video consultation',
      minutesUntilStart: null,
    };
  }

  const window = getAppointmentWindow(appointmentDate, appointmentTime);
  return {
    canJoin: window.canJoin,
    message: window.message,
    minutesUntilStart: window.minutesUntilStart,
  };
}

export function canStartTeleconsult(
  status: string,
  appointmentDate: string,
  appointmentTime: string
): ConsultationWindow {
  if (status === 'pending') {
    return {
      canJoin: false,
      message: 'Accept this appointment before starting a video call',
      minutesUntilStart: null,
    };
  }

  if (!isJoinableStatus(status)) {
    return {
      canJoin: false,
      message: 'This appointment is not available for video consultation',
      minutesUntilStart: null,
    };
  }

  const window = getAppointmentWindow(appointmentDate, appointmentTime);
  return {
    canJoin: window.canJoin,
    message: window.message,
    minutesUntilStart: window.minutesUntilStart,
  };
}

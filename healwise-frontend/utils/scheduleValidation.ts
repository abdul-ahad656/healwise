/** Client-side schedule validation (matches backend Asia/Karachi rules). */

export const SLOT_DURATION_MINUTES = 30;

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function timeToMinutes(value: string): number {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return -1;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function slotStart(value: string): string {
  const match = String(value).trim().match(/^(\d{1,2}:\d{2})/);
  return match ? match[1] : String(value).trim();
}

export function buildSlotFromStartMinutes(startMinutes: number): string | null {
  if (startMinutes < 0 || startMinutes > 23 * 60 + 59) return null;
  const endMinutes = startMinutes + SLOT_DURATION_MINUTES;
  if (endMinutes > 24 * 60) return null;
  return `${minutesToTime(startMinutes)} - ${minutesToTime(endMinutes)}`;
}

export function buildSlotFromStartTime(date: Date): string | null {
  const startMinutes = date.getHours() * 60 + date.getMinutes();
  return buildSlotFromStartMinutes(startMinutes);
}

export function formatTimeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isPastDay(day: string): boolean {
  return day.trim() < todayYmd();
}

export function isPastSlot(day: string, slot: string): boolean {
  const d = day.trim();
  if (d < todayYmd()) return true;
  if (d > todayYmd()) return false;
  const nowMin = timeToMinutes(
    `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );
  const slotMin = timeToMinutes(slotStart(slot));
  if (slotMin < 0 || nowMin < 0) return false;
  return slotMin <= nowMin;
}

export function parseSlotRange(slot: string): { start: string; end: string } | null {
  const trimmed = slot.trim();
  const match = trimmed.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (!match) return null;
  const startMin = timeToMinutes(match[1]);
  const endMin = timeToMinutes(match[2]);
  if (startMin < 0 || endMin < 0) return null;
  if (endMin - startMin !== SLOT_DURATION_MINUTES) return null;
  return {
    start: minutesToTime(startMin),
    end: minutesToTime(endMin),
  };
}

export function normalizeSlot(slot: string): string | null {
  const parsed = parseSlotRange(slot);
  if (!parsed) return null;
  return `${parsed.start} - ${parsed.end}`;
}

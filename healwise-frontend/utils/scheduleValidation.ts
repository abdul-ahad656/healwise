/** Client-side schedule validation (matches backend Asia/Karachi rules). */

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function timeToMinutes(value: string): number {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function slotStart(value: string): string {
  const match = String(value).trim().match(/^(\d{1,2}:\d{2})/);
  return match ? match[1] : String(value).trim();
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

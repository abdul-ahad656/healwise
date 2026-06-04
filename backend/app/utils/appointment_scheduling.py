"""Shared scheduling helpers (Asia/Karachi)."""
import re
from datetime import datetime
from typing import Optional

import pytz

TZ = pytz.timezone("Asia/Karachi")
MIN_CONSULTATION_MINUTES_AUTO_COMPLETE = 30


def now_local() -> datetime:
    return datetime.now(TZ).replace(tzinfo=None)


def time_to_minutes(value: str) -> int:
    match = re.match(r"^(\d{1,2}):(\d{2})", str(value).strip())
    if not match:
        return -1
    hours, minutes = int(match.group(1)), int(match.group(2))
    if hours > 23 or minutes > 59:
        return -1
    return hours * 60 + minutes


def slot_start_string(slot: str) -> str:
    match = re.match(r"^(\d{1,2}:\d{2})", str(slot).strip())
    return match.group(1) if match else str(slot).strip()


def is_past_day(day: str, now: Optional[datetime] = None) -> bool:
    current = now or now_local()
    return str(day).strip() < current.strftime("%Y-%m-%d")


def is_past_slot(day: str, slot: str, now: Optional[datetime] = None) -> bool:
    current = now or now_local()
    day = str(day).strip()
    if day < current.strftime("%Y-%m-%d"):
        return True
    if day > current.strftime("%Y-%m-%d"):
        return False
    slot_minutes = time_to_minutes(slot_start_string(slot))
    now_minutes = time_to_minutes(current.strftime("%H:%M"))
    if slot_minutes < 0 or now_minutes < 0:
        return False
    return slot_minutes <= now_minutes


def filter_future_slots(day: str, slots: list, now: Optional[datetime] = None) -> list:
    cleaned = []
    for slot in slots or []:
        text = str(slot).strip()
        if not text:
            continue
        if is_past_slot(day, text, now):
            continue
        cleaned.append(text)
    return cleaned


def recompute_overlap_duration_seconds(appointment: dict) -> int:
    """Overlap between patient and doctor when both joined and left."""
    keys = (
        ("patientJoinedAt", "patientLeftAt"),
        ("doctorJoinedAt", "doctorLeftAt"),
    )
    parsed = []
    for join_key, leave_key in keys:
        joined = appointment.get(join_key)
        left = appointment.get(leave_key)
        if not joined or not left:
            return int(appointment.get("consultationDurationSeconds") or 0)
        if hasattr(joined, "isoformat"):
            joined = joined
        if hasattr(left, "isoformat"):
            left = left
        if isinstance(joined, str):
            joined = datetime.fromisoformat(joined.replace("Z", ""))
        if isinstance(left, str):
            left = datetime.fromisoformat(left.replace("Z", ""))
        parsed.append((joined, left))

    if len(parsed) != 2:
        return int(appointment.get("consultationDurationSeconds") or 0)

    (p_join, p_leave), (d_join, d_leave) = parsed
    overlap_start = max(p_join, d_join)
    overlap_end = min(p_leave, d_leave)
    if overlap_end <= overlap_start:
        return 0
    return int((overlap_end - overlap_start).total_seconds())

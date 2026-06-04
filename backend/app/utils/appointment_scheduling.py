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


def _parse_utc_timestamp(value) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", ""))
    return None


def recompute_overlap_duration_seconds(appointment: dict) -> int:
    """
    Overlap while both patient and doctor are in the call.
    Uses utcnow() when a party has joined but not left yet (e.g. other side ended first).
    """
    stored = int(appointment.get("consultationDurationSeconds") or 0)

    p_join = _parse_utc_timestamp(appointment.get("patientJoinedAt"))
    d_join = _parse_utc_timestamp(appointment.get("doctorJoinedAt"))
    if not p_join or not d_join:
        return stored

    now = datetime.utcnow()
    p_end = _parse_utc_timestamp(appointment.get("patientLeftAt")) or now
    d_end = _parse_utc_timestamp(appointment.get("doctorLeftAt")) or now

    overlap_start = max(p_join, d_join)
    overlap_end = min(p_end, d_end)
    if overlap_end <= overlap_start:
        return stored

    computed = int((overlap_end - overlap_start).total_seconds())
    return max(computed, stored)

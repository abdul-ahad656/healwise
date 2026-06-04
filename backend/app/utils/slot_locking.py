"""Atomic doctor slot holds to prevent double booking during payment."""
from datetime import datetime, timedelta
from typing import Optional, Set, Tuple

from bson.objectid import ObjectId
from pymongo.errors import DuplicateKeyError

from app.extensions import mongo
from app.utils.appointment_scheduling import slot_start_string

COLLECTION = "appointment_slot_locks"

ACTIVE_APPOINTMENT_STATUSES = [
    "pending",
    "accepted",
    "confirmed",
    "in_progress",
]

PAYMENT_STATUSES_HOLDING_SLOT = ["pending", "pending_review", "paid"]

LOCK_TTL_STRIPE_HOURS = 2
LOCK_TTL_EASYPAISA_HOURS = 168  # 7 days — manual proof + admin review


class SlotUnavailableError(Exception):
    """Raised when a doctor slot cannot be reserved."""


def _utcnow() -> datetime:
    return datetime.utcnow()


def _lock_expiry(payment_method: str) -> datetime:
    hours = (
        LOCK_TTL_EASYPAISA_HOURS
        if payment_method == "easypaisa"
        else LOCK_TTL_STRIPE_HOURS
    )
    return _utcnow() + timedelta(hours=hours)


def ensure_slot_lock_indexes() -> None:
    if mongo.db is None:
        return
    col = mongo.db[COLLECTION]
    col.create_index(
        [
            ("doctorId", 1),
            ("appointmentDate", 1),
            ("appointmentTime", 1),
        ],
        unique=True,
        name="unique_doctor_slot_lock",
    )
    col.create_index(
        [("expiresAt", 1)],
        expireAfterSeconds=0,
        name="slot_lock_ttl",
    )
    mongo.db.appointments.create_index(
        [
            ("doctorId", 1),
            ("appointmentDate", 1),
            ("appointmentTime", 1),
        ],
        unique=True,
        name="unique_active_doctor_appointment_slot",
        partialFilterExpression={
            "status": {"$in": ACTIVE_APPOINTMENT_STATUSES},
        },
    )


def _active_appointment_filter(
    doctor_id: str,
    appointment_date: str,
    appointment_time: str,
    exclude_appointment_id: Optional[ObjectId] = None,
) -> dict:
    query = {
        "doctorId": doctor_id,
        "appointmentDate": appointment_date,
        "appointmentTime": appointment_time,
        "status": {"$in": ACTIVE_APPOINTMENT_STATUSES},
    }
    if exclude_appointment_id:
        query["_id"] = {"$ne": exclude_appointment_id}
    return query


def has_active_appointment(
    doctor_id: str,
    appointment_date: str,
    appointment_time: str,
    exclude_appointment_id: Optional[ObjectId] = None,
) -> bool:
    return (
        mongo.db.appointments.find_one(
            _active_appointment_filter(
                doctor_id, appointment_date, appointment_time, exclude_appointment_id
            )
        )
        is not None
    )


def _lock_is_stale(lock: dict) -> bool:
    expires = lock.get("expiresAt")
    if expires and isinstance(expires, datetime) and expires < _utcnow():
        return True
    return False


def _delete_lock(doctor_id: str, appointment_date: str, appointment_time: str) -> None:
    mongo.db[COLLECTION].delete_one(
        {
            "doctorId": doctor_id,
            "appointmentDate": appointment_date,
            "appointmentTime": appointment_time,
        }
    )


def release_slot_lock(
    doctor_id: str,
    appointment_date: str,
    appointment_time: str,
) -> None:
    _delete_lock(doctor_id, appointment_date, appointment_time)


def release_slot_lock_for_payment(payment: dict) -> None:
    if not payment:
        return
    meta = payment.get("metadata") or {}
    doctor_id = str(payment.get("doctorId") or meta.get("doctorId") or "")
    appointment_date = meta.get("appointmentDate") or payment.get("appointmentDate")
    appointment_time = meta.get("appointmentTime") or payment.get("appointmentTime")
    if doctor_id and appointment_date and appointment_time:
        release_slot_lock(doctor_id, appointment_date, appointment_time)


def acquire_slot_lock(
    doctor_id: str,
    appointment_date: str,
    appointment_time: str,
    user_id: str,
    payment_method: str = "stripe",
    payment_id: Optional[ObjectId] = None,
) -> ObjectId:
    """
    Reserve a slot atomically. Raises SlotUnavailableError if taken.
    Same patient may refresh hold on the same slot (e.g. retry checkout).
    """
    if has_active_appointment(doctor_id, appointment_date, appointment_time):
        raise SlotUnavailableError("Doctor is already booked at this time")

    now = _utcnow()
    lock_doc = {
        "doctorId": doctor_id,
        "appointmentDate": appointment_date,
        "appointmentTime": appointment_time,
        "userId": user_id,
        "paymentMethod": payment_method,
        "paymentId": payment_id,
        "createdAt": now,
        "updatedAt": now,
        "expiresAt": _lock_expiry(payment_method),
    }

    col = mongo.db[COLLECTION]

    try:
        result = col.insert_one(lock_doc)
        return result.inserted_id
    except DuplicateKeyError:
        existing = col.find_one(
            {
                "doctorId": doctor_id,
                "appointmentDate": appointment_date,
                "appointmentTime": appointment_time,
            }
        )
        if not existing:
            raise SlotUnavailableError("This time slot was just booked by another patient")

        if _lock_is_stale(existing) or str(existing.get("userId")) == str(user_id):
            col.delete_one({"_id": existing["_id"]})
            try:
                result = col.insert_one(lock_doc)
                return result.inserted_id
            except DuplicateKeyError:
                pass

        raise SlotUnavailableError("This time slot is reserved by another patient")


def attach_payment_to_lock(
    doctor_id: str,
    appointment_date: str,
    appointment_time: str,
    payment_id: ObjectId,
    payment_method: str,
) -> None:
    mongo.db[COLLECTION].update_one(
        {
            "doctorId": doctor_id,
            "appointmentDate": appointment_date,
            "appointmentTime": appointment_time,
        },
        {
            "$set": {
                "paymentId": payment_id,
                "paymentMethod": payment_method,
                "updatedAt": _utcnow(),
                "expiresAt": _lock_expiry(payment_method),
            }
        },
    )


def get_held_slots_for_doctor(doctor_id: str) -> Set[Tuple[str, str]]:
    """(date, time) pairs currently locked (non-expired)."""
    now = _utcnow()
    held: Set[Tuple[str, str]] = set()
    for lock in mongo.db[COLLECTION].find(
        {
            "doctorId": doctor_id,
            "expiresAt": {"$gte": now},
        },
        {"appointmentDate": 1, "appointmentTime": 1},
    ):
        held.add((lock["appointmentDate"], lock["appointmentTime"]))
    return held


def get_active_appointment_slots_for_doctor(doctor_id: str) -> Set[Tuple[str, str]]:
    booked: Set[Tuple[str, str]] = set()
    for appt in mongo.db.appointments.find(
        {
            "doctorId": doctor_id,
            "status": {"$in": ACTIVE_APPOINTMENT_STATUSES},
        },
        {"appointmentDate": 1, "appointmentTime": 1},
    ):
        booked.add((appt["appointmentDate"], appt["appointmentTime"]))
    return booked


def get_unavailable_slots_for_doctor(doctor_id: str) -> Set[Tuple[str, str]]:
    return get_held_slots_for_doctor(doctor_id) | get_active_appointment_slots_for_doctor(
        doctor_id
    )


def _slot_matches_unavailable(slot: str, unavailable: Set[Tuple[str, str]], day: str) -> bool:
    start = slot_start_string(slot)
    for booked_day, booked_time in unavailable:
        if booked_day != day:
            continue
        if booked_time == slot or slot_start_string(booked_time) == start:
            return True
    return False


def filter_slots_for_public_view(
    doctor_id: str, day: str, slots: list
) -> list:
    unavailable = get_unavailable_slots_for_doctor(doctor_id)
    return [
        s
        for s in slots
        if not _slot_matches_unavailable(s, unavailable, day)
    ]


def create_appointment_from_payment(payment: dict):
    """
    Idempotent appointment creation after successful payment.
    Returns (appointment_id or None, error_message or None).
    """
    from app.models.payment_model import payment_has_booked_appointment

    if payment_has_booked_appointment(payment):
        rid = payment.get("appointmentRecordId")
        return (str(rid) if rid else None, None)

    meta = payment.get("metadata") or {}
    doctor_id = str(meta.get("doctorId") or payment.get("doctorId") or "")
    appointment_date = meta.get("appointmentDate")
    appointment_time = meta.get("appointmentTime")
    patient_id = payment.get("userId")
    symptom_id = meta.get("symptomId")
    payment_id = payment["_id"]

    if not all([doctor_id, appointment_date, appointment_time, patient_id]):
        return (None, "Missing appointment details in payment")

    if has_active_appointment(doctor_id, appointment_date, appointment_time):
        return (None, "Doctor is already booked at this time")

    appointment = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "symptomId": symptom_id,
        "appointmentDate": appointment_date,
        "appointmentTime": appointment_time,
        "status": "accepted",
        "paymentId": str(payment_id),
        "paymentStatus": "paid",
        "requiresPayment": True,
        "trackingId": payment.get("appointmentTrackingId")
        or payment.get("appointmentId"),
        "createdAt": _utcnow(),
        "updatedAt": _utcnow(),
    }

    try:
        result = mongo.db.appointments.insert_one(appointment)
    except DuplicateKeyError:
        return (None, "Doctor is already booked at this time")

    release_slot_lock(doctor_id, appointment_date, appointment_time)
    return (str(result.inserted_id), None)


def reschedule_slot_lock(
    doctor_id: str,
    old_date: str,
    old_time: str,
    new_date: str,
    new_time: str,
    user_id: str,
) -> None:
    """Move hold from old slot to new when rescheduling before/at payment edge cases."""
    release_slot_lock(doctor_id, old_date, old_time)
    if has_active_appointment(doctor_id, new_date, new_time):
        raise SlotUnavailableError("Doctor is already booked at this time")
    unavailable = get_unavailable_slots_for_doctor(doctor_id)
    if (new_date, new_time) in unavailable:
        raise SlotUnavailableError("Selected slot is not available")

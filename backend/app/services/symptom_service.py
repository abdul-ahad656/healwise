from app.models.symptom_model import create_symptom_record, update_symptom, get_symptom_by_id
from app.services.ai_service import predict_symptoms
from bson.objectid import ObjectId

# def process_and_store_symptom(user_id: str, text: str, language: str = "en"):
#     # 1) create initial DB record with processing state
#     record = {
#         "userId": user_id,
#         "text": text,
#         "language": language,
#         "aiStatus": "processing",
#         "aiAnalysis": None,
#         "source": "user"  # can be "user" or "audio" etc.
#     }
#     res = create_symptom_record(record)
#     symptom_id = str(res.inserted_id)

#     # 2) run AI (synchronously here). For heavy loads, run this in background worker (Celery / RQ).
#     try:
#         ai_result = predict_symptoms(text, top_k=5)
#         update_symptom(symptom_id, {"aiStatus": "done", "aiAnalysis": ai_result})
#     except Exception as e:
#         update_symptom(symptom_id, {"aiStatus": "error", "aiAnalysis": {"error": str(e)}})

#     return symptom_id

# def fetch_symptom(symptom_id: str):
#     doc = get_symptom_by_id(symptom_id)
#     if doc is None:
#         return None
#     # convert ObjectId fields to strings
#     doc["_id"] = str(doc["_id"])
#     return doc


def process_and_store_symptom(user_id: str, text: str, language: str):
    """
    Runs AI first, then saves everything, then returns result
    """

    # 1️⃣ Run AI immediately
    ai_result = predict_symptoms(text, top_k=5)

    # Optional: pick best prediction
    primary_prediction = ai_result[0]

    # 2️⃣ Prepare DB record
    record = {
        "userId": user_id,
        "text": text,
        "language": language,
        "aiPrediction": primary_prediction["label"],
        "confidence": round(primary_prediction["score"], 4),
        "allPredictions": ai_result
    }

    # 3️⃣ Save to DB
    res = create_symptom_record(record)

    return {
        "symptomId": str(res.inserted_id),
        "prediction": primary_prediction["label"],
        "confidence": primary_prediction["score"],
        "allPredictions": ai_result
    }
import os
import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from flask import current_app

# Lazy load global objects
_tokenizer = None
_model = None
_id2label = None

def _load_model():
    global _tokenizer, _model, _id2label
    if _tokenizer is not None and _model is not None:
        return

    model_dir = current_app.config.get("ML_MODEL_DIR", "app/ml_model/clinicalbert_finetuned")
    # load label map
    label_map_path = os.path.join(model_dir, "label_map.json")
    if os.path.exists(label_map_path):
        with open(label_map_path, "r") as f:
            lm = json.load(f)
            # support both formats
            if "id2label" in lm:
                _id2label = {int(k): v for k, v in lm["id2label"].items()}
            elif "id2label" in lm:
                _id2label = lm["id2label"]
            elif "id2label" not in lm and "label2id" in lm:
                # invert label2id if necessary
                _id2label = {int(v): k for k, v in lm["label2id"].items()}
            else:
                # last-resort: try to cast all keys to int
                _id2label = {int(k): v for k, v in lm.items()}
    else:
        raise FileNotFoundError(f"label_map.json not found in {model_dir}")

    _tokenizer = AutoTokenizer.from_pretrained(model_dir)
    # Use device-aware loading
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    _model.to(device)
    _model.eval()

def predict_symptoms(text: str, top_k: int = 3):
    """
    Returns list of {label, score} sorted by score desc.
    """
    _load_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = _tokenizer(text, truncation=True, padding="max_length", max_length=128, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = _model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1).cpu().numpy().flatten()
    top_idx = np.argsort(probs)[::-1][:top_k]
    results = []
    for i in top_idx:
        label = _id2label.get(int(i), str(i))
        results.append({"label": label, "score": float(probs[int(i)])})
    return results

"""Loads the trained Bi-LSTM model + tokenizer and exposes a predict() function."""
import json
import pickle
from pathlib import Path

import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"


class BloomClassifier:
    def __init__(self):
        self.model = load_model(MODELS_DIR / "bilstm_bloom_classifier.keras")
        with open(MODELS_DIR / "tokenizer.pkl", "rb") as f:
            self.tokenizer = pickle.load(f)
        with open(MODELS_DIR / "config.json") as f:
            config = json.load(f)
        self.max_seq_len = config["max_seq_len"]
        self.bloom_levels = {int(k): v for k, v in config["bloom_levels"].items()}

    def predict(self, question: str) -> dict:
        seq = self.tokenizer.texts_to_sequences([question])
        padded = pad_sequences(seq, maxlen=self.max_seq_len, padding="post", truncating="post")
        probs = self.model.predict(padded, verbose=0)[0]
        level_idx = int(np.argmax(probs))  # 0-indexed
        level_number = level_idx + 1  # 1-6
        return {
            "level_number": level_number,
            "level_name": self.bloom_levels[level_number],
            "confidence": float(probs[level_idx]),
            "probabilities": {self.bloom_levels[i + 1]: float(p) for i, p in enumerate(probs)},
        }

    def predict_batch(self, questions: list[str]) -> list[dict]:
        seqs = self.tokenizer.texts_to_sequences(questions)
        padded = pad_sequences(seqs, maxlen=self.max_seq_len, padding="post", truncating="post")
        probs_batch = self.model.predict(padded, verbose=0)
        results = []
        for probs in probs_batch:
            level_idx = int(np.argmax(probs))
            level_number = level_idx + 1
            results.append(
                {
                    "level_number": level_number,
                    "level_name": self.bloom_levels[level_number],
                    "confidence": float(probs[level_idx]),
                    "probabilities": {self.bloom_levels[i + 1]: float(p) for i, p in enumerate(probs)},
                }
            )
        return results


_classifier_instance: BloomClassifier | None = None


def get_classifier() -> BloomClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = BloomClassifier()
    return _classifier_instance

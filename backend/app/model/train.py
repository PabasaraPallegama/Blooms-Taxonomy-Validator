"""
Trains the Bi-LSTM Bloom's Taxonomy classifier on the labeled dataset in
resera/dataset/Train and resera/dataset/Test, and saves the model + tokenizer
into resera/backend/models/ for the FastAPI app to load at runtime.

Run:
    python app/model/train.py
"""
import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.layers import Bidirectional, Dense, Dropout, Embedding, Input, LSTM
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATASET_DIR = BACKEND_DIR.parent / "dataset"
MODELS_DIR = BACKEND_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

MAX_VOCAB_SIZE = 5000
MAX_SEQ_LEN = 40
EMBEDDING_DIM = 128
NUM_BLOOM_LEVELS = 6

BLOOM_LEVELS = {
    1: "Remember",
    2: "Understand",
    3: "Apply",
    4: "Analyze",
    5: "Evaluate",
    6: "Create",
}


def load_dataset():
    train_df = pd.read_csv(DATASET_DIR / "Train" / "dataset_train.csv")
    test_df = pd.read_csv(DATASET_DIR / "Test" / "dataset.csv")
    return train_df, test_df


def build_model(vocab_size: int) -> Model:
    inputs = Input(shape=(MAX_SEQ_LEN,), name="question_tokens")
    x = Embedding(input_dim=vocab_size, output_dim=EMBEDDING_DIM, mask_zero=True)(inputs)
    x = Bidirectional(LSTM(64, return_sequences=True))(x)
    x = Bidirectional(LSTM(32))(x)
    x = Dropout(0.3)(x)
    x = Dense(32, activation="relu")(x)
    outputs = Dense(NUM_BLOOM_LEVELS, activation="softmax", name="bloom_level")(x)

    model = Model(inputs=inputs, outputs=outputs)
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def main():
    train_df, test_df = load_dataset()
    print(f"Train rows: {len(train_df)} | Test rows: {len(test_df)}")

    train_texts = train_df["question"].astype(str).tolist()
    train_labels = (train_df["bloom_level_number"].astype(int) - 1).to_numpy()  # 0-indexed for softmax

    test_texts = test_df["question"].astype(str).tolist()
    test_labels = (test_df["bloom_level_number"].astype(int) - 1).to_numpy()

    tokenizer = Tokenizer(num_words=MAX_VOCAB_SIZE, oov_token="<OOV>")
    tokenizer.fit_on_texts(train_texts)

    X_train = pad_sequences(tokenizer.texts_to_sequences(train_texts), maxlen=MAX_SEQ_LEN, padding="post", truncating="post")
    X_test = pad_sequences(tokenizer.texts_to_sequences(test_texts), maxlen=MAX_SEQ_LEN, padding="post", truncating="post")

    vocab_size = min(MAX_VOCAB_SIZE, len(tokenizer.word_index) + 1)
    model = build_model(vocab_size)
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=8, restore_best_weights=True),
    ]

    model.fit(
        X_train,
        train_labels,
        validation_data=(X_test, test_labels),
        epochs=60,
        batch_size=16,
        callbacks=callbacks,
        verbose=2,
    )

    loss, accuracy = model.evaluate(X_test, test_labels, verbose=0)
    print(f"\nFinal held-out test accuracy: {accuracy:.4f} (loss: {loss:.4f})")

    # Save artifacts
    model.save(MODELS_DIR / "bilstm_bloom_classifier.keras")
    with open(MODELS_DIR / "tokenizer.pkl", "wb") as f:
        pickle.dump(tokenizer, f)
    with open(MODELS_DIR / "config.json", "w") as f:
        json.dump(
            {
                "max_seq_len": MAX_SEQ_LEN,
                "max_vocab_size": MAX_VOCAB_SIZE,
                "bloom_levels": BLOOM_LEVELS,
                "test_accuracy": float(accuracy),
            },
            f,
            indent=2,
        )

    print(f"\nSaved model + tokenizer + config to {MODELS_DIR}")


if __name__ == "__main__":
    main()

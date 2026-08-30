# 5. Implementation Guide

This is the hands-on build guide. It translates the four-module architecture from [04-system-architecture.md](04-system-architecture.md) into a concrete project structure, environment setup, and code skeletons. Code here is a **starting scaffold**, not the final proposal deliverable — fill in dataset paths, tune hyperparameters, and expand error handling as the project matures.

## 5.1 Environment Setup

### Prerequisites
- Python 3.10–3.11 (TensorFlow compatibility)
- Neo4j Desktop or Neo4j AuraDB (cloud) — for the Knowledge Graph
- Tesseract OCR engine installed system-wide (Pytesseract is a wrapper, not the engine itself)

### Install Tesseract (Windows)
Download and install from the [UB-Mannheim Tesseract build](https://github.com/UB-Mannheim/tesseract/wiki), then note the install path (typically `C:\Program Files\Tesseract-OCR\tesseract.exe`) — you'll point Pytesseract at it in code.

### Python environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install tensorflow spacy nltk pytesseract pdf2image pillow gensim
pip install neo4j python-dotenv scikit-learn pandas numpy matplotlib seaborn

python -m spacy download en_core_web_sm
```

> `pdf2image` requires **Poppler** on Windows (for converting PDF pages to images before OCR). Download poppler binaries and add the `bin` folder to PATH, or pass `poppler_path=` explicitly in code.

### Neo4j
- Install Neo4j Desktop, create a local DBMS, start it, and note the Bolt URI (default `bolt://localhost:7687`), username, and password.
- Or use Neo4j AuraDB Free tier for a managed cloud instance.

## 5.2 Recommended Project Structure

```
exam-fairness-auditor/
├── data/
│   ├── raw/                  # original PDFs/images of syllabi & exam papers
│   ├── processed/            # OCR'd + cleaned text
│   └── training/             # labeled Bloom's-level datasets (Kaggle/UCI/ACL sources)
├── src/
│   ├── ingestion/
│   │   ├── ocr_extractor.py       # Module 1: Pytesseract PDF/image -> raw text
│   │   └── preprocess.py          # Module 1: SpaCy cleaning, lemmatization, tokenization
│   ├── embeddings/
│   │   └── vectorizer.py          # Word2Vec/GloVe embedding layer prep
│   ├── classification/
│   │   ├── model.py               # Module 2: Bi-LSTM architecture
│   │   ├── train.py               # training loop
│   │   └── predict.py             # inference on new exam questions
│   ├── knowledge_graph/
│   │   ├── schema.cypher          # Module 3: Neo4j node/edge schema
│   │   ├── graph_builder.py       # populate Neo4j from syllabus data
│   │   └── graph_queries.py       # lookup required Bloom's level per topic/outcome
│   ├── fairness_engine/
│   │   └── fairness_index.py      # Module 4: compare predicted vs. required levels
│   └── evaluation/
│       ├── metrics.py             # confusion matrix, F1, precision/recall
│       └── correlation.py         # Pearson r, Cohen's kappa vs. expert panel
├── notebooks/                # exploratory analysis, model prototyping
├── models/                   # saved Bi-LSTM weights
├── requirements.txt
└── docs/guide/                # this guide
```

## 5.3 Module 1 — Document Digestion & Pre-processing

### OCR extraction
```python
# src/ingestion/ocr_extractor.py
import pytesseract
from pdf2image import convert_from_path

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_pdf(pdf_path: str, poppler_path: str | None = None) -> str:
    pages = convert_from_path(pdf_path, dpi=300, poppler_path=poppler_path)
    full_text = []
    for page_image in pages:
        text = pytesseract.image_to_string(page_image)
        full_text.append(text)
    return "\n".join(full_text)
```

### SpaCy cleaning + lemmatization
```python
# src/ingestion/preprocess.py
import spacy

nlp = spacy.load("en_core_web_sm")

def clean_and_lemmatize(raw_text: str) -> list[str]:
    doc = nlp(raw_text)
    tokens = [
        token.lemma_.lower()
        for token in doc
        if not token.is_space and not token.is_punct and not token.is_stop
    ]
    return tokens

def split_into_questions(raw_text: str) -> list[str]:
    """Naive question splitter — refine with regex for the actual paper format
    (e.g., numbered items like '1.', 'Q1)', 'a)')."""
    import re
    candidates = re.split(r"\n(?=\d+[\.\)]\s)", raw_text)
    return [c.strip() for c in candidates if c.strip()]
```

### Word2Vec embedding
```python
# src/embeddings/vectorizer.py
from gensim.models import Word2Vec
import numpy as np

def train_word2vec(tokenized_corpus: list[list[str]], vector_size: int = 300) -> Word2Vec:
    return Word2Vec(
        sentences=tokenized_corpus,
        vector_size=vector_size,
        window=5,
        min_count=1,
        workers=4,
    )

def question_to_vector_sequence(tokens: list[str], w2v_model: Word2Vec, max_len: int = 30) -> np.ndarray:
    vectors = [w2v_model.wv[t] for t in tokens if t in w2v_model.wv]
    vectors = vectors[:max_len]
    pad_len = max_len - len(vectors)
    if pad_len > 0:
        vectors += [np.zeros(w2v_model.vector_size)] * pad_len
    return np.array(vectors)
```

## 5.4 Module 2 — Bi-LSTM Cognitive Classifier

```python
# src/classification/model.py
import tensorflow as tf
from tensorflow.keras.layers import Input, Embedding, Bidirectional, LSTM, Dense, Dropout
from tensorflow.keras.models import Model

NUM_BLOOM_LEVELS = 6  # Remember, Understand, Apply, Analyze, Evaluate, Create

def build_bilstm_model(
    vocab_size: int,
    embedding_dim: int = 300,
    max_seq_len: int = 30,
    embedding_matrix=None,
) -> Model:
    inputs = Input(shape=(max_seq_len,), name="question_tokens")

    embedding_layer = Embedding(
        input_dim=vocab_size,
        output_dim=embedding_dim,
        weights=[embedding_matrix] if embedding_matrix is not None else None,
        trainable=embedding_matrix is None,  # freeze if using pre-trained Word2Vec/GloVe
        mask_zero=True,
    )(inputs)

    x = Bidirectional(LSTM(128, return_sequences=True))(embedding_layer)
    x = Bidirectional(LSTM(64))(x)
    x = Dropout(0.3)(x)
    x = Dense(64, activation="relu")(x)
    outputs = Dense(NUM_BLOOM_LEVELS, activation="softmax", name="bloom_level")(x)

    model = Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model
```

```python
# src/classification/train.py
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

def train(model, X, y, epochs=30, batch_size=32):
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ModelCheckpoint("models/bilstm_bloom_classifier.keras", save_best_only=True),
    ]
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
    )
    return history
```

**Bloom's level label encoding** (keep consistent everywhere):
```python
BLOOM_LEVELS = {
    0: "Remember",
    1: "Understand",
    2: "Apply",
    3: "Analyze",
    4: "Evaluate",
    5: "Create",
}
```

**Baseline models for comparison** (per RQ2 — required for evaluation, see [06-data-and-evaluation.md](06-data-and-evaluation.md)): train `sklearn.svm.SVC` and `sklearn.naive_bayes.MultinomialNB` on TF-IDF features of the same dataset as a benchmark against the Bi-LSTM.

## 5.5 Module 3 — Syllabus Knowledge Graph (Neo4j)

### Schema (Cypher)
```cypher
// src/knowledge_graph/schema.cypher

// Constraints
CREATE CONSTRAINT course_id IF NOT EXISTS FOR (c:Course) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT module_id IF NOT EXISTS FOR (m:Module) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (t:Topic) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT outcome_id IF NOT EXISTS FOR (o:LearningOutcome) REQUIRE o.id IS UNIQUE;

// Example nodes
// (:Course {id, name})
// (:Module {id, name, code})
// (:Topic {id, name})
// (:LearningOutcome {id, description, requiredBloomLevel})  // Breq: 1-6

// Example relationships
// (Course)-[:HAS_MODULE]->(Module)
// (Module)-[:HAS_TOPIC]->(Topic)
// (Module)-[:HAS_OUTCOME]->(LearningOutcome)
// (LearningOutcome)-[:TESTS_OUTCOME]->(Topic)
// (Module)-[:PRE_REQUISITE_OF]->(Module)
```

### Populate the graph
```python
# src/knowledge_graph/graph_builder.py
from neo4j import GraphDatabase

class SyllabusGraphBuilder:
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def add_module_outcome(self, module_id, module_name, outcome_id, outcome_desc, required_level: int, topic_ids: list[str]):
        with self.driver.session() as session:
            session.execute_write(self._create_module_outcome_tx, module_id, module_name, outcome_id, outcome_desc, required_level, topic_ids)

    @staticmethod
    def _create_module_outcome_tx(tx, module_id, module_name, outcome_id, outcome_desc, required_level, topic_ids):
        tx.run(
            """
            MERGE (m:Module {id: $module_id})
            SET m.name = $module_name
            MERGE (o:LearningOutcome {id: $outcome_id})
            SET o.description = $outcome_desc, o.requiredBloomLevel = $required_level
            MERGE (m)-[:HAS_OUTCOME]->(o)
            WITH o
            UNWIND $topic_ids AS topic_id
            MERGE (t:Topic {id: topic_id})
            MERGE (o)-[:TESTS_OUTCOME]->(t)
            """,
            module_id=module_id, module_name=module_name,
            outcome_id=outcome_id, outcome_desc=outcome_desc,
            required_level=required_level, topic_ids=topic_ids,
        )
```

### Query required level & validate topic membership
```python
# src/knowledge_graph/graph_queries.py

def get_required_bloom_level(session, topic_id: str) -> int | None:
    result = session.run(
        """
        MATCH (o:LearningOutcome)-[:TESTS_OUTCOME]->(t:Topic {id: $topic_id})
        RETURN o.requiredBloomLevel AS level
        ORDER BY level DESC LIMIT 1
        """,
        topic_id=topic_id,
    )
    record = result.single()
    return record["level"] if record else None

def is_topic_in_syllabus(session, topic_id: str) -> bool:
    result = session.run("MATCH (t:Topic {id: $topic_id}) RETURN t LIMIT 1", topic_id=topic_id)
    return result.single() is not None
```

## 5.6 Module 4 — Fairness Auditing & Warning Engine

```python
# src/fairness_engine/fairness_index.py
from dataclasses import dataclass

WARNING_THRESHOLD = 0.70  # per proposal section 4.5.3

@dataclass
class QuestionAudit:
    question_text: str
    predicted_topic_id: str
    predicted_bloom_level: int   # Bpred, 1-6
    required_bloom_level: int | None  # Breq, 1-6 or None if out-of-bounds
    in_syllabus: bool

def compute_alignment_score(b_pred: int, b_req: int, max_level: int = 6) -> float:
    """1.0 = perfect match; degrades with distance between predicted and required level."""
    distance = abs(b_pred - b_req)
    return max(0.0, 1.0 - (distance / (max_level - 1)))

def audit_question(audit: QuestionAudit) -> dict:
    if not audit.in_syllabus:
        return {
            "question": audit.question_text,
            "status": "OUT_OF_BOUNDS",
            "alignment_score": 0.0,
            "warning": True,
            "reason": "Topic not found in syllabus Knowledge Graph.",
        }

    score = compute_alignment_score(audit.predicted_bloom_level, audit.required_bloom_level)
    warning = score < WARNING_THRESHOLD
    return {
        "question": audit.question_text,
        "status": "ALIGNED" if not warning else "MISALIGNED",
        "predicted_level": audit.predicted_bloom_level,
        "required_level": audit.required_bloom_level,
        "alignment_score": round(score, 3),
        "warning": warning,
        "reason": (
            f"Predicted level {audit.predicted_bloom_level} deviates from required "
            f"level {audit.required_bloom_level}." if warning else "Within acceptable alignment."
        ),
    }

def compute_fairness_index(audits: list[dict]) -> float:
    """0-100% Fairness Index for the whole paper: mean alignment score across questions."""
    if not audits:
        return 0.0
    return round(sum(a["alignment_score"] for a in audits) / len(audits) * 100, 2)
```

**Cognitive Distribution Radar Chart** (visual output for the Fairness Scorecard):
```python
# quick matplotlib radar chart sketch — swap for a dashboard framework (e.g., Streamlit/Plotly) as the UI matures
import numpy as np
import matplotlib.pyplot as plt

def plot_cognitive_distribution(actual_counts: list[int], required_counts: list[int], labels=None):
    labels = labels or ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]
    angles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()
    actual_counts += actual_counts[:1]
    required_counts += required_counts[:1]
    angles += angles[:1]

    fig, ax = plt.subplots(subplot_kw={"polar": True})
    ax.plot(angles, actual_counts, label="Actual Exam Levels")
    ax.fill(angles, actual_counts, alpha=0.25)
    ax.plot(angles, required_counts, label="Intended Syllabus Levels")
    ax.fill(angles, required_counts, alpha=0.25)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels)
    ax.legend(loc="upper right")
    return fig
```

## 5.7 Wiring it together (end-to-end pipeline sketch)

```python
# example orchestration — src/run_audit.py (to be created)
from ingestion.ocr_extractor import extract_text_from_pdf
from ingestion.preprocess import split_into_questions, clean_and_lemmatize
from classification.predict import predict_bloom_level   # wraps model.predict + label decode
from knowledge_graph.graph_queries import get_required_bloom_level, is_topic_in_syllabus
from fairness_engine.fairness_index import QuestionAudit, audit_question, compute_fairness_index

def run_full_audit(exam_pdf_path: str, neo4j_session, topic_classifier):
    raw_text = extract_text_from_pdf(exam_pdf_path)
    questions = split_into_questions(raw_text)

    audits = []
    for q in questions:
        tokens = clean_and_lemmatize(q)
        predicted_level = predict_bloom_level(tokens)          # Module 2
        topic_id = topic_classifier(tokens)                    # topic-tagging step (rule-based or ML)
        in_syllabus = is_topic_in_syllabus(neo4j_session, topic_id)
        required_level = get_required_bloom_level(neo4j_session, topic_id) if in_syllabus else None

        audit = QuestionAudit(q, topic_id, predicted_level, required_level, in_syllabus)
        audits.append(audit_question(audit))

    fairness_index = compute_fairness_index(audits)
    return {"fairness_index": fairness_index, "questions": audits}
```

> **Note**: topic-tagging (mapping a question to a syllabus `Topic` node) isn't fully specified in the proposal — it's a natural extension point. Options: (a) a second lightweight classifier/similarity match against `Topic` node names/keywords, or (b) a TF-IDF/cosine-similarity lookup against topic descriptions (consistent with the literature review's similarity-based approaches in [02-literature-review.md](02-literature-review.md)).

Continue to [06-data-and-evaluation.md](06-data-and-evaluation.md) for dataset sourcing, preprocessing detail, and the evaluation/experiment plan.

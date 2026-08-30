# 6. Data Collection, Preprocessing & Evaluation Plan

## 6.1 Data Collection Methods

### 6.1.1 Secondary Data (Training & Benchmarking the Bi-LSTM)
- **Sources**: Kaggle, UCI Machine Learning Repository, ACL Anthology (datasets specifically focused on Bloom's Taxonomy classification).
- **Data type**: labeled text — thousands of exam questions categorized into the six Revised Bloom's Taxonomy levels (Remember, Understand, Apply, Analyze, Evaluate, Create).
- **Purpose**: train, tune, and benchmark the Bi-LSTM before applying it to institution-specific documents.

### 6.1.2 Direct/Primary Data (Case Study & Verification)
- **Source**: Software Engineering Department, NSBM Green University.
- **Artifacts collected**:
  - Modularized syllabi (official curriculum docs with Module Learning Outcomes / MLOs and Lesson Learning Outcomes / LLOs).
  - Final exam question papers (past + current, PDF or image format).
- **Format**: unstructured "dark data" (PDFs/images), digitized via the OCR pipeline (see [05-implementation-guide.md](05-implementation-guide.md) §5.3).

### 6.1.3 Expert Validation Data
- **Method**: 5–10 exam papers audited by **three senior lecturers/professors**, who manually map questions to Bloom's levels and provide a "Human Fairness Rating."
- **Purpose**: this becomes the **Ground Truth / gold standard**. The system's automated output is compared against it via **Pearson Correlation Coefficient** to confirm the AI's Fairness Score is pedagogically sound.

## 6.2 Data Preprocessing / Preparation

1. **OCR Stage** — Pytesseract converts exam PDF images into raw text.
2. **Cleaning Stage** — SpaCy handles more than sentence boundaries: **lemmatization** (e.g., "analyzing" → "analyze") and removal of non-informative noise.
3. **Vectorization** — since models can't read raw text, SpaCy tokens are converted into numerical vectors using **pre-trained embeddings (Word2Vec)**, ensuring semantically related words (e.g., "evaluate" and "critique") sit close together in vector space.

See [05-implementation-guide.md](05-implementation-guide.md) §5.3–5.4 for the corresponding code.

## 6.3 Evaluation Plan

Evaluation happens at three levels: **Algorithmic Accuracy**, **Structural Reliability**, and **User Utility**.

### 6.3.1 Algorithmic Performance (Bi-LSTM Classifier)
- **Confusion Matrix**: a 6×6 matrix to spot specific confusion points (e.g., model conflating "Analyze" with "Evaluate").
- **Precision, Recall, Macro-averaged F1-score**: macro-averaging matters because educational datasets are imbalanced (fewer "Create"-level questions exist) — this ensures the model isn't rewarded for ignoring rare higher-order classes.
  - **Precision** = accuracy of "Fairness" flags.
  - **Recall** = the system's ability to catch all instances of misalignment.
- **Baseline comparison**: benchmark the Bi-LSTM against traditional ML (SVM, Naive Bayes on TF-IDF features) to quantify the "contextual gain" from bidirectional deep learning (directly answers RQ2).

```python
# src/evaluation/metrics.py
from sklearn.metrics import confusion_matrix, classification_report, f1_score

def evaluate_classifier(y_true, y_pred, labels=None):
    cm = confusion_matrix(y_true, y_pred)
    report = classification_report(y_true, y_pred, target_names=labels, output_dict=True)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    return {"confusion_matrix": cm, "report": report, "macro_f1": macro_f1}
```

### 6.3.2 Expert–AI Correlation (Fairness Validation)
- **Pearson Correlation Coefficient (r)**: correlation between the AI-generated Fairness Index and the average fairness ratings from the 3-expert panel. A strong positive correlation validates the system's pedagogical logic.
- **Inter-Rater Reliability (Cohen's Kappa)**: measures agreement between the AI and human experts, to confirm the system's "judgments" are as reliable as a second human auditor.

```python
# src/evaluation/correlation.py
from scipy.stats import pearsonr
from sklearn.metrics import cohen_kappa_score

def expert_ai_correlation(ai_scores: list[float], expert_scores: list[float]):
    r, p_value = pearsonr(ai_scores, expert_scores)
    return {"pearson_r": r, "p_value": p_value}

def inter_rater_reliability(ai_labels: list[int], expert_labels: list[int]):
    return cohen_kappa_score(ai_labels, expert_labels)
```

### 6.3.3 Structural Integrity (Knowledge Graph Mapping)
- **Path Coverage Analysis**: % of exam questions successfully mapped to a specific Learning Outcome node in the graph.
- **Conflict Detection Rate**: how many "Cognitive Ceiling" violations (questions exceeding the required level of a module) the system catches vs. a manually audited baseline — directly evaluates RQ3.

### 6.3.4 System Utility & Efficiency
- **Time-to-Audit**: comparative time-motion study — minutes to audit a standard 10-page exam paper manually vs. automatically (targets the ≥70% time-reduction objective, and answers RQ4/RQ1 jointly).
- **Expert Feedback (Qualitative)**: Likert-scale survey to faculty on the "Explainability" of the Fairness Scorecard and whether warnings gave actionable insight for paper revision.

### 6.3.5 Systemic Utility — The Comparative Study
- **Method**: 10 exam papers audited both manually (by human experts) and automatically (by the system).
- **Metric**: Pearson Correlation Coefficient between the system's Fairness Score and human expert judgment (same technique as 6.3.2, applied at the whole-paper-fairness-score level rather than per-question).

## 6.4 Evaluation Summary Table

| Evaluation Area | Metric(s) | Answers |
|---|---|---|
| Bi-LSTM classification | Confusion matrix, Precision/Recall, Macro-F1, baseline (SVM/NB) comparison | RQ2 |
| Fairness score validity | Pearson r, Cohen's Kappa vs. expert panel | RQ1 |
| Knowledge Graph structure | Path coverage %, conflict detection rate | RQ3 |
| OCR + pipeline effectiveness | Character-level OCR accuracy, end-to-end audit time | RQ4 |
| Practical utility | Time-to-audit reduction, Likert-scale expert feedback | Comparison objectives |

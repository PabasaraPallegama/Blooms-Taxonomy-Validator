# 4. Research Strategy, Methodology & System Architecture

## 4.1 Research Strategy: Design Science Research (DSR)

The project follows **Design Science Research (DSR)** because the goal is to build and evaluate an **artifact** — the Automated Pedagogical Fairness Auditing System — that solves a real problem (manual, subjective, slow exam alignment auditing) at the case-study institution (NSBM Green University / UOWD context referenced in the proposal).

DSR stages used, and what happens in each:

1. **Problem Identification** — see below (4.1.1).
2. **Define Objectives** — technical, functional, and comparison objectives (4.1.3).
3. **Design and Development** — the 4-module artifact architecture (4.2).
4. **Demonstration** — a case-study run against a real Software Engineering syllabus + exam paper at NSBM (4.3).
5. **Evaluation** — accuracy, structural, and utility evaluation (see [06-data-and-evaluation.md](06-data-and-evaluation.md)).
6. **Communication** — academic paper, institutional report, optional open-source release (4.4).

### 4.1.1 Problem: The Challenge of Manual Pedagogical Auditing

- **Subjectivity and bias**: the same action verb ("State") is read differently by different auditors, causing unequal evaluation standards.
- **Manual, labor-intensive nature**: large departments end up "rubber-stamping" papers without deep review.
- **Cognitive Drift**: courses that claim to teach HOTS (e.g., Level 5 Evaluation) produce exams dominated by Level 1 recall — invisible without automated detection, and unfair to students who prepared for higher-order tasks.

### 4.1.2 Motivation for the Artifact

Move from **passive classification** to **active fairness auditing** — a "self-healing" curriculum tool combining Bi-LSTM (semantic understanding of questions) with a Knowledge Graph (structural/logical understanding of the syllabus), so teachers can monitor and fix "Fairness Gaps" live.

### 4.1.3 Objectives Recap

**Technical objectives**
- Context-aware cognitive classification via Bi-LSTM, target ≥85% accuracy across all 6 Bloom's levels.
- Structural alignment via a Neo4j Knowledge Graph modeling modules, outcomes, and cognitive requirements — enabling "Logical Validation" and enforcing a "Cognitive Ceiling."
- High-fidelity document ingestion via Pytesseract + SpaCy, at character-level accuracy sufficient for downstream DL classification.

**Functional objectives**
- Automated Fairness Scoring — a 0–100% "Fairness Index" per exam paper.
- Real-time conflict detection — flags "Out-of-Bounds" questions and "Alignment Gaps" (e.g., a Level 5 outcome tested only at Level 1).
- Explainable pedagogical feedback — XAI-style justification of *why* a warning was triggered (which keywords/graph relationships).

**Comparison objectives**
- ≥70% reduction in exam-audit preparation time vs. manual expert review.
- Reduced human subjectivity via standardized, data-driven "Ground Truth" classification.

## 4.2 Artifact Architecture — Four Modules

```
                    ┌────────────────────────────────────────┐
   PDF / Image  ──▶ │ Module 1: Document Digestion &          │
   (exam paper,     │ Pre-processing (Pytesseract + SpaCy)    │
   syllabus)        └───────────────────┬──────────────────────┘
                                         │ clean tokens / vectors
                                         ▼
                    ┌────────────────────────────────────────┐
                    │ Module 2: Cognitive Classification      │
                    │ (Bi-LSTM Layer)                         │──▶ Predicted Bloom's Level (per question)
                    └───────────────────┬──────────────────────┘
                                         │
   Syllabus docs ──▶ ┌────────────────────────────────────────┐
                    │ Module 3: Syllabus Knowledge Graph       │
                    │ Construction (Neo4j)                     │──▶ Required Bloom's Level (per topic/outcome)
                    └───────────────────┬──────────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────────┐
                    │ Module 4: Fairness Auditing & Warning    │
                    │ Engine                                   │──▶ Fairness Index, Scorecard, Radar Chart, Warnings
                    └────────────────────────────────────────┘
```

### Module 1 — Document Digestion & Pre-processing
- **Pytesseract (OCR)** ingests PDFs/images of exam papers and syllabi.
- **SpaCy** performs linguistic refinement:
  - **Tokenization & Lemmatization**: reduce verbs to root form ("analyzing"/"analyzed" → "analyze") for consistency.
  - **Semantic Vectorization**: Word2Vec embeddings so "summarize" is understood as semantically close to "paraphrase."

### Module 2 — Cognitive Classification (Bi-LSTM Layer)
- **Design rationale**: unlike unidirectional models, Bi-LSTM captures context from both the start (action verb) and end (object complexity) of a question.
- **Architecture**: Embedding Layer → Bidirectional LSTM hidden layers → Softmax output layer producing a probability distribution over the 6 Bloom's levels.

### Module 3 — Syllabus Knowledge Graph Construction (Neo4j)
- **Nodes**: Syllabus Units, Topics, Learning Outcomes (each Outcome tagged with its required Bloom's level, `Breq`).
- **Edges**: `HAS_TOPIC`, `TESTS_OUTCOME`, `PRE_REQUISITE_OF` (also referred to as `Has_Outcome` / `Prerequisite_Of` in the narrative sections).
- Serves as the **"Ground Truth"** structural standard the exam paper is checked against.

### Module 4 — Fairness Auditing & Warning Engine
- Computes a **Fairness Index (F)** comparing the Bi-LSTM-predicted Bloom's level (`Bpred`) per question against the Knowledge-Graph-required level (`Breq`) for the topic it maps to.
- If alignment falls below a threshold (e.g., **0.70**), triggers an **Automated Warning** and renders a **Cognitive Distribution Radar Chart** showing where the exam is "too easy" or tests "out-of-bounds" content.

## 4.3 Technical Specifications

| Layer | Technology |
|---|---|
| Programming Language | Python 3.x |
| NLP Libraries | SpaCy, NLTK |
| Deep Learning Framework | TensorFlow / Keras (Bi-LSTM) |
| Graph Database | Neo4j |
| OCR Engine | Pytesseract |
| Embeddings | Word2Vec / GloVe (300-dim) |

## 4.4 Demonstration Plan (Case Study)

- **Context**: Software Engineering Department, NSBM Green University, Sri Lanka. A sample modularized syllabus + a final exam paper.
- **Operational workflow**:
  1. Populate the Syllabus Knowledge Graph with the module's Lesson Learning Outcomes (LLOs).
  2. Feed the Final Exam PDF through the Pytesseract–SpaCy OCR pipeline.
  3. Run the Bi-LSTM Classifier to predict each extracted question's Bloom's level.
  4. Produce a live **Fairness Scorecard** + **Cognitive Distribution (Radar) Chart** comparing actual vs. intended levels, surfacing "High Risk" misalignments (e.g., a Level 5 LLO tested only by Level 1 questions).

## 4.5 Communication Plan

- **Academic**: paper submission target — IEEE ICALT (International Conference on Advanced Learning Technologies) or a journal such as *Computers & Education*.
- **Institutional**: technical report + "User Manual" for the Fairness Dashboard, delivered to the University Quality Assurance Cell, with guidance on scaling across departments.
- **Open source (optional)**: anonymized Bloom's Taxonomy dataset + Neo4j graph schema published to GitHub/Zenodo for the Educational Data Mining research community.

Continue to [05-implementation-guide.md](05-implementation-guide.md) for concrete build steps and code skeletons.

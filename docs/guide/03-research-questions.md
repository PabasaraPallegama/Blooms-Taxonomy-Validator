# 3. Research Problem and Questions

## 3.1 Main Research Problem

> There is no standardized, automatic way to verify the constructive alignment between the questions used in final exams and the intended learning outcomes, resulting in **"cognitive drift"** — assessment questions that don't reflect the scope and cognitive level defined by the syllabus.

## 3.2 Specific Research Questions

### RQ1 — Quantifying the Cognitive Gap
**How can the "Cognitive Gap" between promised learning outcomes and actual exam content be quantified and visualized for educators?**

- **Issue**: "Surface Learning Bias" — assessments skew toward lower-order thinking (Bloom's Levels 1–2) even when the syllabus requires higher-order analysis/evaluation (Levels 4–6).
- **Proposed solution**: A **Fairness Scorecard** + **Cognitive Distribution Chart** giving an instant visual comparison of intended syllabus levels vs. AI-detected actual exam levels.

### RQ2 — Bi-LSTM vs. Keyword Matching
**To what extent can a Bidirectional LSTM (Bi-LSTM) improve classification accuracy of pedagogical verbs compared to traditional keyword-matching techniques?**

- **Issue**: Traditional systems struggle with context — e.g., "State" in *"State the law of gravity"* (Level 1) vs. *"State the implications of your findings"* (Level 4) is often misclassified by keyword matching.
- **Proposed solution**: A Bi-LSTM processes questions in both forward and backward directions, capturing the relationship between the initial action verb and the complexity of the succeeding noun phrases, enabling high-precision mapping to Revised Bloom's Taxonomy levels.

### RQ3 — Structural Dependency Gaps via Knowledge Graph
**How can a Knowledge Graph be utilized to detect structural "Dependency Gaps" and "Out-of-Bounds" content in a modularized syllabus?**

- **Issue**: Automated systems typically treat syllabi as linear text, missing that advanced modules have strict lower-level prerequisites.
- **Proposed solution**: A Neo4j-based Syllabus Knowledge Graph verifies that questions (a) map to the correct module at the correct Bloom's level, and (b) don't test "out-of-bounds" topics absent from the syllabus.

### RQ4 — Hybrid OCR–Deep Learning Pipeline Effectiveness
**What is the effectiveness of a hybrid OCR–Deep Learning pipeline in processing unstructured educational documents for real-time pedagogical auditing?**

- **Issue**: Exam papers and syllabi are mostly PDFs/images — "dark data" that traditional NLP models can't read directly.
- **Proposed solution**: Integrate **Pytesseract (OCR)** + **SpaCy** (preprocessing) + **Word2Vec** (embedding) into one pipeline that converts raw document images into structured, actionable pedagogical data.

---

Each RQ maps directly onto one of the four architecture modules in [04-system-architecture.md](04-system-architecture.md):

| RQ | Architecture Module |
|----|----------------------|
| RQ1 | Module 4 — Fairness Auditing & Warning Engine |
| RQ2 | Module 2 — Cognitive Classification (Bi-LSTM Layer) |
| RQ3 | Module 3 — Syllabus Knowledge Graph Construction |
| RQ4 | Module 1 — Document Digestion & Pre-processing |

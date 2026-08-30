# Automated Pedagogical Fairness Auditing System — Project Guide

This guide is derived from **`Research Proposal - Copy.docx`** (Automating Final Exam Fairness: A Deep Learning Approach to Align Questions with Bloom's Taxonomy and Learning Outcomes — NSBM Green University, BSc Software Engineering Capstone, Dec 2025).

It restructures the proposal into an actionable set of documents: a project overview, the literature/gap context, the research questions, the system architecture, a hands-on implementation guide (with setup commands and code skeletons), the data/evaluation plan, and ethics/limitations/timeline.

## How to use this guide

Read in order if you're new to the project; jump directly to a file if you already know what you need.

| # | File | What's in it |
|---|------|---------------|
| 1 | [01-project-overview.md](01-project-overview.md) | Background, motivation, primary & secondary objectives |
| 2 | [02-literature-review.md](02-literature-review.md) | Prior work summary, comparison table, identified research gap |
| 3 | [03-research-questions.md](03-research-questions.md) | Main problem statement + 4 research questions (issue → proposed solution) |
| 4 | [04-system-architecture.md](04-system-architecture.md) | Design Science Research strategy, 4-module architecture, tech stack, workflow |
| 5 | [05-implementation-guide.md](05-implementation-guide.md) | **Hands-on build guide**: environment setup, project structure, code skeletons for OCR, preprocessing, Bi-LSTM, Knowledge Graph, and the Fairness Engine |
| 6 | [06-data-and-evaluation.md](06-data-and-evaluation.md) | Data collection methods, preprocessing pipeline detail, evaluation metrics & experiment plan |
| 7 | [07-ethics-limitations-timeline.md](07-ethics-limitations-timeline.md) | Ethical considerations, study limitations, project timeline (Nov 2025 – Sep 2026) |
| 8 | [08-frontend-plan.md](08-frontend-plan.md) | React dashboard plan: user flow, MVP/nice-to-have features, tech stack, API contract |

## One-paragraph summary

The system ingests scanned/PDF exam papers and syllabus documents via OCR (Pytesseract) and NLP preprocessing (SpaCy, Word2Vec), classifies each exam question into one of the six Revised Bloom's Taxonomy levels using a Bidirectional LSTM, represents the syllabus's modules/topics/learning-outcomes/prerequisites as a Neo4j Knowledge Graph, and then computes a **Fairness Index** by comparing the Bi-LSTM-predicted cognitive levels against the levels required by the Knowledge Graph — surfacing "Cognitive Gap" and "Out-of-Bounds" warnings to educators via a Fairness Scorecard / Cognitive Distribution Radar Chart.

## Core technical stack

- **Language**: Python 3.x
- **OCR**: Pytesseract
- **NLP**: SpaCy, NLTK
- **Embeddings**: Word2Vec / GloVe (300-dim)
- **Deep Learning**: TensorFlow / Keras (Bidirectional LSTM)
- **Graph Database**: Neo4j
- **Case study domain**: Software Engineering Dept., NSBM Green University, Sri Lanka

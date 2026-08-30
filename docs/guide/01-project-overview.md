# 1. Project Overview

## 1.1 Background

Higher education has shifted from content delivery toward **Outcome-Based Education (OBE)**, where "Constructive Alignment" between Intended Learning Outcomes (ILOs) and assessment tasks is the primary quality metric. The **Revised Bloom's Taxonomy** ranks cognitive skills from lower-order (Remember) to higher-order (Evaluate, Create):

1. **Remember**
2. **Understand**
3. **Apply**
4. **Analyze**
5. **Evaluate**
6. **Create**

Institutions currently audit exam papers manually: subject-matter experts tag each question with a Bloom's level by hand. This is labor-intensive, slow, and subjective. Keyword-matching NLP approaches exist but fail to capture the *semantic context* of pedagogical verbs (e.g., "State" means something different in "State the law of gravity" vs. "State the implications of your findings").

## 1.2 Motivation

Exams often default to rote-memorization questions (easier to write and grade) even when the syllabus promises higher-order thinking. This "Surface Learning" bias is a form of academic unfairness — students are not tested on what they were promised, and are not evaluated against the skills the labor market actually needs.

The goal is an AI **"pedagogical guardrail"**: a system that objectively flags a question paper as "High Risk" / "Unfair" *before* it reaches students, protecting degree integrity. Technically, this means fusing:
- **Sequential deep learning** (Bi-LSTM) — for interpreting question text, and
- **Relational structured data** (Knowledge Graph) — for encoding syllabus logic and dependencies.

## 1.3 Study Objectives

### 1.3.1 Primary Objective
Develop an automated, AI-driven framework that evaluates the fairness and constructive alignment of final exam question papers against modular learning outcomes, using the Revised Bloom's Taxonomy.

### 1.3.2 Secondary Objectives
1. Implement a robust data extraction and pre-processing pipeline using **Pytesseract (OCR)** and **SpaCy** to digitize and clean unstructured educational documents.
2. Design and train a **Bidirectional LSTM (Bi-LSTM)** architecture for high-accuracy classification of exam questions, capturing bidirectional semantic context of pedagogical verbs.
3. Construct a **Syllabus Knowledge Graph** using **Neo4j** that maps logical dependencies between modules, lesson learning outcomes, and required cognitive levels.
4. Develop an **Automated Fairness Audit Engine** that generates real-time "Fairness Scorecards" and warnings for educators, identifying misalignments between predicted cognitive levels and syllabus requirements.

## 1.4 Target success criteria (from the proposal)

| Objective | Target |
|---|---|
| Bi-LSTM classification accuracy (6 Bloom's levels) | ≥ 85% |
| Reduction in manual audit preparation time | ≥ 70% vs. manual review |
| Expert–AI Fairness Score correlation (Pearson r) | Strong positive correlation (validation threshold) |
| Fairness alignment warning threshold | Triggered when alignment score < 0.70 |

See [04-system-architecture.md](04-system-architecture.md) for how these map to system components, and [06-data-and-evaluation.md](06-data-and-evaluation.md) for how they are measured.

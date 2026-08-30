# 2. Literature Review and Research Gap

## 2.1 Overview of Existing Studies

- **Constructive Alignment** (Biggs, 2003 [1]): learning activities and assessments should be designed to directly meet a module's Intended Learning Outcomes.
- **Revised Bloom's Taxonomy** (Anderson & Krathwohl, 2001 [2]): stratifies cognitive ability from Lower-Order Thinking Skills (LOTS: Remember, Understand, Apply) to Higher-Order Thinking Skills (HOTS: Analyze, Evaluate, Create).
- **Ramya Kumar et al., 2025 [3]**: misalignment between assessment outcomes and expected cognition drives students toward surface learning (memorization over comprehension) — a "cognitive gap" that automated tooling should help close.
- **Ontology-driven fairness frameworks** (Dimple, 2014 [4]; Paul et al., 2014 [5]): keywords extracted from questions are mapped to nodes in a syllabus ontology; fairness is computed from syllabus coverage. Example: a Data Mining subject ontology at Mumbai University, with the subject as root, major topics (classification, clustering, web mining, association rule mining) as level-1 nodes weighted by lecture hours.
- **General fairness-assessment pipeline**: (1) extract keywords from questions → (2) map to syllabus ontology → (3) compute syllabus coverage. Typical system design: preprocessing → feature extraction → classification → result combination.
- **Text mining / similarity techniques**:
  - **Cosine Similarity** between question vectors and syllabus vectors (Paul et al., 2014 [5]) — preferred for simplicity and length-independence.
  - **NLP preprocessing**: tokenization, stemming, POS tagging, lemmatization (WordNet Lemmatizer outperforms stemming, especially for verbs), chunking, parsing (Paul et al. [5]; Jayakodi et al., 2016 [6]).
  - **TF-IDF weighting** to score term importance across question papers and syllabus content (Rekha, 2012 [7]).
  - Implementation stacks in older studies: VB.NET front end + SQL Server back end, tested on modest hardware (2 GHz / 1 GB RAM) — now obsolete but indicative of the domain's maturity level.
- **Automated Bloom's classification — three technical generations**:
  1. **Rule-based systems**: keyword search + POS tagging for action verbs ("Describe," "Analyze"). Cheap to implement but blind to context/word-order.
  2. **Traditional ML** (SVM, Naive Bayes with TF-IDF features): better than rule-based, but Febriyana (2023 [8]) notes they still suffer the "word-order problem" — identical verbs signal different cognitive levels depending on sentence structure.
  3. **Deep Learning** (RNNs, Transformers, LSTMs — especially **Bi-LSTM**): Banujan et al. (2023 [9]) show Bi-LSTMs reading both forward and backward capture the link between the initial action verb and the complexity introduced later in the sentence, improving classification of the true cognitive intent.

## 2.2 Comparison of Existing Research

| # | Study | Focus | Key Method |
|---|-------|-------|------------|
| 1 | Ontology Driven Framework for Assessing Syllabus Fairness [5] | Syllabus-fairness scoring | Ontology + keyword mapping |
| 2 | A Syllabus-Fairness Measure for Evaluating Open-Ended Questions [6] | Open-ended question fairness | Similarity coefficients |
| 3 | WordNet & Cosine Similarity-based Classifier of Exam Questions using Bloom's Taxonomy [7] | Bloom's classification | WordNet + cosine similarity |
| 4 | Evaluating Teaching Content and Assessments based on Learning Outcomes [10] | Bloom's coverage checking | Rule/keyword-based, ~50% accuracy reported |
| 5 | Automated Evaluation Systems to Enhance Exam Quality and Reduce Test Anxiety (PMC, Feb 2025) [9] | Deep-learning pedagogical assessment | Bi-LSTM |

**This proposal's positioning**: builds on [10]'s idea of checking Bloom's-level coverage in a question paper (reported ~50% accuracy) by replacing rule/keyword matching with a **Bi-LSTM classifier** (targeting ≥85% accuracy) and adding a **Neo4j Knowledge Graph** to model syllabus structure/dependencies rather than a flat ontology or keyword list — enabling both *cognitive-level* alignment checks and *structural* ("out-of-bounds," "dependency gap") checks in one system.

## 2.3 Identification of the Research Gap

Prior work generally does **one** of the following, but not both:
- Classifies question cognitive level (keyword/ontology/ML/Bi-LSTM based), **or**
- Checks syllabus-coverage/similarity via ontology/keyword mapping.

None combine a **context-aware Bi-LSTM classifier** with a **graph-structured, dependency-aware syllabus model** to jointly detect both:
1. **Cognitive misalignment** (e.g., a Level 5 outcome tested only at Level 1), and
2. **Structural violations** (out-of-bounds topics, broken prerequisite chains).

This is the gap this project's system is designed to close — see [03-research-questions.md](03-research-questions.md) for how each research question targets a specific piece of that gap.

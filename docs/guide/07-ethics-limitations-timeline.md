# 7. Ethical Considerations, Limitations & Timeline

## 7.1 Ethical Considerations

Aligned with 2024 BERA (British Educational Research Association) guidelines and 2025 AI-governance frameworks for higher education.

### 7.1.1 Data Privacy and Anonymization
- **Non-disclosure**: all syllabus documents and exam papers used for demonstration are anonymized at the source. Instructor names, student-specific feedback, internal course codes are redacted **before** OCR processing.
- **Data minimization**: only "pedagogical metadata" (verbs, nouns, structural relationships) is extracted/stored. No personal data on student performance or individual staff records is processed or stored in the Knowledge Graph.
- **Compliance**: adheres to **GDPR** and **FERPA** for secure storage/handling of academic records.

### 7.1.2 Algorithmic Fairness and Bias Mitigation
- **Representativeness**: the Bi-LSTM is trained on diverse datasets spanning STEM, Humanities, and Social Sciences to avoid bias toward one department's linguistic style.
- **Periodic auditing**: "Bias Audits" during the Evaluation phase check the system doesn't unfairly penalize non-technical or unconventional phrasing.

### 7.1.3 Preservation of Academic Autonomy
- **Human-in-the-Loop (HITL)**: the system only produces "Warnings" and "Scorecards" — it cannot reject an exam paper automatically. Final pedagogical judgment always rests with the human educator / QA cell.
- **Explainability (XAI)**: every "High Risk" flag is accompanied by the specific verbs/syllabus nodes that triggered it, so educators can understand and contest the AI's logic.

### 7.1.4 Institutional Trust and Accountability
- **Informed consent**: department participation in the case-study phase is voluntary, with clear communication of how materials are audited and results reported.
- **Transparency of findings**: all AI limitations (OCR errors, classification inaccuracies) are disclosed to stakeholders to prevent over-reliance on the automated score.

## 7.2 Limitations of the Study

### 7.2.1 Technical and Algorithmic Constraints
- **Contextual ambiguity in short texts**: exam questions are short single sentences; the model can experience "semantic drift" distinguishing closely related HOTS levels (e.g., Analyze vs. Evaluate) without broader pedagogical context.
- **Data sparsity for training**: high-quality, human-annotated Bloom's Taxonomy datasets are small relative to general NLP corpora — risk of overfitting (model memorizing specific action verbs rather than generalizing cognitive intent).
- **OCR sensitivity**: audit accuracy depends heavily on input PDF quality. Low-res scans, non-standard fonts, or complex math notation can cause Pytesseract misreads (e.g., "O" vs "0"), propagating into misclassification.

### 7.2.2 Scope and Generalizability
- **Linguistic/subject domain**: limited to English-language documents; accuracy varies by discipline — strong for STEM/Social Sciences, weaker for creative arts or highly abstract theoretical fields with non-standard cognitive-level terminology.
- **Mathematical/symbolic content**: the pipeline is text-based; subjects relying on symbolic logic/equations (Advanced Mathematics, Chemistry) rather than action verbs may fall outside current classification capability.

### 7.2.3 Knowledge Graph Staticity
- **Dynamic syllabus updates**: the graph is a "snapshot" — frequently updated or highly flexible curricula require manual graph maintenance to stay an accurate Ground Truth.
- **Cold-start problem**: every new module needs a pre-built graph; initial digitization/mapping into Neo4j is a "start-up" cost limiting immediate scalability across an entire university.

### 7.2.4 Human–AI Discrepancy
- **Inter-rater variability**: Bloom's Taxonomy classification is inherently subjective — even human experts disagree. The system's "Fairness Score" should be treated as a **decision-support metric**, not an absolute objective truth.

## 7.3 Timeline

**Duration**: November 2025 → September 2026

The proposal document contains a Gantt-style timeline chart (not extractable as text from the source .docx — it's an embedded image/table). Recommended phase breakdown consistent with the DSR stages in [04-system-architecture.md](04-system-architecture.md):

| Phase | Approx. Period | DSR Stage |
|---|---|---|
| Proposal & literature finalization | Nov 2025 – Dec 2025 | Problem Identification / Define Objectives |
| Data collection (secondary + primary + expert panel setup) | Dec 2025 – Jan 2026 | Design and Development (data prep) |
| OCR + preprocessing pipeline build | Jan 2026 – Feb 2026 | Design and Development (Module 1) |
| Bi-LSTM design, training, tuning | Feb 2026 – Apr 2026 | Design and Development (Module 2) |
| Knowledge Graph schema + population | Mar 2026 – Apr 2026 | Design and Development (Module 3) |
| Fairness Engine + dashboard/scorecard | Apr 2026 – May 2026 | Design and Development (Module 4) |
| Case study demonstration (NSBM SE dept.) | May 2026 – Jun 2026 | Demonstration |
| Evaluation (accuracy, correlation, structural, utility) | Jun 2026 – Jul 2026 | Evaluation |
| Report writing, paper drafting, dissemination | Aug 2026 – Sep 2026 | Communication |

> If you have the actual Gantt chart image from the proposal, extract and insert exact dates/milestones here — the phases above are inferred from the DSR structure and the stated Nov 2025–Sep 2026 window, not transcribed verbatim from the source document.

## 7.4 References (from the proposal)

1. J. Biggs, *Teaching for Quality Learning at University: What the Student Does*, 2nd ed. Buckingham, UK: SRHE & Open University Press, 2003.
2. L. W. Anderson and D. R. Krathwohl, *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. New York, NY: Longman, 2001.
3. S. Ramya Kumar et al., "Bridging the Cognitive Gap: Automated Analysis of Constructive Alignment in Modern Higher Education," *J. Educ. Technol. Syst*, vol. 53, no. 2, pp. 145–162, 2025.
4. V. Dimple and J. D., "Use of Common-Word Order Syntactic Similarity Metric for Evaluating Syllabus Coverage of a Question Paper," vol. 6, no. 2, pp. 68–81, 2014.
5. D. V. Paul and J. D. P., "A Syllabus-Fairness Measure for Evaluating Open-Ended Questions," *Advances in Intelligent Systems and Computing — Advances in Signal Processing and Intelligent Recognition Systems*, pp. 57–71, 2014.
6. K. B. M. P. I. & M. D. Jayakodi, "WordNet and Cosine Similarity based Classifier of Exam Questions using Bloom's Taxonomy," *International Journal of Emerging Technologies in Learning (IJET)*, vol. 11, no. 4, p. 142, 2016.
7. R. Rekha et al., "Ontology Driven Framework for Assessing the Syllabus Fairness of a Question Paper," *2012 IEEE International Conference on Technology Enhanced Education (ICTEE)*, 2012.
8. Febriyana, "Automated Bloom's Taxonomy Classification: Challenges and Opportunities in Machine Learning," *Int. J. Artif. Intell. Educ.*, vol. 12, no. 1, pp. 88–102, 2023.
9. K. Banujan et al., "Deep Learning Approaches for Pedagogical Assessment: A Bidirectional LSTM Framework for Bloom's Taxonomy," in *Proc. IEEE Int. Conf. Adv. Learn. Technol. (ICALT)*, pp. 214–218, 2023.
10. P. M. O. N. Pallegama, K. A. M. R. Kumari, D. M. D. P. M. Dissanayaka, A. V. Y. Ravihansi, A. Karunasenna, U. Samarakoon, "Evaluating Teaching Content and Assessments based on Learning Outcomes," in *2020 2nd International Conference on Advancements in Computing (ICAC)*, Malabe, 2020.

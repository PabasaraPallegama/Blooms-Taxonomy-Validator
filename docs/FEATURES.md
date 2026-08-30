# Features — Automated Pedagogical Fairness Auditing System

A single source of truth for what the system does, what's actually built, and what's still
planned. Unlike `guide/*.md` (which narrates the academic proposal), this file tracks real
implementation status and gets updated as the system changes.

**Status legend**: ✅ Implemented &nbsp;|&nbsp; 🔧 Partially implemented &nbsp;|&nbsp; 📋 Planned

## 1. Document Ingestion

| Feature | Definition | Status | Where |
|---|---|---|---|
| PDF text extraction | Pull text out of an uploaded exam-paper PDF | ✅ | [backend/app/ingestion.py](../backend/app/ingestion.py) — `pypdf` text-layer extraction |
| Question splitting | Break the extracted text into individual numbered questions (`1.`, `Q1)`, etc.), falling back to line-splitting | ✅ | `ingestion.py::split_into_questions` |
| Scanned/image PDF support (OCR) | Extract text from scanned exam papers that have no text layer | 📋 | Needs Pytesseract + `pdf2image`, per [guide/05-implementation-guide.md](guide/05-implementation-guide.md) §5.3 |
| Syllabus document upload | Parse a module document (PPTX/DOCX/PDF/TXT) into topics, instead of manual entry | ✅ | [backend/app/extraction/document.py](../backend/app/extraction/document.py) — includes tables, which is where outcomes usually live |
| AI learning-outcome extraction | Read learning outcomes + their required Bloom's level out of a module document | ✅ | [backend/app/extraction/llm.py](../backend/app/extraction/llm.py) — Claude with a validated output schema; optional, needs `ANTHROPIC_API_KEY` |

## 2. Cognitive Classification (Bi-LSTM)

| Feature | Definition | Status | Where |
|---|---|---|---|
| Bloom's-level prediction | Classify a question into one of 6 Revised Bloom's Taxonomy levels | ✅ | [backend/app/model/classifier.py](../backend/app/model/classifier.py), trained model in `backend/models/` |
| Confidence score per prediction | Softmax probability of the winning class | ✅ (computed) / 🔧 (not exposed) | Computed in `classifier.py`, included in `QuestionResult.confidence`, but the full per-class `probabilities` dict is dropped before the API response |
| Pretrained embeddings (Word2Vec/GloVe) | Use pretrained 300-dim word vectors instead of training the embedding layer from scratch | 📋 | Current `train.py` trains a Keras `Embedding` layer from scratch on a 5000-word vocab |
| Validated real-world accuracy | Accuracy measured on non-templated, out-of-distribution questions | 📋 | Current test accuracy is 100% on 145 templated/synthetic rows — see caution note below |

## 3. Syllabus Knowledge Graph

| Feature | Definition | Status | Where |
|---|---|---|---|
| Topic graph (module → topics → required Bloom level) | In-memory structure holding each topic's required cognitive level (`Breq`) | ✅ | [backend/app/syllabus/graph.py](../backend/app/syllabus/graph.py) |
| Question → topic matching | Map each exam question to the syllabus topic it most likely tests | ✅ | [backend/app/syllabus/matcher.py](../backend/app/syllabus/matcher.py) — TF-IDF cosine similarity |
| Out-of-bounds detection | Flag a question that doesn't match any topic in the syllabus | ✅ | `matcher.py` (similarity below threshold) → `OUT_OF_BOUNDS` status in engine |
| Persistent syllabus storage | Save a module's topics and reload them for later audits | ✅ | SQLite via [backend/app/db/models.py](../backend/app/db/models.py) (`modules`, `topics`) |
| Neo4j-backed persistent graph | Swap the in-memory graph for a real Neo4j database | 📋 | SQLite covers storage today; Neo4j earns its place once `PRE_REQUISITE_OF` and multi-hop queries exist |
| Prerequisite relationships (`PRE_REQUISITE_OF`) | Model module-to-module prerequisite structure from the proposal | 📋 | Not used anywhere in the fairness calculation yet |

## 4. Fairness Auditing Engine

| Feature | Definition | Status | Where |
|---|---|---|---|
| Per-question alignment score | `1 - (|predicted - required| / 5)` — how close the predicted level is to what's required | ✅ | [backend/app/fairness/engine.py](../backend/app/fairness/engine.py) |
| Fairness Index | Mean alignment score across all questions, 0–100%, for the whole paper | ✅ | `engine.py::compute_fairness_index` |
| Warning threshold | Flags `MISALIGNED` when alignment score < 0.70 | ✅ | `engine.py::WARNING_THRESHOLD` |
| Cognitive distribution counts | Per-level counts of actual (predicted) vs. required questions — feeds the radar chart | ✅ | `engine.py::cognitive_distribution` |
| Explainable reason string | Plain-text justification for every warning (XAI requirement from the proposal) | ✅ | Returned as `reason` on every `QuestionResult` |

## 5. Backend API

| Feature | Definition | Status | Where |
|---|---|---|---|
| `POST /audit` | Run an audit from raw pasted exam text + topics JSON | ✅ | [backend/app/main.py](../backend/app/main.py) |
| `POST /audit/upload` | Run an audit from an uploaded PDF + topics JSON (multipart) | ✅ | `main.py` |
| `GET /health` | Liveness check, and whether AI extraction is configured | ✅ | `main.py` |
| `POST /syllabus/extract` | Upload a module document, get back topics for review (nothing saved) | ✅ | `main.py` — 503 with a clear message when no API key/credit |
| `POST/GET/DELETE /modules` | Save, list, load, and delete stored syllabi | ✅ | `main.py` |
| `GET /audits`, `GET /audits/{id}` | Audit history and re-opening a past audit | ✅ | `main.py` |
| Auth / multi-user | Restrict who can run audits or see results | 📋 | Open question — see [guide/08-frontend-plan.md](guide/08-frontend-plan.md) §8.7 |

## 6. Frontend Dashboard (React)

React + TypeScript + Vite, styled with Tailwind CSS v4 and shadcn/ui components, in `frontend/`.
Routing via React Router (`/` new audit, `/results`, `/about`); API calls via axios. Plan and API
contract in [guide/08-frontend-plan.md](guide/08-frontend-plan.md).

| Feature | Status | Where |
|---|---|---|
| Syllabus topic entry form | ✅ | `src/components/audit/SyllabusForm.tsx` |
| Exam paper upload/paste input | ✅ | `src/components/audit/ExamPaperInput.tsx` |
| Run Audit action + loading state | ✅ | `src/pages/NewAuditPage.tsx` |
| Fairness Scorecard (Fairness Index display) | ✅ | `src/components/results/FairnessScorecard.tsx` |
| Cognitive Distribution Radar Chart | ✅ | `src/components/results/CognitiveRadarChart.tsx` (Recharts; palette validated for light + dark) |
| Per-question results table with status badges | ✅ | `src/components/results/QuestionResultsTable.tsx` (+ "flagged only" filter) |
| Warning summary banner | ✅ | Flagged-count tile in `FairnessScorecard.tsx` |
| Error handling (toasts for backend failures) | ✅ | `sonner` toasts + axios interceptor in `src/api/auditClient.ts` |
| Dark/light theme toggle | ✅ | `src/components/layout/AppLayout.tsx` |
| Import syllabus from a document | ✅ | `src/components/audit/SyllabusImport.tsx` — upload, then review before saving |
| Inferred-level review flag | ✅ | `SyllabusForm.tsx` — topics whose level the model inferred are highlighted until confirmed |
| Saved/reusable syllabi | ✅ | `src/pages/ModulesPage.tsx` — load a stored module into a new audit |
| Audit history | ✅ | `src/pages/HistoryPage.tsx` — re-open any past audit's scorecard |
| *(later)* Export scorecard as PDF/PNG | 📋 | |
| *(later)* Side-by-side multi-paper comparison | 📋 | History lists past runs; comparing two at once isn't built |
| *(later)* Per-level confidence breakdown display | 📋 | Needs `probabilities` added back to `QuestionResult` |

## What "done" looks like for an MVP demo

The minimum to demonstrate the full pipeline end-to-end (matches the DSR "Demonstration" stage,
[guide/04-system-architecture.md](guide/04-system-architecture.md) §4.4):

1. ✅ Backend: ingest → classify → match → audit → fairness index.
2. ✅ Frontend: all must-have features in section 6, verified end-to-end against the running API.
3. 🔧 Classifier: needs re-validation on a non-templated dataset before the accuracy number can
   be trusted — see limitation below. **This is the one remaining MVP blocker.**

Everything else (Neo4j, OCR, pretrained embeddings, auth, history) is post-MVP.

## Known risk: classifier accuracy

`backend/models/config.json` reports `test_accuracy: 1.0` on 145 held-out rows drawn from the
same 722-row templated/synthetic dataset used for training (e.g. "Define X, Y, Z" → Remember,
"Analyze the situation in which..." → Analyze). This is very likely the model learning surface
template patterns rather than generalizing Bloom's-level cognitive intent — exactly the risk the
proposal itself calls out in [guide/07-ethics-limitations-timeline.md](guide/07-ethics-limitations-timeline.md)
§7.2.1. Treat the 100% figure as unproven until tested against independently-worded questions.

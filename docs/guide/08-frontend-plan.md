# 8. Frontend Plan (React Dashboard)

Yes — the backend already assumes a frontend exists. `backend/app/main.py` configures CORS for
`http://localhost:5173` (Vite's default dev port), but no `frontend/` folder exists yet in the
project. This doc specifies what to build.

## 8.1 Why a frontend is needed

The backend ([05-implementation-guide.md](05-implementation-guide.md)) only exposes a JSON API.
Nobody at the case-study department (NSBM SE dept., per [04-system-architecture.md](04-system-architecture.md))
can use raw `POST /audit` calls. The frontend is the actual "Fairness Scorecard" / "Cognitive
Distribution Radar Chart" deliverable described in the proposal (§4.4) — it's not optional polish,
it's the primary interface an educator interacts with.

## 8.2 Core user flow (MVP)

1. **Define the syllabus** — user enters (or uploads) the module's topics, each with a required
   Bloom's level (`Breq`, 1–6). This is a stand-in for the Neo4j Knowledge Graph until Module 3
   is wired up for real (see [04-system-architecture.md](04-system-architecture.md) §Module 3).
2. **Upload the exam paper** — a PDF (text-layer only for now; see limitation below) or pasted
   raw text.
3. **Run the audit** — calls the backend, gets back a `Fairness Index`, per-question breakdown,
   and cognitive distribution counts.
4. **Review results** — Fairness Scorecard, Radar Chart (actual vs. required Bloom's distribution),
   and a flagged-questions table (`MISALIGNED` / `OUT_OF_BOUNDS`).

## 8.3 Features

### Must-have (MVP)

| Feature | Backend support | Notes |
|---|---|---|
| Syllabus topic entry form (name, description, required Bloom's level) | `AuditRequest.topics` | Add/remove rows dynamically; required level as a 1–6 select or Bloom's-name dropdown |
| Exam paper input — paste text OR upload PDF | `POST /audit` (text) / `POST /audit/upload` (PDF, multipart) | Toggle between the two; upload uses `FormData` with `module_name`, `topics_json`, `exam_pdf` |
| Run Audit button + loading state | — | Bi-LSTM inference + TF-IDF matching can take a few seconds on first call (model load) |
| Fairness Index display | `AuditResponse.fairness_index` | Big number, 0–100%, color-coded (e.g. red < 70, amber 70–85, green > 85) |
| Cognitive Distribution Radar Chart | `AuditResponse.cognitive_distribution` (`{actual: int[6], required: int[6]}`) | Overlay two series on a 6-axis radar (Remember…Create) |
| Per-question results table | `AuditResponse.questions[]` | Columns: question text, predicted level, matched topic, required level, alignment score, status badge, reason (tooltip/expand) |
| Warning count / summary banner | `AuditResponse.warning_count`, `question_count` | e.g. "3 of 12 questions flagged" |
| Error handling | — | Backend errors (bad PDF, empty topics list, model not loaded) surfaced as toasts, not silent failures |

### Nice-to-have (post-MVP)

- Save/load a syllabus (topics list) as JSON so it doesn't need re-entering per audit.
- Export the scorecard as PDF/PNG for the "User Manual" / QA Cell handoff mentioned in
  [04-system-architecture.md](04-system-architecture.md) §4.5.
- Multi-paper comparison view (audit history across exam sittings for the same module).
- Confidence/probability breakdown per question (backend classifier already returns full
  `probabilities` dict per level — currently dropped by the API response; would need adding to
  `QuestionResult` if you want to surface it).
- Scanned-PDF/OCR upload path once Pytesseract is wired into `backend/app/ingestion.py`
  (currently text-layer PDFs only — see [05-implementation-guide.md](05-implementation-guide.md) §5.3).

## 8.4 Tech stack

- **React + Vite** (matches the CORS origin already set in `main.py`; fast dev loop).
- **Charting**: a library with a radar/spider chart primitive — e.g. `recharts` (`RadarChart`) or
  `chart.js` + `react-chartjs-2`. Recharts is the simpler pick for a single radar + no custom canvas work.
  Follow the `dataviz` skill's guidance for chart color/accessibility choices when styling it.
- **HTTP**: plain `fetch`; no need for a heavy data-fetching library at this scale (one form, one
  submit, one result view).
- **State**: local component state / `useState` is sufficient for MVP — no global store needed
  until multi-paper history (post-MVP) exists.

## 8.5 Suggested structure

```
frontend/
├── src/
│   ├── api/
│   │   └── auditClient.ts        # postAudit(text), postAuditUpload(formData) — wraps fetch to backend
│   ├── components/
│   │   ├── SyllabusForm.tsx      # topic rows: name, description, required level
│   │   ├── ExamPaperInput.tsx    # text/paste vs. PDF upload toggle
│   │   ├── FairnessScorecard.tsx # big Fairness Index number + warning banner
│   │   ├── CognitiveRadarChart.tsx
│   │   └── QuestionResultsTable.tsx
│   ├── types/
│   │   └── audit.ts              # mirrors backend/app/schemas.py (AuditRequest/AuditResponse)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

Keep `types/audit.ts` in sync with `backend/app/schemas.py` by hand for now — small enough
surface area that a shared codegen step isn't worth it yet.

## 8.6 API contract (current backend)

```
GET  /health                      -> { status: "ok" }

POST /audit                       (application/json)
     body: { module_name, topics: [{ id?, name, description?, required_bloom_level }], exam_paper_text }
     -> AuditResponse

POST /audit/upload                (multipart/form-data)
     fields: module_name, topics_json (stringified JSON array of TopicInput), exam_pdf (file)
     -> AuditResponse

AuditResponse = {
  module_name, fairness_index, question_count, warning_count,
  questions: [{ question, predicted_level, predicted_level_name, confidence,
                matched_topic, topic_match_similarity, required_level,
                alignment_score, status, warning, reason }],
  cognitive_distribution: { actual: number[6], required: number[6] }
}
```

Source of truth: [backend/app/schemas.py](../../backend/app/schemas.py) and
[backend/app/main.py](../../backend/app/main.py).

## 8.7 Open questions before building

- Should the syllabus form persist anywhere (localStorage for MVP, backend storage later), or is
  re-entering topics per session acceptable for the demo phase?
- Do we need auth/multi-user support for the case-study demo, or is a single shared instance fine
  (per [07-ethics-limitations-timeline.md](07-ethics-limitations-timeline.md), the demo is one
  department, one dataset)?
- PDF upload UX: drag-and-drop vs. plain file input — no strong requirement either way for MVP.

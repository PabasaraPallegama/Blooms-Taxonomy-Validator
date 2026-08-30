import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

load_dotenv()  # reads backend/.env so ANTHROPIC_API_KEY is picked up before any client is built

from app.db import get_db, init_db  # noqa: E402
from app.db import models  # noqa: E402
from app.extraction import (  # noqa: E402
    DocumentParseError,
    ExtractionUnavailable,
    extract_document_text,
    extract_syllabus,
)
from app.extraction.llm import is_configured as extraction_is_configured  # noqa: E402
from app.fairness.engine import (  # noqa: E402
    QuestionAudit,
    audit_question,
    cognitive_distribution,
    compute_fairness_index,
)
from app.ingestion import extract_text_from_pdf_bytes, split_into_questions  # noqa: E402
from app.model.classifier import get_classifier  # noqa: E402
from app.schemas import (  # noqa: E402
    AuditRequest,
    AuditResponse,
    AuditSummary,
    ExtractionResponse,
    ModuleDetail,
    ModuleSummary,
    SaveModuleRequest,
)
from app.syllabus.graph import SyllabusGraph  # noqa: E402
from app.syllabus.matcher import match_question_to_topic  # noqa: E402

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Automated Pedagogical Fairness Auditing System", lifespan=lifespan)

# Any localhost port — Vite picks 5174, 5175, ... whenever its default 5173 is already taken,
# so pinning a single port breaks the frontend as soon as a second dev server is running.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "ai_extraction_configured": extraction_is_configured()}


# --------------------------------------------------------------------------------------
# Audit
# --------------------------------------------------------------------------------------


def _run_audit(module_name: str, topics_payload: list[dict], exam_paper_text: str) -> dict:
    graph = SyllabusGraph.from_payload(module_name, topics_payload)
    questions = split_into_questions(exam_paper_text)
    classifier = get_classifier()

    question_audits = []
    for q in questions:
        prediction = classifier.predict(q)
        match = match_question_to_topic(q, graph)
        required_level = graph.required_level_for_topic(match["topic_id"]) if match["in_syllabus"] else None

        audit = QuestionAudit(
            question_text=q,
            predicted_level=prediction["level_number"],
            predicted_level_name=prediction["level_name"],
            confidence=prediction["confidence"],
            topic_id=match["topic_id"],
            topic_name=match.get("topic_name"),
            topic_similarity=match["similarity"],
            in_syllabus=match["in_syllabus"],
            required_level=required_level,
        )
        question_audits.append(audit_question(audit))

    fairness_index = compute_fairness_index(question_audits)
    warning_count = sum(1 for a in question_audits if a["warning"])
    required_levels = [t.required_bloom_level for t in graph.topics]

    return {
        "module_name": module_name,
        "fairness_index": fairness_index,
        "question_count": len(question_audits),
        "warning_count": warning_count,
        "questions": question_audits,
        "cognitive_distribution": cognitive_distribution(question_audits, required_levels),
    }


def _persist_audit(
    db: Session,
    result: dict,
    module_id: int | None,
    source_filename: str | None = None,
) -> int:
    audit_row = models.Audit(
        module_id=module_id,
        module_name=result["module_name"],
        fairness_index=result["fairness_index"],
        question_count=result["question_count"],
        warning_count=result["warning_count"],
        source_filename=source_filename,
        results=[
            models.QuestionResult(
                question=q["question"],
                predicted_level=q["predicted_level"],
                predicted_level_name=q["predicted_level_name"],
                confidence=q["confidence"],
                matched_topic=q.get("matched_topic"),
                required_level=q.get("required_level"),
                alignment_score=q["alignment_score"],
                status=q["status"],
                warning=q["warning"],
                reason=q["reason"],
            )
            for q in result["questions"]
        ],
    )
    db.add(audit_row)
    db.commit()
    return audit_row.id


@app.post("/audit", response_model=AuditResponse)
def audit(request: AuditRequest, db: Session = Depends(get_db)):
    topics_payload = [t.model_dump() for t in request.topics]
    result = _run_audit(request.module_name, topics_payload, request.exam_paper_text)
    result["audit_id"] = _persist_audit(db, result, request.module_id)
    return result


@app.post("/audit/upload", response_model=AuditResponse)
async def audit_upload(
    module_name: str = Form("Untitled Module"),
    topics_json: str = Form(...),
    exam_pdf: UploadFile = File(...),
    module_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    topics_payload = json.loads(topics_json)
    pdf_bytes = await exam_pdf.read()
    exam_text = extract_text_from_pdf_bytes(pdf_bytes)
    result = _run_audit(module_name, topics_payload, exam_text)
    result["audit_id"] = _persist_audit(db, result, module_id, exam_pdf.filename)
    return result


# --------------------------------------------------------------------------------------
# Syllabus extraction (AI-assisted)
# --------------------------------------------------------------------------------------


@app.post("/syllabus/extract", response_model=ExtractionResponse)
async def syllabus_extract(syllabus_doc: UploadFile = File(...)):
    """
    Reads a module document (PPTX/DOCX/PDF/TXT) and returns the topics it describes.

    Nothing is saved here on purpose — the result goes back to the UI for a human to
    review and correct before committing it via POST /modules.
    """
    data = await syllabus_doc.read()

    try:
        text = extract_document_text(syllabus_doc.filename or "upload", data)
    except DocumentParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        extracted = extract_syllabus(text)
    except ExtractionUnavailable as exc:
        # 503: the request was fine, the capability just isn't available right now.
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    topics = [t.model_dump() for t in extracted.topics]
    return {
        "module_name": extracted.module_name,
        "topics": topics,
        "source_filename": syllabus_doc.filename or "upload",
        "needs_review_count": sum(1 for t in topics if not t["level_stated_in_document"]),
    }


# --------------------------------------------------------------------------------------
# Saved modules
# --------------------------------------------------------------------------------------


@app.post("/modules", response_model=ModuleDetail, status_code=201)
def create_module(request: SaveModuleRequest, db: Session = Depends(get_db)):
    module = models.Module(
        name=request.name,
        source=request.source,
        source_filename=request.source_filename,
        topics=[
            models.Topic(
                name=t.name,
                description=t.description,
                required_bloom_level=t.required_bloom_level,
                outcome_text=t.outcome_text,
                level_stated_in_document=t.level_stated_in_document,
            )
            for t in request.topics
        ],
    )
    db.add(module)
    db.commit()
    return module


@app.get("/modules", response_model=list[ModuleSummary])
def list_modules(db: Session = Depends(get_db)):
    modules = db.scalars(select(models.Module).order_by(models.Module.id.desc())).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "source": m.source,
            "source_filename": m.source_filename,
            "created_at": m.created_at,
            "topic_count": len(m.topics),
        }
        for m in modules
    ]


@app.get("/modules/{module_id}", response_model=ModuleDetail)
def get_module(module_id: int, db: Session = Depends(get_db)):
    module = db.get(models.Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail=f"No module with id {module_id}")
    return module


@app.delete("/modules/{module_id}", status_code=204)
def delete_module(module_id: int, db: Session = Depends(get_db)):
    module = db.get(models.Module, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail=f"No module with id {module_id}")
    db.delete(module)
    db.commit()


# --------------------------------------------------------------------------------------
# Audit history
# --------------------------------------------------------------------------------------


@app.get("/audits", response_model=list[AuditSummary])
def list_audits(db: Session = Depends(get_db)):
    return db.scalars(select(models.Audit).order_by(models.Audit.id.desc())).all()


@app.get("/audits/{audit_id}", response_model=AuditResponse)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    row = db.get(models.Audit, audit_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"No audit with id {audit_id}")

    questions = [
        {
            "question": r.question,
            "predicted_level": r.predicted_level,
            "predicted_level_name": r.predicted_level_name,
            "confidence": r.confidence,
            "matched_topic": r.matched_topic,
            "required_level": r.required_level,
            "alignment_score": r.alignment_score,
            "status": r.status,
            "warning": r.warning,
            "reason": r.reason,
        }
        for r in row.results
    ]

    actual_counts = [0] * 6
    for q in questions:
        actual_counts[q["predicted_level"] - 1] += 1
    required_counts = [0] * 6
    if row.module is not None:
        for t in row.module.topics:
            required_counts[t.required_bloom_level - 1] += 1

    return {
        "module_name": row.module_name,
        "fairness_index": row.fairness_index,
        "question_count": row.question_count,
        "warning_count": row.warning_count,
        "questions": questions,
        "cognitive_distribution": {"actual": actual_counts, "required": required_counts},
        "audit_id": row.id,
    }

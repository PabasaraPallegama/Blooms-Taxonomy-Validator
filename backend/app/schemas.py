from datetime import datetime

from pydantic import BaseModel, Field


class TopicInput(BaseModel):
    id: str | None = None
    name: str
    description: str = ""
    required_bloom_level: int = Field(ge=1, le=6)


class AuditRequest(BaseModel):
    module_name: str = "Untitled Module"
    topics: list[TopicInput]
    exam_paper_text: str
    # When set, the audit is stored against this saved module so it shows in history.
    module_id: int | None = None


class QuestionResult(BaseModel):
    question: str
    predicted_level: int
    predicted_level_name: str
    confidence: float
    matched_topic: str | None
    topic_match_similarity: float | None = None
    required_level: int | None
    alignment_score: float
    status: str
    warning: bool
    reason: str


class AuditResponse(BaseModel):
    module_name: str
    fairness_index: float
    question_count: int
    warning_count: int
    questions: list[QuestionResult]
    cognitive_distribution: dict
    audit_id: int | None = None


# --- Syllabus extraction (AI-assisted) ---


class ExtractedTopicOut(BaseModel):
    name: str
    description: str
    outcome_text: str | None = None
    required_bloom_level: int
    level_stated_in_document: bool


class ExtractionResponse(BaseModel):
    module_name: str
    topics: list[ExtractedTopicOut]
    source_filename: str
    # Count of topics whose level was inferred rather than read from the document —
    # the UI uses this to prompt for human review before saving.
    needs_review_count: int


# --- Saved modules ---


class SaveModuleRequest(BaseModel):
    name: str
    topics: list[ExtractedTopicOut]
    source: str = "manual"
    source_filename: str | None = None


class TopicOut(BaseModel):
    id: int
    name: str
    description: str
    required_bloom_level: int
    outcome_text: str | None = None
    level_stated_in_document: bool

    model_config = {"from_attributes": True}


class ModuleSummary(BaseModel):
    id: int
    name: str
    source: str
    source_filename: str | None
    created_at: datetime
    topic_count: int


class ModuleDetail(BaseModel):
    id: int
    name: str
    source: str
    source_filename: str | None
    created_at: datetime
    topics: list[TopicOut]

    model_config = {"from_attributes": True}


# --- Audit history ---


class AuditSummary(BaseModel):
    id: int
    module_id: int | None
    module_name: str
    fairness_index: float
    question_count: int
    warning_count: int
    source_filename: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

"""Module 4: Fairness Auditing & Warning Engine — see docs/guide/05-implementation-guide.md section 5.6."""
from dataclasses import dataclass

WARNING_THRESHOLD = 0.70
MAX_BLOOM_LEVEL = 6


@dataclass
class QuestionAudit:
    question_text: str
    predicted_level: int
    predicted_level_name: str
    confidence: float
    topic_id: str | None
    topic_name: str | None
    topic_similarity: float
    in_syllabus: bool
    required_level: int | None


def compute_alignment_score(predicted: int, required: int) -> float:
    distance = abs(predicted - required)
    return max(0.0, 1.0 - (distance / (MAX_BLOOM_LEVEL - 1)))


def audit_question(audit: QuestionAudit) -> dict:
    if not audit.in_syllabus:
        return {
            "question": audit.question_text,
            "predicted_level": audit.predicted_level,
            "predicted_level_name": audit.predicted_level_name,
            "confidence": round(audit.confidence, 3),
            "matched_topic": None,
            "required_level": None,
            "alignment_score": 0.0,
            "status": "OUT_OF_BOUNDS",
            "warning": True,
            "reason": "This question doesn't match any topic in the provided syllabus.",
        }

    score = compute_alignment_score(audit.predicted_level, audit.required_level)
    warning = score < WARNING_THRESHOLD
    return {
        "question": audit.question_text,
        "predicted_level": audit.predicted_level,
        "predicted_level_name": audit.predicted_level_name,
        "confidence": round(audit.confidence, 3),
        "matched_topic": audit.topic_name,
        "topic_match_similarity": audit.topic_similarity,
        "required_level": audit.required_level,
        "alignment_score": round(score, 3),
        "status": "ALIGNED" if not warning else "MISALIGNED",
        "warning": warning,
        "reason": (
            f"Predicted Bloom's level {audit.predicted_level} ({audit.predicted_level_name}) is below/above "
            f"the syllabus-required level {audit.required_level} for '{audit.topic_name}'."
            if warning
            else "Within acceptable alignment with the syllabus requirement."
        ),
    }


def compute_fairness_index(question_audits: list[dict]) -> float:
    if not question_audits:
        return 0.0
    return round(sum(a["alignment_score"] for a in question_audits) / len(question_audits) * 100, 2)


def cognitive_distribution(question_audits: list[dict], syllabus_required_levels: list[int]) -> dict:
    """Counts per Bloom's level for both the actual exam and the syllabus's intended distribution — feeds the radar chart."""
    actual_counts = [0] * MAX_BLOOM_LEVEL
    for a in question_audits:
        actual_counts[a["predicted_level"] - 1] += 1

    required_counts = [0] * MAX_BLOOM_LEVEL
    for lvl in syllabus_required_levels:
        required_counts[lvl - 1] += 1

    return {"actual": actual_counts, "required": required_counts}

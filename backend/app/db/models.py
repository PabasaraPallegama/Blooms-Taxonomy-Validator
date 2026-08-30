"""
ORM models.

Two independent trees:
  Module -> Topic                       the syllabus (reusable across audits)
  Audit  -> QuestionResult              one audit run and its per-question findings

An Audit references the Module it was run against, but keeps its own copy of each
question's required_level. That denormalisation is deliberate: a syllabus can be
edited after an audit, and a stored audit must stay a faithful record of what was
compared at the time, not silently change meaning when a topic's level is updated.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(255))
    # "manual" | "extracted" — lets the UI show how a syllabus was created.
    source: Mapped[str] = mapped_column(String(32), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    topics: Mapped[list["Topic"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Topic.id",
    )
    audits: Mapped[list["Audit"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Audit.id.desc()",
    )


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    required_bloom_level: Mapped[int] = mapped_column(Integer, nullable=False)  # Breq, 1-6

    # The learning-outcome sentence this topic came from, when extracted from a document.
    outcome_text: Mapped[str | None] = mapped_column(Text)
    # False when the model inferred the level from the outcome's verb rather than reading
    # an explicitly stated one. Drives the "needs review" flag in the UI — see
    # docs/guide/07-ethics-limitations-timeline.md 7.1.3 (human-in-the-loop).
    level_stated_in_document: Mapped[bool] = mapped_column(default=True)

    module: Mapped[Module] = relationship(back_populates="topics")


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int | None] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))
    module_name: Mapped[str] = mapped_column(String(255), nullable=False)
    fairness_index: Mapped[float] = mapped_column(Float, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    warning_count: Mapped[int] = mapped_column(Integer, nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    module: Mapped[Module | None] = relationship(back_populates="audits")
    results: Mapped[list["QuestionResult"]] = relationship(
        back_populates="audit",
        cascade="all, delete-orphan",
        order_by="QuestionResult.id",
    )


class QuestionResult(Base):
    __tablename__ = "question_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    audit_id: Mapped[int] = mapped_column(ForeignKey("audits.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    predicted_level: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_level_name: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    matched_topic: Mapped[str | None] = mapped_column(String(255))
    required_level: Mapped[int | None] = mapped_column(Integer)
    alignment_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    warning: Mapped[bool] = mapped_column(default=False)
    reason: Mapped[str] = mapped_column(Text, default="")

    audit: Mapped[Audit] = relationship(back_populates="results")

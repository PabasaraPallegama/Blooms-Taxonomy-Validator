"""
SQLite persistence layer.

Deliberately SQLite rather than the proposal's Neo4j: the syllabus data the app
actually stores today is a flat module -> topics tree, which relational tables model
fine. Neo4j earns its place when the graph gains the PRE_REQUISITE_OF edges and
multi-hop queries described in docs/guide/04-system-architecture.md (Module 3) —
until then it would be infrastructure without a query to justify it.
"""
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BACKEND_DIR / "resera.db"

# check_same_thread=False: FastAPI serves requests from a threadpool, and each request
# gets its own Session anyway, so SQLite's default single-thread guard is too strict.
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates tables on first run. Import models first so they're registered on Base."""
    from app.db import models  # noqa: F401  (registers mappers as a side effect)

    Base.metadata.create_all(bind=engine)

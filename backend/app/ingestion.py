"""
Module 1 (simplified for MVP): splits raw exam paper text into individual questions,
and extracts text from an uploaded PDF's text layer.

Note: this uses pypdf's text-layer extraction, which works for typed/exported PDFs.
It does NOT do OCR on scanned images — see docs/guide/05-implementation-guide.md
section 5.3 for the Pytesseract-based OCR path to add for scanned exam papers.
"""
import io
import re

from pypdf import PdfReader

# Question markers, most explicit first. Real papers write these many ways:
#   "Question 01.", "Question 2:", "Q3)", "4.", "(5)"
_QUESTION_MARKER = re.compile(
    r"""(?:^|\n)[ \t]*
    (?:
        (?:question|q)[ \t]*\.?[ \t]*\d{1,2}[ \t]*[.:)\-]?   # Question 01. / Q3)
      | \(\d{1,2}\)                                          # (5)
      | \d{1,2}[.)]                                          # 4.  4)
    )
    [ \t]+""",
    re.IGNORECASE | re.VERBOSE,
)

# A PDF table flattens into short fragments — "F002", "60192,", "Adams Database,".
# Anything with at least this many prose-like words is treated as real question text.
_MIN_PROSE_WORDS = 4


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _prose_word_count(line: str) -> int:
    """Counts tokens that look like ordinary words rather than codes or figures.

    'Adams Database,' scores 2; 'Put the below table in third normalized form.' scores 7.
    A token needs 3+ characters, a lowercase letter, and no digits to count — which is
    what separates prose from column headers (SID, FID) and cell values (IS318, 60192).
    """
    return sum(
        1
        for token in line.split()
        if len(token) >= 3 and any(c.islower() for c in token) and not any(c.isdigit() for c in token)
    )


def _clean_block(block: str) -> str:
    """Collapses a question block to one line, dropping flattened table rows."""
    kept = [line.strip() for line in block.splitlines() if _prose_word_count(line) >= _MIN_PROSE_WORDS]
    return re.sub(r"\s+", " ", " ".join(kept)).strip()


def split_into_questions(raw_text: str) -> list[str]:
    """Splits an exam paper into questions.

    Marker-driven: everything from one question marker up to the next is a single
    question, so a question that wraps over several lines stays intact and any table
    embedded in it is dropped rather than becoming questions of its own.
    """
    text = raw_text.strip()
    if not text:
        return []

    marks = list(_QUESTION_MARKER.finditer(text))
    if marks:
        blocks = [
            text[m.end() : (marks[i + 1].start() if i + 1 < len(marks) else len(text))]
            for i, m in enumerate(marks)
        ]
    else:
        # No markers at all — fall back to blank-line-separated paragraphs.
        # Never split per line here: on a paper containing tables that turns every
        # cell into a "question" and floods the audit with meaningless entries.
        blocks = re.split(r"\n\s*\n", text)

    questions = [cleaned for b in blocks if (cleaned := _clean_block(b))]

    # Last resort: a paper whose questions are one short line each ("Define X.") has no
    # markers and no blank lines, so nothing survives the prose filter. Keep whole lines.
    if not questions:
        questions = [
            line.strip()
            for line in text.splitlines()
            if _prose_word_count(line) >= _MIN_PROSE_WORDS
        ]

    return questions

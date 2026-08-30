"""
Extracts syllabus topics and their required Bloom's level from module-document text.

Scope note — this matters for the project's research claim. The system deals with two
different Bloom's levels:

  Bpred  the level an *exam question* tests      -> predicted by the Bi-LSTM (app/model/)
  Breq   the level the *syllabus* requires       -> ground truth, stated in the syllabus

This module only ever produces **Breq**, by reading what a module document already says.
It is data entry that would otherwise be typed by hand, not a cognitive-classification
model, and it must never be used to produce Bpred — that is the Bi-LSTM's job and the
project's actual research contribution (docs/guide/01-project-overview.md 1.3.2).

Where a document states a level outright ("LO3 (Analyze)"), we transcribe it. Where it
doesn't, the level is inferred from the outcome's verb and flagged
`level_stated_in_document=False` so the UI can ask a human to confirm it, per the
human-in-the-loop requirement in docs/guide/07-ethics-limitations-timeline.md 7.1.3.
"""
import os

from pydantic import BaseModel, Field

MODEL = "claude-opus-5"
MAX_TOKENS = 16000

SYSTEM_PROMPT = """You extract syllabus structure from university module documents \
(module descriptors, lecture decks, course handbooks).

Identify the topics the module teaches, and for each one the Revised Bloom's Taxonomy \
level the syllabus requires students to reach:

1 Remember  2 Understand  3 Apply  4 Analyze  5 Evaluate  6 Create

Rules:
- Extract topics that are actually taught or assessed. Ignore administrative content \
(assessment weightings, attendance policy, reading lists, staff contact details, timetables).
- Prefer the document's own wording for topic names and outcome text. Do not invent topics \
that aren't there.
- If the document states a level explicitly (e.g. "LO2 (Analyze)", "at the Evaluate level"), \
transcribe that level and set level_stated_in_document to true.
- If no level is stated, infer it from the outcome's main verb and set \
level_stated_in_document to false.
- `description` should be a handful of keywords/terms belonging to the topic. These are \
matched against exam questions later, so favour distinctive subject terms over generic words.
- If the document contains no identifiable learning outcomes or topics, return an empty \
topics list rather than guessing."""


class ExtractionUnavailable(Exception):
    """Raised when AI extraction can't run — typically no API key configured."""


class ExtractedTopic(BaseModel):
    name: str = Field(description="Short topic name, e.g. 'Normalization'")
    description: str = Field(description="Distinctive keywords and terms for this topic")
    outcome_text: str = Field(description="The learning-outcome sentence this came from, verbatim")
    required_bloom_level: int = Field(ge=1, le=6, description="Breq: 1-6")
    level_stated_in_document: bool = Field(
        description="True if the document stated the level; False if inferred from the verb"
    )


class ExtractedSyllabus(BaseModel):
    module_name: str = Field(description="The module/course name as written in the document")
    topics: list[ExtractedTopic]


def is_configured() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def extract_syllabus(document_text: str) -> ExtractedSyllabus:
    """Sends document text to Claude and returns validated syllabus structure."""
    if not is_configured():
        raise ExtractionUnavailable(
            "AI extraction needs an ANTHROPIC_API_KEY. Add one to backend/.env "
            "(get a key at console.anthropic.com), or enter topics manually instead."
        )

    try:
        import anthropic
    except ImportError as exc:  # pragma: no cover - dependency is in requirements.txt
        raise ExtractionUnavailable("The 'anthropic' package isn't installed.") from exc

    client = anthropic.Anthropic()

    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Extract the topics and required Bloom's levels from this module "
                        f"document:\n\n{document_text}"
                    ),
                }
            ],
            output_format=ExtractedSyllabus,
        )
    except anthropic.AuthenticationError as exc:
        raise ExtractionUnavailable("The configured ANTHROPIC_API_KEY was rejected.") from exc
    except anthropic.RateLimitError as exc:
        raise ExtractionUnavailable("Rate limited by the Anthropic API — try again shortly.") from exc
    except anthropic.APIConnectionError as exc:
        raise ExtractionUnavailable("Couldn't reach the Anthropic API — check the connection.") from exc
    except anthropic.BadRequestError as exc:
        # The commonest 400 here by far is an empty credit balance, and the raw API
        # message doesn't say where to fix it — so translate it into something actionable.
        if "credit balance" in str(exc).lower():
            raise ExtractionUnavailable(
                "The Anthropic account has no API credit. Add credit at "
                "console.anthropic.com -> Plans & Billing, then try again. "
                "(Manual topic entry works without this.)"
            ) from exc
        raise ExtractionUnavailable(f"Anthropic API rejected the request: {exc.message}") from exc
    except anthropic.APIStatusError as exc:
        raise ExtractionUnavailable(f"Anthropic API error ({exc.status_code}): {exc.message}") from exc

    if response.stop_reason == "refusal":
        raise ExtractionUnavailable("The request was declined by the model's safety system.")

    return response.parsed_output

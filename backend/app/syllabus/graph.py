"""
In-memory Syllabus Knowledge Graph.

Mirrors the Neo4j node/edge shape described in docs/guide/04-system-architecture.md
and docs/guide/05-implementation-guide.md (Module 3):
    Module -[:HAS_OUTCOME]-> LearningOutcome -[:TESTS_OUTCOME]-> Topic

This lets the rest of the system (topic matching + fairness engine) work against
a simple Python object today. Swapping in real Neo4j later only means replacing
this module's internals — SyllabusGraph's public methods (topics(), required_level_for_topic(),
has_topic()) stay the same, so nothing else in the app needs to change.
"""
from dataclasses import dataclass, field


@dataclass
class Topic:
    id: str
    name: str
    description: str
    required_bloom_level: int  # Breq, 1-6


@dataclass
class SyllabusGraph:
    module_name: str
    topics: list[Topic] = field(default_factory=list)

    def has_topic(self, topic_id: str) -> bool:
        return any(t.id == topic_id for t in self.topics)

    def get_topic(self, topic_id: str) -> Topic | None:
        return next((t for t in self.topics if t.id == topic_id), None)

    def required_level_for_topic(self, topic_id: str) -> int | None:
        topic = self.get_topic(topic_id)
        return topic.required_bloom_level if topic else None

    @classmethod
    def from_payload(cls, module_name: str, topics_payload: list[dict]) -> "SyllabusGraph":
        topics = [
            Topic(
                id=t.get("id") or f"topic-{i}",
                name=t["name"],
                description=t.get("description", t["name"]),
                required_bloom_level=int(t["required_bloom_level"]),
            )
            for i, t in enumerate(topics_payload)
        ]
        return cls(module_name=module_name, topics=topics)

"""
Maps an exam question to the syllabus Topic it most likely tests, using TF-IDF
cosine similarity between the question text and each topic's name+description.

This is the "topic-tagging step" flagged as an open extension point in
docs/guide/05-implementation-guide.md section 5.7.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.syllabus.graph import SyllabusGraph

OUT_OF_BOUNDS_THRESHOLD = 0.05  # below this similarity, treat the question as not covered by the syllabus


def match_question_to_topic(question: str, graph: SyllabusGraph) -> dict:
    if not graph.topics:
        return {"topic_id": None, "similarity": 0.0, "in_syllabus": False}

    # Repeat each topic's name to weight it more heavily than the (often longer,
    # more generic) description in the TF-IDF vector — short syllabus corpora
    # otherwise make description-word overlap swamp the topic-name signal.
    topic_docs = [f"{t.name} {t.name} {t.description}" for t in graph.topics]
    corpus = topic_docs + [question]

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    tfidf = vectorizer.fit_transform(corpus)

    question_vec = tfidf[-1]
    topic_vecs = tfidf[:-1]
    similarities = cosine_similarity(question_vec, topic_vecs)[0]

    best_idx = int(similarities.argmax())
    best_score = float(similarities[best_idx])
    best_topic = graph.topics[best_idx]

    in_syllabus = best_score >= OUT_OF_BOUNDS_THRESHOLD
    return {
        "topic_id": best_topic.id if in_syllabus else None,
        "topic_name": best_topic.name if in_syllabus else None,
        "similarity": round(best_score, 3),
        "in_syllabus": in_syllabus,
    }

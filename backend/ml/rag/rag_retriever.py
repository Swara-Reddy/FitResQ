"""
FitResQ AI — Simple Policy RAG Retriever
Loads FitResQ refund/return policy, chunks into meaningful policy sections,
builds a TF-IDF vector index, and retrieves top-k relevant chunks using cosine similarity.
"""

import os
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def find_policy_path() -> str:
    """Finds the path to refund-policy.txt in candidate project locations."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(current_dir, "..", "..", "..", "refund-policy.txt")),
        os.path.abspath(os.path.join(current_dir, "..", "data", "refund-policy.txt")),
        os.path.abspath("refund-policy.txt"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"refund-policy.txt not found in candidate paths: {candidates}")


class PolicyRAGRetriever:
    """
    TF-IDF based RAG retriever for FitResQ customer support policies.
    """

    def __init__(self, policy_path: str = None, threshold: float = 0.15):
        self.policy_path = policy_path or find_policy_path()
        self.threshold = threshold
        self.chunks = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self._load_and_index()

    def _load_and_index(self):
        with open(self.policy_path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        # Split policy into meaningful chunks by double newlines
        sections = raw_text.split("\n\n")
        self.chunks = []
        for s in sections:
            s_clean = s.strip()
            # Exclude top document title header
            if s_clean and not s_clean.startswith("FITRESQ REFUND"):
                self.chunks.append(s_clean)

        # Build TF-IDF representation (unigrams + bigrams, English stop words)
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(self.chunks)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most relevant chunks for a given query.
        Filters out chunks below similarity threshold.
        """
        if not query or not query.strip():
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        ranked_indices = similarities.argsort()[::-1]

        results = []
        for idx in ranked_indices[:top_k]:
            score = float(similarities[idx])
            if score >= self.threshold:
                results.append({
                    "text": self.chunks[idx],
                    "score": round(score, 4)
                })

        return results


# Global singleton retriever instance for easy module-level usage
_default_retriever = None


def get_default_retriever() -> PolicyRAGRetriever:
    global _default_retriever
    if _default_retriever is None:
        _default_retriever = PolicyRAGRetriever()
    return _default_retriever


def retrieve(query: str, top_k: int = 3, threshold: float = 0.15) -> List[Dict[str, Any]]:
    """
    Convenience function matching the prompt requirement:
    retrieve(query, top_k=3) -> [{"text": "...", "score": 0.XX}]
    """
    retriever = get_default_retriever()
    if threshold != retriever.threshold:
        retriever.threshold = threshold
    return retriever.retrieve(query, top_k=top_k)

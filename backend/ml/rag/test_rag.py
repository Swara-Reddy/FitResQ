"""
FitResQ AI — RAG System Test Script
Runs the 5 required policy questions and 1 unrelated question,
verifying accurate retrieval and threshold rejection.
"""

from rag_retriever import retrieve, get_default_retriever


def run_tests():
    retriever = get_default_retriever()

    print("==================================================")
    print("FitResQ AI — Simple RAG System Verification")
    print("==================================================")
    print(f"Policy file used:           {retriever.policy_path}")
    print(f"Total policy chunks:        {len(retriever.chunks)}")
    print(f"Retrieval / Index method:   TF-IDF (1-2 ngrams, English stop words)")
    print(f"Similarity method:          Cosine Similarity")
    print(f"Similarity threshold:       {retriever.threshold}")
    print("==================================================\n")

    test_questions = [
        "How long does a refund take?",
        "Can I get a refund for a damaged product?",
        "What should I do if my refund is delayed?",
        "Can I return an item after delivery?",
        "What happens if my refund fails?",
        "What is the weather today?",  # Unrelated question
    ]

    for q in test_questions:
        print(f"Question: {q}")
        results = retrieve(q, top_k=3)

        if not results:
            print("No relevant policy information found.\n")
        else:
            print("Top retrieved policy chunks:")
            for r in results:
                print(f"- Chunk text: {r['text']}")
                print(f"- Similarity score: {r['score']:.4f}")
            print()

        print("--------------------------------------------------\n")


if __name__ == "__main__":
    run_tests()

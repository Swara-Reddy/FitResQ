"""
FitResQ ML — Customer Priority Classifier Prediction Script
Loads the trained TF-IDF + Logistic Regression model and predicts urgency priority
(LOW, MEDIUM, HIGH) for incoming customer complaint texts.
"""

import os
import joblib

# Resolve model path relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "models", "priority_classifier.joblib")

# Load trained pipeline (TF-IDF + Logistic Regression)
model = joblib.load(model_path)


def predict_priority(text: str) -> str:
    """
    Predicts the priority level for a given customer complaint string.

    Parameters:
        text (str): Customer inquiry or complaint text.

    Returns:
        str: Predicted priority ('LOW', 'MEDIUM', or 'HIGH').
    """
    prediction = model.predict([text])[0]
    return str(prediction)


if __name__ == "__main__":
    test_cases = [
        "I just have a question about my return",
        "My refund has been delayed for several days",
        "I urgently need my money back, this is causing a serious problem",
        "I want to know the status of my replacement",
        "I have contacted support multiple times and nobody has resolved my refund",
    ]

    print("==================================================")
    print("FitResQ ML — Priority Prediction Verification")
    print("==================================================")

    for text in test_cases:
        pred = predict_priority(text)
        print(f"Input:      {text}")
        print(f"Prediction: {pred}\n")

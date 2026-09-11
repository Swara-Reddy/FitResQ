"""
FitResQ ML — Customer Sentiment Classifier Prediction Script
Loads the trained TF-IDF + Logistic Regression model and predicts sentiment
(POSITIVE, NEUTRAL, NEGATIVE) for incoming customer complaint texts.
"""

import os
import joblib

# Resolve model path relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "models", "sentiment_classifier.joblib")

# Load trained pipeline (TF-IDF + Logistic Regression)
model = joblib.load(model_path)


def predict_sentiment(text: str) -> str:
    """
    Predicts the sentiment class for a given customer complaint string.

    Parameters:
        text (str): Customer inquiry or complaint text.

    Returns:
        str: Predicted sentiment ('POSITIVE', 'NEUTRAL', or 'NEGATIVE').
    """
    prediction = model.predict([text])[0]
    return str(prediction)


if __name__ == "__main__":
    test_cases = [
        "I am really happy with how quickly my refund was processed",
        "My refund is currently being processed",
        "This is terrible, I have been waiting for my refund for weeks",
        "The replacement arrived and it is perfect",
        "I am extremely frustrated with this service",
    ]

    print("==================================================")
    print("FitResQ ML — Sentiment Prediction Verification")
    print("==================================================")

    for text in test_cases:
        pred = predict_sentiment(text)
        print(f"Input:      {text}")
        print(f"Prediction: {pred}\n")

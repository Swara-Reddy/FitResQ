"""
FitResQ ML — Customer Intent Classifier Prediction Script
Loads the trained TF-IDF + Logistic Regression model and predicts intent
for incoming customer complaint texts.
"""

import os
import joblib

# Resolve model path relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "models", "intent_classifier.joblib")

# Load trained pipeline (TF-IDF + Logistic Regression)
model = joblib.load(model_path)


def predict_intent(text: str) -> str:
    """
    Predicts the support intent class for a given customer complaint string.

    Parameters:
        text (str): Customer inquiry or complaint text.

    Returns:
        str: Predicted intent class name.
    """
    prediction = model.predict([text])[0]
    return str(prediction)


if __name__ == "__main__":
    test_cases = [
        "My refund has not arrived yet",
        "I received the wrong product",
        "The shirt I received is damaged",
        "I want to return my order",
        "My payment failed",
    ]

    print("==================================================")
    print("FitResQ ML — Intent Prediction Verification")
    print("==================================================")

    for text in test_cases:
        pred = predict_intent(text)
        print(f"Input: {text}")
        print(f"Prediction: {pred}\n")

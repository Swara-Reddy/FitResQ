"""
FitResQ ML — Customer Intent Classifier Training Script
Uses TF-IDF Vectorizer + Logistic Regression to classify customer complaints
into one of 8 support categories.
"""

import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report


def main():
    # 1. Resolve file paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "data", "complaints.csv")
    model_dir = os.path.join(script_dir, "models")
    model_path = os.path.join(model_dir, "intent_classifier.joblib")

    os.makedirs(model_dir, exist_ok=True)

    print("==================================================")
    print("FitResQ ML — Intent Classifier Training")
    print("==================================================")
    print(f"Loading dataset from: {data_path}")

    # 2. Load dataset
    df = pd.read_csv(data_path)
    print(f"Dataset loaded successfully: {len(df)} rows across {df['intent'].nunique()} classes.\n")

    X = df["text"]
    y = df["intent"]

    # 3. Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples:  {len(X_test)}\n")

    # 4. Build Pipeline: TF-IDF Vectorizer + Logistic Regression
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
        ("clf", LogisticRegression(random_state=42, max_iter=1000, C=1.0))
    ])

    print("Training TF-IDF + Logistic Regression model...")
    pipeline.fit(X_train, y_train)
    print("Model training complete!\n")

    # 5. Evaluate on test set
    print("==================================================")
    print("Model Evaluation on Test Set")
    print("==================================================")
    y_pred = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision_w = precision_score(y_test, y_pred, average="weighted")
    recall_w = recall_score(y_test, y_pred, average="weighted")
    f1_w = f1_score(y_test, y_pred, average="weighted")
    f1_macro = f1_score(y_test, y_pred, average="macro")

    print(f"Accuracy:  {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Weighted F1 score: {f1_w:.4f} ({f1_w * 100:.2f}%)")
    print(f"Macro F1 score:    {f1_macro:.4f} ({f1_macro * 100:.2f}%)\n")

    print("Classification Report:")
    print("--------------------------------------------------")
    print(classification_report(y_test, y_pred))

    # 6. Save complete pipeline
    print(f"Saving trained pipeline to: {model_path}")
    joblib.dump(pipeline, model_path)
    print("Model successfully saved!")
    print("==================================================")


if __name__ == "__main__":
    main()

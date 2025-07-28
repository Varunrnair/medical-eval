import os
import json
from pathlib import Path
from typing import List
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()



INPUT_CSV = "/Users/vrn/Work/medical_eval/backend/data/sample_15.csv"
OUTPUT_CSV = None
THEMES: List[str] = [
    "symptom interpretation and triage",
    "preventive care and screening",
    "lifestyle and diet advice",
    "clinical procedures and interventions",
    "risk and complication explanation",
    "factual recall and definition",
    "medication guidance",
    "numerical reasoning and calculations",
    "reproductive and sexual health",
    "chronic condition management",
]


def classify_themes(
    csv_path: str,
    api_key_env: str = "OPENAI_API_KEY",
    model: str = "gpt-3.5-turbo",
    output_path: str = None,
    max_retries: int = 5
) -> None:
    """
    Reads a CSV containing a 'Questions' column, classifies each question
    into one of the predefined THEMES via OpenAI. Validates that each
    classification matches a theme, retrying up to max_retries per question.
    Writes a 'Theme' column back to the same file or to output_path.
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(path)
    if "Questions" not in df.columns:
        raise ValueError("Input CSV must contain a 'Questions' column")

    client = OpenAI(api_key=os.getenv(api_key_env))
    theme_list_str = "\n".join(f"- {t}" for t in THEMES)


    def classify(question: str) -> str:
        """Call LLM until a valid theme is returned or raise RuntimeError."""
        prompt = (
            f"Classify this medical question into one theme:\n"
            f"{theme_list_str}\n\nQuestion:\n\"\"\"{question}\"\"\"\n"
            "Return only the exact theme name."
        )
        for attempt in range(max_retries):
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=50,
                )
                theme = resp.choices[0].message.content.strip()
                if theme in THEMES:
                    return theme
            except Exception:
                pass
        raise RuntimeError(f"Failed to classify question after {max_retries} attempts: '{question}'")

    df["Theme"] = df["Questions"].fillna("").apply(classify)

    save_path = Path(output_path or csv_path)
    df.to_csv(save_path, index=False)
    print(f"Themes successfully updated in: {save_path}")


if __name__ == "__main__":
    classify_themes(INPUT_CSV, output_path=OUTPUT_CSV)
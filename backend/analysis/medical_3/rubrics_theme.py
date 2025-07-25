import os
import json
from pathlib import Path
from typing import List, Dict
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()



class ThemeRubricGenerator:
    """
    Classifies questions into predefined clinical themes,
    generates a fixed rubric bank per theme,
    and classifies those rubrics into five axes per theme.
    All outputs are saved into the same output folder.
    """
    AXES = [
        "Accuracy",
        "Completeness",
        "Context Awareness",
        "Communication",
        "Terminology Accessibility"
    ]


    def __init__(self, dataset_path: str, themes: List[str], output_folder: str):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.dataset_path = Path(dataset_path)
        self.themes = themes
        self.output_folder = Path(output_folder)

        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")

        self.df = pd.read_csv(self.dataset_path)
        if "Questions" not in self.df.columns:
            raise ValueError("Dataset must contain a 'Questions' column")

        self.output_folder.mkdir(parents=True, exist_ok=True)


    def _call_llm(self, prompt: str, max_tokens: int = 600, temperature: float = 0.1) -> str:
        for _ in range(3):
            try:
                resp = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return resp.choices[0].message.content
            except Exception:
                continue
        raise RuntimeError("LLM call failed after 3 attempts")


    def _classify_questions(self) -> pd.Series:
        theme_list = "\n".join(f"- {t}" for t in self.themes)
        assignments = []
        for question in self.df["Questions"]:
            prompt = (
                f"Classify this medical question into one of the themes below:\n"
                f"{theme_list}\n\n"
                f"Question:\n\"\"\"{question}\"\"\"\n\n"
                "Return ONLY the exact theme name."
            )
            resp = self._call_llm(prompt, max_tokens=50, temperature=0.0).strip()
            assignments.append(resp if resp in self.themes else "unclassified")
        return pd.Series(assignments, index=self.df.index)


    def _generate_rubrics(self, theme: str, count: int = 20) -> List[str]:
        prompt = (
            f"You are curating a rubric bank for clinical questions in the theme: \"{theme}\".\n\n"
            f"Generate {count} distinct, actionable evaluation criteria that any question under "
            f"this theme should satisfy. Return ONLY a JSON array of strings."
        )
        resp = self._call_llm(prompt, max_tokens=800)
        start, end = resp.find("["), resp.rfind("]") + 1
        return json.loads(resp[start:end]) if 0 <= start < end else []


    def _classify_rubrics_to_axes(self, theme: str, rubrics: List[str]) -> Dict[str, List[str]]:
        axes_desc = "\n".join(f"- {ax}" for ax in self.AXES)
        rubrics_json = json.dumps(rubrics, ensure_ascii=False, indent=2)
        prompt = (
            f"You are classifying evaluation rubrics for clinical questions under the theme: \"{theme}\".\n\n"
            f"Available axes:\n{axes_desc}\n\n"
            f"Rubrics to classify:\n{rubrics_json}\n\n"
            "Return ONLY a JSON object with keys "
            f"{json.dumps(self.AXES)} and an \"unclassified\" key with an empty list if none.\n\n"
            "Example:\n"
            "{{\n"
            "  \"Accuracy\": [\"rubric1\", ...],\n"
            "  \"Completeness\": [...],\n"
            "  ...,\n"
            "  \"unclassified\": []\n"
            "}}\n\n"
            "JSON Response:"
        )
        resp = self._call_llm(prompt, max_tokens=1000, temperature=0.1)
        start, end = resp.find("{"), resp.rfind("}") + 1
        classification = json.loads(resp[start:end]) if 0 <= start < end else {}
        # ensure all axes present
        for ax in self.AXES:
            classification.setdefault(ax, [])
        classification.setdefault("unclassified", [])
        # move any missing rubric into unclassified
        assigned = sum((classification[ax] for ax in self.AXES), []) + classification["unclassified"]
        for r in rubrics:
            if r not in assigned:
                classification["unclassified"].append(r)
        return classification


    def run(self) -> None:
        # Step 1: classify and save themed dataset
        print("Step 1: Classifying questions into themes")
        self.df["Theme"] = self._classify_questions()
        themed_csv = self.output_folder / f"{self.dataset_path.stem}_themed.csv"
        self.df.to_csv(themed_csv, index=False)
        print(f"  → Themed questions saved to: {themed_csv}")

        # Step 2: generate and save rubric bank
        print("Step 2: Generating rubric bank per theme")
        rubric_rows: List[Dict[str, str]] = []
        for theme in self.themes:
            print(f"  • Generating rubrics for: {theme}")
            rubs = self._generate_rubrics(theme)
            rubric_rows.append({
                "Theme": theme,
                "Rubrics": json.dumps(rubs, ensure_ascii=False)
            })
        rubric_csv = self.output_folder / "theme_rubric_bank.csv"
        pd.DataFrame(rubric_rows).to_csv(rubric_csv, index=False)
        print(f"  → Rubric bank saved to: {rubric_csv}")

        # Step 3: classify rubrics into axes and save
        print("Step 3: Classifying rubrics into axes")
        classified_rows: List[Dict[str, str]] = []
        bank_df = pd.read_csv(rubric_csv)
        for _, row in bank_df.iterrows():
            theme = row["Theme"]
            rubs = json.loads(row["Rubrics"])
            print(f"  • Classifying rubrics for: {theme}")
            cls = self._classify_rubrics_to_axes(theme, rubs)
            # prepare a flat row: Theme + JSON per axis
            entry = {"Theme": theme}
            for ax in self.AXES + ["unclassified"]:
                entry[ax] = json.dumps(cls.get(ax, []), ensure_ascii=False)
            classified_rows.append(entry)
        classified_csv = self.output_folder / "theme_rubric_bank_classified.csv"
        pd.DataFrame(classified_rows).to_csv(classified_csv, index=False)
        print(f"  → Classified rubric bank saved to: {classified_csv}")


if __name__ == "__main__":
    THEMES = [
        "symptom interpretation and triage",
        "preventive care and screening",
        "lifestyle and diet advice",
        "clinical procedures and interventions",
        "risk and complication explanation",
        "factual recall and definition",
        "medication guidance",
        "numerical reasoning and calculations",
        "reproductive and sexual health",
        "chronic condition management"
    ]

    generator = ThemeRubricGenerator(
        dataset_path="/Users/vrn/Work/medical_eval/backend/data/sample_15.csv",
        themes=THEMES,
        output_folder="/Users/vrn/Work/medical_eval/frontend/public/medical_3"
    )
    generator.run()

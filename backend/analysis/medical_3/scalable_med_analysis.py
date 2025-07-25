import os
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class ThemeRubricScorer:
    AXES = [
        "Accuracy",
        "Completeness",
        "Context Awareness",
        "Communication",
        "Terminology Accessibility"
    ]

    def __init__(
        self,
        dataset_csv: str,
        llm_response_source_csv: str,
        classified_rubric_csv: str,
        output_dataset_csv: str,
        detailed_output_csv: str
    ):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        self.df = pd.read_csv(dataset_csv)
        llm_df = pd.read_csv(llm_response_source_csv)
        rubric_df = pd.read_csv(classified_rubric_csv)

        if "llm_response" not in llm_df.columns:
            raise ValueError("The source file does not contain 'llm_response' column")
        self.df["llm_response"] = llm_df["llm_response"]

        self.rubric_df = rubric_df
        self.output_dataset_csv = Path(output_dataset_csv)
        self.detailed_output_csv = Path(detailed_output_csv)

        self.theme_axes_rubrics: Dict[str, Dict[str, List[str]]] = {}
        for _, row in rubric_df.iterrows():
            theme = row["Theme"]
            self.theme_axes_rubrics[theme] = {
                axis: json.loads(row.get(axis, "[]")) for axis in self.AXES + ["unclassified"]
            }

        self.axis_weights = {
            "Completeness": 0.25,
            "Accuracy": 0.30,
            "Context Awareness": 0.20,
            "Communication": 0.15,
            "Terminology Accessibility": 0.10
        }

        print("[Init] Loaded all data and merged llm responses.")

    def _call_llm(self, prompt: str, max_tokens: int = 800, temperature: float = 0.1) -> str:
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

    def _score_rubrics(self, question: str, response: str, rubrics: List[str]) -> Dict[str, int]:
        rubrics_json = json.dumps(rubrics, indent=2, ensure_ascii=False)
        prompt = (
            f"You are an expert medical evaluator.\n\n"
            f"Question:\n\"\"\"{question}\"\"\"\n\n"
            f"LLM Response:\n\"\"\"{response}\"\"\"\n\n"
            f"Evaluation Criteria:\n{rubrics_json}\n\n"
            "For each criterion, return 1 if fully satisfied, else 0, as a JSON object."
        )
        out = self._call_llm(prompt)
        body = out[out.find("{"): out.rfind("}") + 1]
        scores = json.loads(body)
        return {r: scores.get(r, 0) for r in rubrics}

    def run(self) -> None:
        detailed_rows = []
        final_scores = []

        print("[Run] Starting rubric scoring...")

        for idx, row in self.df.iterrows():
            question = row["Questions"]
            response = row["llm_response"]
            theme = row["Theme"]

            axes_rubrics = self.theme_axes_rubrics.get(theme, {})
            axis_scores = {}
            rubric_scores_by_axis = {}
            rubric_counts_by_axis = {}

            all_rubric_scores = {}

            for axis in self.AXES:
                rubrics = axes_rubrics.get(axis, [])
                rubric_counts_by_axis[axis] = len(rubrics)
                if not rubrics:
                    axis_scores[axis] = 0.0
                    rubric_scores_by_axis[axis] = {}
                    continue
                rubric_scores = self._score_rubrics(question, response, rubrics)
                rubric_scores_by_axis[axis] = rubric_scores
                all_rubric_scores.update(rubric_scores)
                axis_scores[axis] = sum(rubric_scores.values()) / len(rubric_scores)

            total_score = sum(
                axis_scores.get(ax, 0.0) * self.axis_weights.get(ax, 0.0)
                for ax in self.AXES
            )
            final_scores.append(total_score)

            detail_row = {
                "index": idx,
                "Theme": theme,
                "question": question,
                "llm_response": response,
                "medical_quality_score": total_score,
                "axis_scores": json.dumps(axis_scores),
                "rubric_counts_by_axis": json.dumps(rubric_counts_by_axis),
                "rubric_scores_by_axis": json.dumps(rubric_scores_by_axis, ensure_ascii=False),
                "all_rubric_scores_flat": json.dumps(all_rubric_scores, ensure_ascii=False)
            }

            for ax in self.AXES:
                detail_row[f"{ax}_score"] = axis_scores.get(ax, 0.0)
                detail_row[f"{ax}_rubric_count"] = rubric_counts_by_axis.get(ax, 0)

            detailed_rows.append(detail_row)

        self.df["medical_quality_score"] = final_scores
        self.output_dataset_csv.parent.mkdir(parents=True, exist_ok=True)
        self.df.to_csv(self.output_dataset_csv, index=False)

        detail_df = pd.DataFrame(detailed_rows).set_index("index")
        self.detailed_output_csv.parent.mkdir(parents=True, exist_ok=True)
        detail_df.to_csv(self.detailed_output_csv)

        print(f"[Done] Updated dataset saved to: {self.output_dataset_csv}")
        print(f"[Done] Detailed scores saved to: {self.detailed_output_csv}")



if __name__ == "__main__":
    scorer = ThemeRubricScorer(
        dataset_csv="/Users/vrn/Work/medical_eval/frontend/public/medical_3/sample_15_themed.csv",
        llm_response_source_csv="/Users/vrn/Work/medical_eval/frontend/public/llm_responses.csv",
        classified_rubric_csv="/Users/vrn/Work/medical_eval/frontend/public/medical_3/theme_rubric_bank_classified.csv",
        output_dataset_csv="/Users/vrn/Work/medical_eval/frontend/public/medical_3/scored_dataset_updated.csv",
        detailed_output_csv="/Users/vrn/Work/medical_eval/frontend/public/medical_3/scored_dataset_detailed.csv"
    )
    scorer.run()

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import (
    INPUT_DATASET_PATH,
    LLM_RESPONSES_OUTPUT_PATH,
    QUESTION_COLUMN,
    LINGUISTIC_SCORED_DATASET_PATH,
    SEMANTIC_SCORED_DATASET_PATH,
    MEDICAL_SCORED_DATASET_PATH,
    MEDICAL_2_SCORED_DATASET_PATH,
    SUMMARY_DATASET_PATH,
)
from generate_llm_response import PregnancyLLMResponder
from analysis.linguistic_analysis import LinguisticAnalyzer
from analysis.semantic_analysis import SemanticAnalyzer
from analysis.medical_analysis import MedicalQualityEvaluator
from analysis.new_med_analysis import MedicalQualityEvaluator as NewMedicalQualityEvaluator



def file_exists(path: str) -> bool:
    """Check if a file already exists at given path."""
    return Path(path).exists()


def run_llm_generation() -> bool:
    """Step 1: Generate or load LLM responses."""
    print("=== Step 1: LLM Response Generation ===")
    if file_exists(LLM_RESPONSES_OUTPUT_PATH):
        print(f"✓ Responses already at {LLM_RESPONSES_OUTPUT_PATH}, skipping step.")
        return True

    try:
        responder = PregnancyLLMResponder()
        responder.generate_llm_responses(
            csv_path=INPUT_DATASET_PATH,
            output_path=LLM_RESPONSES_OUTPUT_PATH,
            question_column=QUESTION_COLUMN,
        )
        print("✓ LLM responses generated successfully.")
        return True
    except Exception as err:
        print(f"✗ LLM generation error: {err}")
        return False


def run_linguistic_analysis() -> bool:
    """Step 2: Score responses for linguistic quality."""
    print("\n=== Step 2: Linguistic Analysis ===")
    try:
        linguist = LinguisticAnalyzer(LLM_RESPONSES_OUTPUT_PATH)
        linguist.run_and_update_scores()
        linguist.save_updated_dataset(LINGUISTIC_SCORED_DATASET_PATH)
        print("✓ Linguistic analysis complete.")
        return True
    except Exception as err:
        print(f"✗ Linguistic analysis error: {err}")
        return False


def run_semantic_analysis() -> bool:
    """Step 3: Score responses for semantic similarity."""
    print("\n=== Step 3: Semantic Analysis ===")
    try:
        semantic = SemanticAnalyzer(LINGUISTIC_SCORED_DATASET_PATH)
        semantic.run_and_update_scores()
        semantic.save_updated_dataset(SEMANTIC_SCORED_DATASET_PATH)
        print("✓ Semantic analysis complete.")
        return True
    except Exception as err:
        print(f"✗ Semantic analysis error: {err}")
        return False


def run_medical_evaluation_old() -> bool:
    """Step 4: Evaluate medical quality with legacy evaluator."""
    print("\n=== Step 4: Medical Quality Evaluation (Legacy) ===")
    try:
        legacy_eval = MedicalQualityEvaluator(SEMANTIC_SCORED_DATASET_PATH)
        legacy_eval.run_and_update_scores()
        legacy_eval.save_updated_dataset(MEDICAL_SCORED_DATASET_PATH)
        print("✓ Legacy medical evaluation complete.")
        return True
    except Exception as err:
        print(f"✗ Legacy medical evaluation error: {err}")
        return False


def run_medical_evaluation_new() -> bool:
    """Step 5: Evaluate medical quality with updated evaluator."""
    print("\n=== Step 5: Medical Quality Evaluation (Updated) ===")
    try:
        new_eval = NewMedicalQualityEvaluator(MEDICAL_SCORED_DATASET_PATH)
        new_eval.run_and_update_scores()
        new_eval.save_updated_dataset(MEDICAL_2_SCORED_DATASET_PATH)
        print("✓ Updated medical evaluation complete.")
        return True
    except Exception as err:
        print(f"✗ Updated medical evaluation error: {err}")
        return False


def main() -> None:
    """Execute the full evaluation pipeline in five sequential steps."""
    print("Starting Medical QA Evaluation Pipeline...")
    print("=" * 50)
    steps = [
        run_llm_generation,
        run_linguistic_analysis,
        run_semantic_analysis,
        run_medical_evaluation_old,
        run_medical_evaluation_new,
    ]
    for step in steps:
        if not step():
            print(f"Pipeline aborted at {step.__name__}.")
            sys.exit(1)
    print("\n" + "=" * 50)
    print("✓ Pipeline completed successfully.")
    print("=" * 50)

    # After pipeline, compute and upsert summary averages (one row per dataset)
    try:
        import pandas as pd
        from pathlib import Path

        final_path = MEDICAL_2_SCORED_DATASET_PATH
        df = pd.read_csv(final_path)

        def num_mean(frame: pd.DataFrame, col: str) -> float:
            if col not in frame.columns:
                return 0.0
            s = pd.to_numeric(frame[col], errors="coerce")
            return float(s.mean()) if len(s) else 0.0

        summary_row = {
            "dataset": Path(INPUT_DATASET_PATH).stem,
            "rows": int(len(df)),
            "med1": num_mean(df, "medical_quality_score"),
            "med2": num_mean(df, "medical_quality_score_2"),
            # "semantic": num_mean(df, "semantic_similarity"),
            "sbert": num_mean(df, "sbert_similarity"),
            # "vyakyarth": num_mean(df, "vyakyarth_similarity"),
            "cohere": num_mean(df, "cohere_similarity"),
            "voyage": num_mean(df, "voyage_similarity"),
            "openai":num_mean(df, "openai_similarity"),
            "bert": num_mean(df, "bert_score_f1"),
            "bleu": num_mean(df, "bleu_score"),
            "meteor": num_mean(df, "meteor_score"),
            "rouge_l": num_mean(df, "rouge_l_score"),
            "perplexity": num_mean(df, "perplexity"),
            "ling": num_mean(df, "linguistic_quality_score"),
        }

        if Path(SUMMARY_DATASET_PATH).exists():
            s = pd.read_csv(SUMMARY_DATASET_PATH)
            if (s["dataset"] == summary_row["dataset"]).any():
                for k, v in summary_row.items():
                    s.loc[s["dataset"] == summary_row["dataset"], k] = v
            else:
                s = pd.concat([s, pd.DataFrame([summary_row])], ignore_index=True)
        else:
            s = pd.DataFrame([summary_row])

        Path(SUMMARY_DATASET_PATH).parent.mkdir(parents=True, exist_ok=True)
        s.to_csv(SUMMARY_DATASET_PATH, index=False)
        print(f"✓ Summary scores updated at: {SUMMARY_DATASET_PATH}")
    except Exception as err:
        print(f"✗ Failed to update summary scores: {err}")
if __name__ == "__main__":
    main()
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import (
    INPUT_DATASET_PATH,
    LLM_RESPONSES_OUTPUT_PATH,
    QUESTION_COLUMN,
    LINGUISTIC_SCORED_DATASET_PATH,
    LINGUISTIC_SUMMARY_PATH,
    SEMANTIC_SCORED_DATASET_PATH,
    SEMANTIC_SUMMARY_PATH,
    MEDICAL_SCORED_DATASET_PATH,
    MEDICAL_DETAILED_SCORES_PATH,
    MEDICAL_2_SCORED_DATASET_PATH,
    MEDICAL_2_DETAILED_SCORES_PATH,
    MEDICAL_3_SCORED_DATASET_PATH,
    MEDICAL_3_DETAILED_SCORES_PATH,
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
        linguist.save_summary_scores(LINGUISTIC_SUMMARY_PATH)
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
        semantic.save_summary_scores(SEMANTIC_SUMMARY_PATH)
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
        legacy_eval.save_detailed_scores(MEDICAL_DETAILED_SCORES_PATH)
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
        new_eval.save_detailed_scores(MEDICAL_2_DETAILED_SCORES_PATH)
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


if __name__ == "__main__":
    main()
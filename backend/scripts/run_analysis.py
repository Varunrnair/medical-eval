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
from analysis.new_med_analysis import MedicalQualityEvaluator as NewMedicalQualityEvaluator  # new import


def check_file_exists(file_path: str) -> bool:
    return Path(file_path).exists()


def run_llm_response_generation() -> bool:
    print("=== Step 1: LLM Response Generation ===")
    if check_file_exists(LLM_RESPONSES_OUTPUT_PATH):
        print(f"✓ LLM responses file already exists at: {LLM_RESPONSES_OUTPUT_PATH}")
        print("Skipping LLM response generation...")
        return True

    print("Generating LLM responses...")
    try:
        llm_responder = PregnancyLLMResponder()
        llm_responder.generate_llm_responses(
            csv_path=INPUT_DATASET_PATH,
            output_path=LLM_RESPONSES_OUTPUT_PATH,
            question_column=QUESTION_COLUMN
        )
        print("✓ LLM response generation completed")
        return True
    except Exception as e:
        print(f"✗ Error in LLM response generation: {e}")
        return False


def run_linguistic_analysis() -> bool:
    print("\n=== Step 2: Linguistic Analysis ===")
    try:
        analyzer = LinguisticAnalyzer(LLM_RESPONSES_OUTPUT_PATH)
        analyzer.run_and_update_scores()
        analyzer.save_updated_dataset(LINGUISTIC_SCORED_DATASET_PATH)
        analyzer.save_summary_scores(LINGUISTIC_SUMMARY_PATH)
        print("✓ Linguistic analysis completed")
        return True
    except Exception as e:
        print(f"✗ Error in linguistic analysis: {e}")
        return False


def run_semantic_analysis() -> bool:
    print("\n=== Step 3: Semantic Analysis ===")
    try:
        analyzer = SemanticAnalyzer(LINGUISTIC_SCORED_DATASET_PATH)
        analyzer.run_and_update_scores()
        analyzer.save_updated_dataset(SEMANTIC_SCORED_DATASET_PATH)
        analyzer.save_summary_scores(SEMANTIC_SUMMARY_PATH)
        print("✓ Semantic analysis completed")
        return True
    except Exception as e:
        print(f"✗ Error in semantic analysis: {e}")
        return False


def run_medical_quality_evaluation() -> bool:
    print("\n=== Step 4: Medical Quality Evaluation (Old) ===")
    try:
        evaluator = MedicalQualityEvaluator(SEMANTIC_SCORED_DATASET_PATH)
        evaluator.run_and_update_scores()
        evaluator.save_updated_dataset(MEDICAL_SCORED_DATASET_PATH)
        evaluator.save_detailed_scores(MEDICAL_DETAILED_SCORES_PATH)
        print("✓ Medical quality evaluation (old) completed")
        return True
    except Exception as e:
        print(f"✗ Error in medical quality evaluation (old): {e}")
        return False


def run_new_medical_quality_evaluation() -> bool:
    print("\n=== Step 5: Medical Quality Evaluation (New) ===")
    try:
        new_evaluator = NewMedicalQualityEvaluator(MEDICAL_SCORED_DATASET_PATH)
        new_evaluator.run_and_update_scores()
        new_evaluator.save_updated_dataset(MEDICAL_2_SCORED_DATASET_PATH)
        new_evaluator.save_detailed_scores(MEDICAL_2_DETAILED_SCORES_PATH)
        print("✓ Medical quality evaluation (new) completed")
        return True
    except Exception as e:
        print(f"✗ Error in medical quality evaluation (new): {e}")
        return False


def main() -> bool:
    print("Starting Medical QA Evaluation Pipeline...")
    print("=" * 50)

    if not run_llm_response_generation():
        print("Pipeline failed at Step 1 (LLM Response Generation)")
        return False

    if not run_linguistic_analysis():
        print("Pipeline failed at Step 2 (Linguistic Analysis)")
        return False

    if not run_semantic_analysis():
        print("Pipeline failed at Step 3 (Semantic Analysis)")
        return False

    if not run_medical_quality_evaluation():
        print("Pipeline failed at Step 4 (Medical Quality Evaluation - Old)")
        return False

    if not run_new_medical_quality_evaluation():
        print("Pipeline failed at Step 5 (Medical Quality Evaluation - New)")
        return False

    print("\n" + "=" * 50)
    print("✓ Complete Medical QA Evaluation Pipeline Finished Successfully!")
    print("=" * 50)
    return True


if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)

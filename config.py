# Configuration file for the evaluation system

# Cohere API settings
COHERE_MODEL = "c4ai-aya-expanse-32b"

# HealthBench axis weights
AXIS_WEIGHTS = {
    'Completeness': 0.39,
    'Accuracy': 0.33,
    'Context Awareness': 0.16,
    'Communication Quality': 0.08,
    'Instruction Following': 0.04
}

# Final score weights
FINAL_SCORE_WEIGHTS = {
    'semantic_similarity': 0.40,
    'lexical_overlap': 0.10,
    'medical_quality': 0.50
}

# Evaluation settings
TEMPERATURE_RUBRIC_GENERATION = 0.3
TEMPERATURE_ANSWER_GENERATION = 0.7
TEMPERATURE_RUBRIC_EVALUATION = 0.1

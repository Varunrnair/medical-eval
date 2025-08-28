import os

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
COHERE_API_KEY = os.getenv('COHERE_API_KEY')

INPUT_DATASET_PATH = "/Users/vrn/Work/medical-eval/backend/data/sample_15.csv"
# model_name = "c4ai-aya-expanse-32b"
# model_name = "command-a-03-2025"
# model_name = "gpt-4o-mini-2024-07-18"
model_name = "gpt-5-mini-2025-08-07"
# model_name = "gemini-2.5-flash"
# model_name = "Llama-3.3-70B-Instruct-Turbo"
QUESTION_COLUMN = "Questions"
# JUDGE_MODEL = "gpt-4o-mini-2024-07-18"
JUDGE_MODEL = "gemini-2.5-flash"
MAX_TOKENS = 1000
TEMPERATURE = 0.1
dataset_name = "usercontext1"


FINAL_DATASET_PATH = f"/Users/vrn/Work/medical-eval/frontend/public/datasets/{dataset_name}/{model_name}/scored_final_dataset.csv"
SUMMARY_DATASET_PATH = f"/Users/vrn/Work/medical-eval/frontend/public/datasets/{dataset_name}/{model_name}/summary_scores.csv"
LLM_RESPONSES_OUTPUT_PATH = FINAL_DATASET_PATH
LINGUISTIC_SCORED_DATASET_PATH = FINAL_DATASET_PATH
SEMANTIC_SCORED_DATASET_PATH = FINAL_DATASET_PATH
MEDICAL_SCORED_DATASET_PATH = FINAL_DATASET_PATH
MEDICAL_2_SCORED_DATASET_PATH = FINAL_DATASET_PATH


RUBRIC_GENERATION_PROMPT = """You are analyzing a set of high-quality, gold-standard medical answers.  
Your task is to extract the key themes and recurring qualities that make these responses effective and reliable.

Question: {question}
Gold Standard Answer: {gold_answer}

Instructions:
- Carefully study the medical content, tone, and structure of the answers.  
- Identify specific patterns related to medical accuracy, clarity, completeness, and patient-centered communication.  
- Focus on how the answers provide guidance, manage uncertainty, simplify technical concepts, and support the user.

Your Output:
Extract 15–20 distinct, high-level themes that consistently appear across the answers.  
Each theme must be written as a precise, actionable statement that captures a key characteristic of effective medical QA.  
Do NOT summarize or generalize. Instead, describe each theme clearly and concretely.

Return only the list of themes, numbered from 1 to 20 (or fewer if fewer are appropriate)."""



RUBRIC_SCORING = """You are an expert evaluator assessing AI-generated medical responses against specific quality criteria.

Question Context:
\"\"\"{question}\"\"\"

LLM Response to Evaluate:
\"\"\"{llm_response}\"\"\"

Evaluation Task:
For each criterion below, determine if the LLM response fully satisfies the requirement. Score 1 if the criterion is clearly met, 0 if not met or ambiguous.

Criteria:
{rubrics_prompt}

Scoring Instructions:
- 1: The response clearly and unambiguously meets this criterion
- 0: The response fails to meet this criterion or is ambiguous/insufficient

EXAMPLE OUTPUT FORMAT:
{{
"criterion 1": 1,
"criterion 2": 0,
"criterion 3": 1,
"criterion 4": 1,
"criterion 5": 0
}}

IMPORTANT: Output ONLY the JSON object above with your actual scores. No explanations, no additional text, no markdown formatting - just the raw JSON.
"""



RUBRIC_CLASSIFICATION_PROMPT = """You are given a set of evaluation rubrics and a list of predefined axes. 
Your task is to assign **every rubric** to **exactly one** axis based on the most appropriate conceptual alignment. 
Do not leave any rubric unclassified or assign it to multiple axes.

Available Axes (with descriptions):
{axes_desc}

Rubrics to classify:
{rubrics_text}

Instructions:
- Each rubric **must** be assigned to **one and only one** axis.
- Return your output strictly as a **valid JSON object**.
- The JSON format should be: {{ "Axis1": [rubric1, rubric2], "Axis2": [...], ... }}
- Ensure that **all input rubrics appear exactly once** in the JSON output.
- Do not invent new axes or modify rubric text.
- Only use the axes listed above as keys.

IMPORTANT: If you're unsure where a rubric fits best, make a reasonable choice—it must still be classified. No rubric should be left out.

Now return the classification JSON object:
"""




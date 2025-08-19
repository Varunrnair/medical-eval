import pandas as pd
import json
import openai
from google import genai
from google.genai import types
import os
import re
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from config import JUDGE_MODEL
load_dotenv()


class MedicalQualityEvaluator:
    def __init__(self, dataset_path: str):
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        # self.client = genai.Client(api_key=api_key)
        self.dataset_path = dataset_path
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")  
        self.df = pd.read_csv(dataset_path)
        required_columns = ['Questions', 'Answer', 'llm_response']
        missing_columns = [col for col in required_columns if col not in self.df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        self.selected_axes = [
            "Accuracy", 
            "Completeness",
            "Context Awareness",
            "Communication",
            "Terminology Accessibility"
        ]
        self.axis_weights = {
            "Completeness": 0.25,
            "Accuracy": 0.30,
            "Context Awareness": 0.20,
            "Communication": 0.15,
            "Terminology Accessibility": 0.10
        }
        self.axis_descriptions = {
            "Completeness": "Answer addresses all relevant aspects of the question comprehensively",
            "Accuracy": "Medical information is factually correct and evidence-based",
            "Context Awareness": "Response is appropriate for the specific medical context",
            "Communication": "Information is communicated clearly and effectively",
            "Terminology Accessibility": "Medical terms are explained accessibly for patients"
        }



    def call_llm(self, prompt: str, max_tokens: int = 800, temperature: float = 0.1) -> Optional[str]:
        """Call LLM with retry logic for better robustness"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.openai_client.chat.completions.create(
                    model=JUDGE_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"LLM call failed after {max_retries} attempts: {e}")
                    return None
                print(f"LLM call attempt {attempt + 1} failed, retrying...")
        return None
    
    # def call_llm(self, prompt: str, max_tokens: int = 800, temperature: float = 0.1) -> Optional[str]:
    #     """Call LLM with retry logic using the new Google GenAI SDK"""
    #     max_retries = 3
        
    #     # Build the generation config
    #     generation_config = types.GenerateContentConfig(
    #         max_output_tokens=max_tokens,
    #         temperature=temperature,
    #         # Disable thinking to reduce costs and latency
    #         thinking_config=types.ThinkingConfig(thinking_budget=0)
    #     )

    #     for attempt in range(max_retries):
    #         try:
    #             # Use the new SDK format
    #             response = self.client.models.generate_content(
    #                 model=JUDGE_MODEL,  # Should be something like "gemini-2.5-flash"
    #                 contents=prompt,
    #                 config=generation_config
    #             )
                
    #             # Check if response has content
    #             if response and response.text:
    #                 return response.text.strip()
    #             else:
    #                 print(f"Empty response received on attempt {attempt + 1}")
                    
    #         except Exception as e:
    #             print(f"LLM call attempt {attempt + 1} failed: {str(e)}")
    #             if attempt == max_retries - 1:
    #                 print(f"LLM call failed after {max_retries} attempts: {e}")
    #                 return None
                    
    #             wait_time = 2 ** (attempt + 1)
    #             print(f"Retrying in {wait_time} seconds...")
    #             time.sleep(wait_time)        
    #     return None


    def generate_rubrics(self, question: str, gold_answer: str) -> List[str]:
        """Enhanced rubric generation with JSON output and broader medical scope"""
        prompt = f"""You are analyzing high-quality medical responses across all areas of healthcare including women's health, reproductive health, mental health, chronic conditions, preventive care, and general medical topics.

Your task is to extract key themes and qualities that make medical responses effective, reliable, and helpful to patients.

Question: {question}
Gold Standard Answer: {gold_answer}

Instructions:
- Study the medical content, tone, structure, and approach used in the gold standard answer
- Identify patterns related to medical accuracy, clarity, completeness, patient safety, and supportive communication
- Focus on how the answer provides guidance, manages uncertainty, explains medical concepts, addresses patient concerns, and maintains professional standards
- Consider all aspects of healthcare delivery including sensitive topics, preventive care, treatment options, and patient education

Generate 15-20 distinct evaluation criteria that capture what makes this a high-quality medical response. Each criterion should be:
- Specific and actionable
- Applicable to medical question-answering
- Focused on one clear aspect of quality
- Written as a clear statement describing what good responses should do

IMPORTANT: Return ONLY a JSON array of strings. No explanations, no numbering, no additional text - just the raw JSON array.

Example format:
["Provides evidence-based medical information", "Uses accessible language while maintaining accuracy", "Addresses patient safety concerns explicitly"]

JSON Response:"""

        response = self.call_llm(prompt, max_tokens=600, temperature=0.3)
        if not response:
            return []
        
        try:
            # Extract JSON from response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                rubrics = json.loads(json_str)
                
                # Validate that we got a list of strings
                if isinstance(rubrics, list) and all(isinstance(r, str) for r in rubrics):
                    if len(rubrics) < 10:
                        print(f"Warning: Only {len(rubrics)} rubrics generated, expected 15-20")
                    return rubrics
                else:
                    print("Warning: Invalid rubrics format received")
                    return []
            else:
                print("Warning: No JSON array found in rubrics response")
                return []
        except json.JSONDecodeError as e:
            print(f"JSON decode error in rubric generation: {e}")
            return []


    def score_rubrics(self, question: str, llm_response: str, rubrics: List[str]) -> Dict[str, int]:
        """Enhanced rubric scoring with clear JSON output format"""
        rubrics_json = json.dumps(rubrics, indent=2)
        
        prompt = f"""You are an expert medical evaluator assessing AI-generated responses against specific quality criteria.

Question Context:
"{question}"

LLM Response to Evaluate:
"{llm_response}"

Evaluation Criteria:
{rubrics_json}

Scoring Task:
For each criterion, determine if the LLM response fully satisfies that requirement:
- Score 1: The response clearly and adequately meets this criterion
- Score 0: The response fails to meet this criterion, is insufficient, or is ambiguous

Scoring Guidelines:
- Be thorough but fair in your evaluation
- Consider the medical context and patient needs
- Look for evidence that each criterion is specifically addressed
- If a criterion is partially met but not completely, score it as 0

IMPORTANT: Return ONLY a JSON object where:
- Keys are the exact rubric text (as provided above)
- Values are either 0 or 1
- Include ALL rubrics in your response
- No explanations, no additional text, no markdown - just the raw JSON object

JSON Response:"""

        response = self.call_llm(prompt, max_tokens=800, temperature=0.1)
        if not response:
            return {}
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                scores = json.loads(json_str)
                
                # Validate scores format
                valid_scores = {}
                for rubric in rubrics:
                    if rubric in scores and scores[rubric] in [0, 1]:
                        valid_scores[rubric] = scores[rubric]
                    else:
                        print(f"Warning: Missing or invalid score for rubric: {rubric[:50]}...")
                        valid_scores[rubric] = 0  # Default to 0 for missing scores
                
                if len(valid_scores) != len(rubrics):
                    print(f"Warning: Only {len(valid_scores)}/{len(rubrics)} rubrics were properly scored")
                
                return valid_scores
            else:
                print("Warning: No JSON object found in scoring response")
                return {}
        except json.JSONDecodeError as e:
            print(f"JSON decode error in rubric scoring: {e}")
            return {}


    def classify_rubrics_to_axes(self, rubrics: List[str]) -> Dict[str, List[str]]:
        """Enhanced rubric classification with strict requirements and fallback handling"""
        axes_desc = "\n".join([f"- {axis}: {desc}" for axis, desc in self.axis_descriptions.items()])
        rubrics_json = json.dumps(rubrics, indent=2)
        
        prompt = f"""You are classifying evaluation rubrics into predefined quality dimensions for medical response assessment.

Available Quality Dimensions:
{axes_desc}

Rubrics to Classify:
{rubrics_json}

Classification Rules:
- EVERY rubric MUST be assigned to exactly ONE dimension
- Choose the MOST APPROPRIATE dimension for each rubric - don't overthink the perfect fit
- If a rubric could fit multiple dimensions, pick the best match and move on
- If you're unsure about a rubric, make a reasonable judgment call rather than leaving it unclassified
- It's better to have a slightly imperfect classification than to leave rubrics unassigned

Your task:
Assign each rubric to its most appropriate dimension. Be decisive and ensure complete coverage.

IMPORTANT: Return ONLY a JSON object where:
- Keys are the exact dimension names from above
- Values are arrays of rubric strings that belong to that dimension
- Every rubric from the input list must appear exactly once
- Include an "unclassified" key with an empty array (it should remain empty if you follow the rules)

Example format:
{{
  "Dimension1": ["rubric text 1", "rubric text 2"],
  "Dimension2": ["rubric text 3"],
  "unclassified": []
}}

JSON Response:"""

        response = self.call_llm(prompt, max_tokens=1000, temperature=0.1)
        if not response:
            return {}
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                classification = json.loads(json_str)
                
                # Validate and fix classification
                final_classification = {}
                
                # Initialize with empty lists for all axes plus unclassified
                for axis in self.selected_axes:
                    final_classification[axis] = classification.get(axis, [])
                final_classification["unclassified"] = classification.get("unclassified", [])
                
                # Check which rubrics were classified
                classified_rubrics = []
                for rubric_list in final_classification.values():
                    classified_rubrics.extend(rubric_list)
                
                # Find missing rubrics and assign them to unclassified
                missing_rubrics = [r for r in rubrics if r not in classified_rubrics]
                if missing_rubrics:
                    print(f"Warning: {len(missing_rubrics)} rubrics were not classified, adding to unclassified")
                    final_classification["unclassified"].extend(missing_rubrics)
                
                # Report classification results
                total_classified = sum(len(rubrics_list) for rubrics_list in final_classification.values())
                print(f"Classification complete: {total_classified} total assignments, {len(final_classification['unclassified'])} unclassified")
                
                return final_classification
            else:
                print("Warning: No JSON object found in classification response")
                return {}
        except json.JSONDecodeError as e:
            print(f"JSON decode error in rubric classification: {e}")
            return {}


    def calculate_axis_scores(self, rubric_scores: Dict[str, int], classification: Dict[str, List[str]]) -> Dict[str, float]:
        """Enhanced axis score calculation with validation"""
        axis_scores = {}
        for axis, rubrics in classification.items():
            if axis == "unclassified":
                continue  # Skip unclassified rubrics in scoring
                
            valid_rubrics = [rubric_scores[r] for r in rubrics if r in rubric_scores]
            if valid_rubrics:
                axis_scores[axis] = sum(valid_rubrics) / len(valid_rubrics)
            else:
                axis_scores[axis] = 0.0
                if rubrics:  # Only warn if rubrics were assigned to this axis
                    print(f"Warning: No valid scores found for axis '{axis}' with {len(rubrics)} rubrics")
        return axis_scores


    def calculate_medical_quality_score(self, axis_scores: Dict[str, float]) -> float:
        """Calculate weighted medical quality score"""
        return sum(axis_scores.get(axis, 0.0) * self.axis_weights.get(axis, 0.0) for axis in self.selected_axes)


    def run_and_update_scores(self) -> None:
        """Enhanced main evaluation loop with better error handling"""
        medical_scores = []
        detailed_rows = []
        # Embed detailed data directly into main dataframe columns for simplified storage
        m1_rubrics_col, m1_rubric_scores_col = [], []
        m1_classification_col, m1_axis_scores_col = [], []
        
        print(f"Processing {len(self.df)} rows...")
        
        for idx, row in self.df.iterrows():
            if idx % 10 == 0:
                print(f"Processing row {idx}/{len(self.df)}")
            try:
                question_val = row.at['Questions'] if 'Questions' in row else ''
                gold_answer_val = row.at['Answer'] if 'Answer' in row else ''
                llm_response_val = row.at['llm_response'] if 'llm_response' in row else ''
                question = str(question_val) if not pd.isna(question_val) else ""
                gold_answer = str(gold_answer_val) if not pd.isna(gold_answer_val) else ""
                llm_response = str(llm_response_val) if not pd.isna(llm_response_val) else ""
                rubrics = self.generate_rubrics(question, gold_answer)
                if not rubrics:
                    medical_scores.append(0.0)
                    continue
                rubric_scores = self.score_rubrics(question, llm_response, rubrics)
                if not rubric_scores:
                    medical_scores.append(0.0)
                    continue
                classification = self.classify_rubrics_to_axes(rubrics)
                if not any(classification[axis] for axis in self.selected_axes):
                    medical_scores.append(0.0)
                    continue
                axis_scores = self.calculate_axis_scores(rubric_scores, classification)
                medical_score = self.calculate_medical_quality_score(axis_scores)
                medical_scores.append(medical_score)

                # Append row-wise detailed JSON columns for consolidated CSV
                m1_rubrics_col.append(json.dumps(rubrics))
                m1_rubric_scores_col.append(json.dumps(rubric_scores))
                m1_classification_col.append(json.dumps(classification))
                m1_axis_scores_col.append(json.dumps(axis_scores))

                detailed_rows.append({
                    'question': question,
                    'gold_standard_answer': gold_answer,
                    'llm_response': llm_response,
                    'rubrics': json.dumps(rubrics),
                    'rubric_scores': json.dumps(rubric_scores),
                    'classification': json.dumps(classification),
                    'axis_scores': json.dumps(axis_scores),
                    'medical_quality_score': medical_score
                })
            except Exception as e:
                print(f"Error processing row {idx}: {e}")
                medical_scores.append(0.0)
                continue
        
        # Critical fix: Ensure alignment between scores and dataframe
        assert len(medical_scores) == len(self.df), f"Score length mismatch: {len(medical_scores)} vs {len(self.df)}"
        
        self.df['medical_quality_score'] = medical_scores
        # Attach detailed columns (prefixed m1_) to main dataframe
        self.df['m1_rubrics'] = m1_rubrics_col
        self.df['m1_rubric_scores'] = m1_rubric_scores_col
        self.df['m1_classification'] = m1_classification_col
        self.df['m1_axis_scores'] = m1_axis_scores_col
        self.detailed_df = pd.DataFrame(detailed_rows)
        
        print(f"Evaluation complete. Average medical quality score: {sum(medical_scores)/len(medical_scores):.3f}")


    def save_updated_dataset(self, output_path: str):
        """Save updated dataset with directory creation"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        self.df.to_csv(output_path, index=False)
        print(f"Updated dataset saved to: {output_path}")
        

    def save_detailed_scores(self, detailed_output_path: str):
        """Save detailed scores with directory creation"""
        os.makedirs(os.path.dirname(detailed_output_path), exist_ok=True)
        self.detailed_df.to_csv(detailed_output_path, index=False)
        print(f"Detailed scores saved to: {detailed_output_path}")
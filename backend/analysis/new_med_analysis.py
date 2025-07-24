import pandas as pd
import json
import os
from typing import List, Dict
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class MedicalQualityEvaluator:
    def __init__(self, dataset_path: str):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.dataset_path = dataset_path
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")  
        
        self.df = pd.read_csv(dataset_path)
        required_columns = ['Questions', 'Answer', 'llm_response']
        missing_columns = [col for col in required_columns if col not in self.df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Define the 5 axes (3 fixed + 2 generated)
        self.selected_axes = [
            "Accuracy", 
            "Completeness",
            "Context Awareness",  # Fixed
            "Communication",      # Fixed
            "Terminology Accessibility"  # Fixed
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
        
        # Define fixed rubrics for the 3 predefined axes
        self.fixed_rubrics = {
            "Communication": [
                "Uses a professional and empathetic tone throughout the response",
                "Communicates information in a clear and straightforward manner",
                "Empowers the patient by providing actionable recommendations",
                "Focuses on improving overall patient well-being and health outcomes"
            ],
            "Terminology Accessibility": [
                "Defines all medical terms using simple, everyday language",
                "Avoids unnecessary jargon and technical medical complexity",
                "Clarifies common myths or misconceptions related to the condition",
                "Explains complex concepts in a patient-friendly and accessible way"
            ],
            "Context Awareness": [
                "Tailors information to the individual patient's specific context",
                "Clearly acknowledges uncertainty in potential medical outcomes",
                "Addresses possible risks and important safety considerations",
                "Provides timely guidance relevant to real-world patient decisions"
            ]
        }
        
        # Axes that need rubric generation
        self.axes_to_generate = ["Accuracy", "Completeness"]

    def call_llm(self, prompt: str, max_tokens: int = 800, temperature: float = 0.1) -> str:
        """Call LLM with retry logic for better robustness"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
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

    def generate_rubrics_for_axes(self, question: str, gold_answer: str) -> List[str]:
        """Generate rubrics specifically for Accuracy and Completeness axes"""
        axes_to_generate_desc = {
            "Accuracy": "Medical information is factually correct and evidence-based",
            "Completeness": "Answer addresses all relevant aspects of the question comprehensively"
        }
        
        axes_desc = "\n".join([f"- {axis}: {desc}" for axis, desc in axes_to_generate_desc.items()])
        
        prompt = f"""You are analyzing high-quality medical responses to generate evaluation criteria for specific quality dimensions.

Target Quality Dimensions:
{axes_desc}

Question: {question}
Gold Standard Answer: {gold_answer}

Instructions:
- Study the medical content focusing specifically on ACCURACY and COMPLETENESS aspects
- For ACCURACY: Focus on factual correctness, evidence-based information, medical precision, proper citations/references, absence of misinformation
- For COMPLETENESS: Focus on comprehensive coverage, addressing all aspects of the question, thoroughness, not missing important information

Generate 10-12 distinct evaluation criteria that capture these two dimensions. Each criterion should be:
- Specific and actionable
- Clearly related to either accuracy or completeness of medical information
- Written as a clear statement describing what good responses should do
- Focused on one clear aspect of quality

IMPORTANT: Return ONLY a JSON array of strings. No explanations, no numbering, no additional text - just the raw JSON array.

Example format:
["Provides evidence-based medical information with proper sources", "Addresses all aspects mentioned in the patient's question", "Uses current medical guidelines and standards"]

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
                    if len(rubrics) < 8:
                        print(f"Warning: Only {len(rubrics)} rubrics generated, expected 10-12")
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

    def classify_generated_rubrics_to_axes(self, generated_rubrics: List[str]) -> Dict[str, List[str]]:
        """Classify only the generated rubrics to Accuracy and Completeness axes"""
        axes_to_classify = {
            "Accuracy": "Medical information is factually correct and evidence-based",
            "Completeness": "Answer addresses all relevant aspects of the question comprehensively"
        }
        
        axes_desc = "\n".join([f"- {axis}: {desc}" for axis, desc in axes_to_classify.items()])
        rubrics_json = json.dumps(generated_rubrics, indent=2)
        
        prompt = f"""You are classifying evaluation rubrics into predefined quality dimensions for medical response assessment.

Available Quality Dimensions (ONLY these two):
{axes_desc}

Rubrics to Classify:
{rubrics_json}

Classification Rules:
- EVERY rubric MUST be assigned to exactly ONE of the two dimensions above
- Choose the MOST APPROPRIATE dimension for each rubric
- Accuracy: Focus on factual correctness, evidence-based information, medical precision
- Completeness: Focus on comprehensive coverage, thoroughness, addressing all aspects
- If a rubric could fit both, pick the best match and move on
- Be decisive and ensure complete coverage

IMPORTANT: Return ONLY a JSON object where:
- Keys are exactly "Accuracy" and "Completeness"
- Values are arrays of rubric strings that belong to that dimension
- Every rubric from the input list must appear exactly once
- Include an "unclassified" key with an empty array (should remain empty)

Example format:
{
  "Accuracy": ["rubric text 1", "rubric text 2"],
  "Completeness": ["rubric text 3", "rubric text 4"],
  "unclassified": []
}

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
                
                # Initialize with empty lists for the two axes to generate
                for axis in self.axes_to_generate:
                    final_classification[axis] = classification.get(axis, [])
                final_classification["unclassified"] = classification.get("unclassified", [])
                
                # Check which rubrics were classified
                classified_rubrics = []
                for rubric_list in final_classification.values():
                    classified_rubrics.extend(rubric_list)
                
                # Find missing rubrics and assign them to unclassified
                missing_rubrics = [r for r in generated_rubrics if r not in classified_rubrics]
                if missing_rubrics:
                    print(f"Warning: {len(missing_rubrics)} rubrics were not classified, adding to unclassified")
                    final_classification["unclassified"].extend(missing_rubrics)
                
                # Report classification results
                total_classified = sum(len(rubrics_list) for rubrics_list in final_classification.values())
                print(f"Generated rubrics classification complete: {total_classified} total assignments, {len(final_classification['unclassified'])} unclassified")
                
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
        """Enhanced main evaluation loop with fixed rubrics integration"""
        medical_scores = []
        detailed_rows = []
        
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
                
                # Generate rubrics only for Accuracy and Completeness
                generated_rubrics = self.generate_rubrics_for_axes(question, gold_answer)
                if not generated_rubrics:
                    medical_scores.append(0.0)
                    continue
                
                # Merge fixed rubrics with generated rubrics
                fixed_rubrics_flat = sum(self.fixed_rubrics.values(), [])
                rubrics = generated_rubrics + fixed_rubrics_flat
                
                # Score all rubrics (both generated and fixed)
                rubric_scores = self.score_rubrics(question, llm_response, rubrics)
                if not rubric_scores:
                    medical_scores.append(0.0)
                    continue
                
                # Classify only the generated rubrics
                generated_classification = self.classify_generated_rubrics_to_axes(generated_rubrics)
                
                # Create complete classification by adding fixed rubrics manually
                complete_classification = {}
                
                # Add generated rubrics classification (trimmed to 4 per axis)
                for axis in self.axes_to_generate:
                    axis_rubrics = generated_classification.get(axis, [])[:4]  # Cap at 4 rubrics per axis
                    complete_classification[axis] = axis_rubrics
                
                # Add fixed rubrics to their predefined axes
                for axis, fixed_rubrics_list in self.fixed_rubrics.items():
                    complete_classification[axis] = fixed_rubrics_list
                
                # Add unclassified if any
                if generated_classification.get("unclassified"):
                    complete_classification["unclassified"] = generated_classification["unclassified"]
                
                # Defensive check: Ensure we have rubrics assigned to the main axes
                if all(len(complete_classification.get(axis, [])) == 0 for axis in self.selected_axes):
                    print(f"Warning: No rubrics assigned for row {idx}")
                    medical_scores.append(0.0)
                    continue
                
                axis_scores = self.calculate_axis_scores(rubric_scores, complete_classification)
                medical_score = self.calculate_medical_quality_score(axis_scores)
                medical_scores.append(medical_score)
                
                detailed_rows.append({
                    'question': question,
                    'gold_standard_answer': gold_answer,
                    'llm_response': llm_response,
                    'generated_rubrics': json.dumps(generated_rubrics),
                    'fixed_rubrics': json.dumps(self.fixed_rubrics),
                    'all_rubrics': json.dumps(rubrics),
                    'rubric_scores': json.dumps(rubric_scores),
                    'classification': json.dumps(complete_classification),
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
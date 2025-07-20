import pandas as pd
import json
import openai
import os
import re
from typing import List, Dict, Optional
from dotenv import load_dotenv
load_dotenv()



class MedicalQualityEvaluator:
    def __init__(self, dataset_path: str):
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
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


    def generate_rubrics(self, question: str, gold_answer: str) -> List[str]:
        """Fixed rubric generation with proper numbered parsing"""
        prompt = f"""You are analyzing a set of high-quality, gold-standard medical answers.  
                Your task is to extract the key themes and recurring qualities that make these responses effective and reliable.

                Question: {question}
                Gold Standard Answer: {gold_answer}

                Instructions:
                - Carefully study the medical content, tone, and structure of the answers.  
                - Identify specific patterns related to medical accuracy, clarity, completeness, and patient-centered communication.  
                - Focus on how the answers provide guidance, manage uncertainty, simplify technical concepts, and support the user.

                Your Output:
                Extract 15 to 20 distinct, high-level themes that consistently appear across the answers.  
                Each theme must be written as a precise, actionable statement that captures a key characteristic of effective medical QA.  
                Do NOT summarize or generalize. Instead, describe each theme clearly and concretely.

                EXAMPLE FORMAT:
                1. Provides evidence-based medical information
                2. Uses accessible language while maintaining accuracy
                3. Addresses patient safety concerns explicitly
                4. Acknowledges limitations and uncertainty when appropriate

                Return only the numbered list of themes (1-20 or fewer if appropriate)."""

        response = self.call_llm(prompt, max_tokens=600, temperature=0.3)
        if not response:
            return []
        rubrics = []
        for line in response.split('\n'):
            line = line.strip()
            if re.match(r'^\d+\.', line) and len(line) > 10:
                # Remove the number and dot at the beginning
                rubric = re.sub(r'^\d+\.\s*', '', line)
                rubrics.append(rubric)
        if len(rubrics) < 5:
            print(f"Warning: Only {len(rubrics)} rubrics generated, expected 15-20")
        return rubrics


    def score_rubrics(self, question: str, llm_response: str, rubrics: List[str]) -> Dict[str, int]:
        """Fixed: Removed gold_answer parameter to match method signature"""
        rubrics_prompt = "\n".join([f'- criterion {i+1}: {rubric}' for i, rubric in enumerate(rubrics)])
        rubric_key_map = {f"criterion {i+1}": rubric for i, rubric in enumerate(rubrics)}
        prompt = f"""You are an expert evaluator assessing AI-generated medical responses against specific quality criteria.

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
        response = self.call_llm(prompt, max_tokens=600, temperature=0.1)
        if not response:
            return {}
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                raw_scores = json.loads(json_str)
                mapped_scores = {rubric_key_map[k]: v for k, v in raw_scores.items() if k in rubric_key_map}
                if len(mapped_scores) != len(rubrics):
                    print(f"Warning: Only {len(mapped_scores)}/{len(rubrics)} rubrics were scored")  
                return mapped_scores
            else:
                return {}
        except json.JSONDecodeError as e:
            print(f"JSON decode error in rubric scoring: {e}")
            return {}


    def classify_rubrics_to_axes(self, rubrics: List[str]) -> Dict[str, List[str]]:
        """Enhanced rubric classification with validation"""
        axes_desc = "\n".join([f"{axis}: {desc}" for axis, desc in self.axis_descriptions.items()])
        rubrics_text = "\n".join([f"- {rubric}" for rubric in rubrics])
        
        prompt = f"""You are given a set of evaluation rubrics and a list of predefined axes. 
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

        response = self.call_llm(prompt, max_tokens=800, temperature=0.1)
        if not response:
            return {}
        try:
            json_start, json_end = response.find('{'), response.rfind('}') + 1
            classification = json.loads(response[json_start:json_end])
            final_classification = {axis: classification.get(axis, []) for axis in self.selected_axes}
            classified_rubrics = [rubric for rubric_list in final_classification.values() for rubric in rubric_list]
            missing_rubrics = [r for r in rubrics if r not in classified_rubrics]
            if missing_rubrics:
                print(f"Warning: {len(missing_rubrics)} rubrics were not classified: {missing_rubrics[:3]}...")
            return final_classification
        except json.JSONDecodeError as e:
            print(f"JSON decode error in rubric classification: {e}")
            return {}


    def calculate_axis_scores(self, rubric_scores: Dict[str, int], classification: Dict[str, List[str]]) -> Dict[str, float]:
        """Enhanced axis score calculation with validation"""
        axis_scores = {}
        for axis, rubrics in classification.items():
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
        """Fixed main evaluation loop with proper data alignment"""
        medical_scores = []
        detailed_rows = []
        
        print(f"Processing {len(self.df)} rows...")
        
        for idx, row in self.df.iterrows():
            question, gold_answer, llm_response = row['Questions'], row['Answer'], row['llm_response']
            
            # Progress tracking
            if idx % 10 == 0:
                print(f"Processing row {idx}/{len(self.df)}")
            
            # Generate rubrics
            rubrics = self.generate_rubrics(question, gold_answer)
            if not rubrics:
                print(f"Warning: No rubrics generated for row {idx}")
                medical_scores.append(0.0)  # Handle failed cases
                continue
            
            # Fixed: Remove gold_answer parameter
            rubric_scores = self.score_rubrics(question, llm_response, rubrics)
            if not rubric_scores:
                print(f"Warning: No rubric scores generated for row {idx}")
                medical_scores.append(0.0)  # Handle failed cases
                continue
            
            # Classify rubrics to axes
            classification = self.classify_rubrics_to_axes(rubrics)
            if not any(classification.values()):
                print(f"Warning: No rubric classification for row {idx}")
                medical_scores.append(0.0)  # Handle failed cases
                continue
            
            # Calculate scores
            axis_scores = self.calculate_axis_scores(rubric_scores, classification)
            medical_score = self.calculate_medical_quality_score(axis_scores)
            
            medical_scores.append(medical_score)
            detailed_rows.append({
                'question': question,
                'gold_standard_answer': gold_answer,
                'llm_response': llm_response,
                'rubrics': rubrics,
                'rubric_scores': rubric_scores,
                'classification': classification,
                'axis_scores': axis_scores,
                'medical_quality_score': medical_score
            })
        
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
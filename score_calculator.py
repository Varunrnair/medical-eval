import cohere
import re
from typing import Dict, List
import time
import random

class ScoreCalculator:
    def __init__(self, api_key):
        self.client = cohere.Client(api_key)
        self.model = "c4ai-aya-expanse-32b"
        
        # HealthBench axis weights
        self.axis_weights = {
            'Completeness': 0.39,
            'Accuracy': 0.33,
            'Context Awareness': 0.16,
            'Communication Quality': 0.08,
            'Instruction Following': 0.04
        }
        
        # Map rubric types to axes
        self.rubric_to_axis_mapping = {
            'medical accuracy': 'Accuracy',
            'factual': 'Accuracy',
            'correct': 'Accuracy',
            'dangerous': 'Accuracy',
            'complete': 'Completeness',
            'addresses': 'Completeness',
            'mentions': 'Completeness',
            'scope': 'Completeness',
            'pregnancy': 'Context Awareness',
            'relevant': 'Context Awareness',
            'appropriate': 'Context Awareness',
            'clear': 'Communication Quality',
            'simple': 'Communication Quality',
            'language': 'Communication Quality',
            'consult': 'Instruction Following',
            'advises': 'Instruction Following',
            'instructions': 'Instruction Following'
        }
    
    def calculate_scores(self, question, ideal_answer, llm_answer, rubrics):
        """Calculate comprehensive scores for the LLM answer"""
        
        # Step 1: Evaluate rubrics
        rubric_scores = self._evaluate_rubrics(llm_answer, rubrics)
        
        # Step 2: Map to axes
        axis_scores = self._calculate_axis_scores(rubric_scores, rubrics)
        
        # Step 3: Calculate final medical quality score
        medical_quality_score = self._calculate_medical_quality_score(axis_scores)
        
        # Step 4: Calculate semantic similarity (simplified)
        semantic_score = self._calculate_semantic_similarity(ideal_answer, llm_answer)
        
        # Step 5: Calculate final weighted score
        final_score = (
            0.40 * semantic_score +
            0.10 * 0.5 +  # Simplified lexical overlap
            0.50 * medical_quality_score
        )
        
        return {
            'rubric_scores': rubric_scores,
            'axis_scores': axis_scores,
            'medical_quality_score': medical_quality_score,
            'semantic_score': semantic_score,
            'final_score': final_score
        }
    
    def _evaluate_rubrics(self, llm_answer, rubrics):
        """Evaluate each rubric against the LLM answer"""
        scores = {}
        
        print(f"📋 Evaluating {len(rubrics)} rubrics (with rate limiting)...")
        
        for i, rubric in enumerate(rubrics):
            # Add delay between API calls to respect rate limits
            if i > 0:  # Don't wait before the first call
                wait_time = random.uniform(6, 8)  # Random wait between 6-8 seconds
                print(f"⏳ Waiting {wait_time:.1f}s before evaluating rubric {i+1}...")
                time.sleep(wait_time)
            
            prompt = f"""Evaluate if the following answer meets this specific criterion:

Criterion: {rubric['description']}
Points: {rubric['points']}

Answer to evaluate: "{llm_answer}"

Does this answer meet the criterion? Respond with only "YES" or "NO" and provide a brief explanation.

Response:"""

            try:
                print(f"🔍 Evaluating rubric {i+1}/{len(rubrics)}: {rubric['description'][:50]}...")
                
                response = self.client.chat(
                    model=self.model,
                    message=prompt,
                    temperature=0.1
                )
                
                evaluation = response.text.strip().upper()
                met = "YES" in evaluation
                
                scores[f"rubric_{i}"] = {
                    'met': met,
                    'points': rubric['points'] if met else 0,
                    'max_points': abs(rubric['points']),
                    'description': rubric['description'],
                    'evaluation': evaluation
                }
                
                print(f"✅ Rubric {i+1} evaluated: {'MET' if met else 'NOT MET'}")
                
            except Exception as e:
                print(f"❌ Error evaluating rubric {i+1}: {e}")
                scores[f"rubric_{i}"] = {
                    'met': False,
                    'points': 0,
                    'max_points': abs(rubric['points']),
                    'description': rubric['description'],
                    'evaluation': 'Error in evaluation'
                }
        
        return scores
    
    def _calculate_axis_scores(self, rubric_scores, rubrics):
        """Map rubric scores to the five axes"""
        axis_totals = {axis: {'earned': 0, 'max': 0} for axis in self.axis_weights.keys()}
        
        for i, (rubric_key, score) in enumerate(rubric_scores.items()):
            # Determine which axis this rubric belongs to
            axis = self._map_rubric_to_axis(rubrics[i]['description'])
            
            axis_totals[axis]['earned'] += score['points']
            axis_totals[axis]['max'] += score['max_points']
        
        # Calculate normalized scores (0-1)
        axis_scores = {}
        for axis, totals in axis_totals.items():
            if totals['max'] > 0:
                # Handle negative scores properly
                raw_score = totals['earned'] / totals['max']
                axis_scores[axis] = max(0, min(1, (raw_score + 1) / 2))  # Normalize to 0-1
            else:
                axis_scores[axis] = 0.5  # Default neutral score
        
        return axis_scores
    
    def _map_rubric_to_axis(self, description):
        """Map a rubric description to an axis"""
        description_lower = description.lower()
        
        for keyword, axis in self.rubric_to_axis_mapping.items():
            if keyword in description_lower:
                return axis
        
        # Default mapping
        return 'Completeness'
    
    def _calculate_medical_quality_score(self, axis_scores):
        """Calculate weighted medical quality score"""
        total_score = 0
        for axis, weight in self.axis_weights.items():
            total_score += axis_scores.get(axis, 0) * weight
        
        return total_score
    
    def _calculate_semantic_similarity(self, ideal_answer, llm_answer):
        """Simplified semantic similarity calculation"""
        # This is a simplified version - in practice you'd use BERTScore or similar
        ideal_words = set(ideal_answer.lower().split())
        llm_words = set(llm_answer.lower().split())
        
        if not ideal_words:
            return 0
        
        intersection = ideal_words.intersection(llm_words)
        union = ideal_words.union(llm_words)
        
        return len(intersection) / len(union) if union else 0

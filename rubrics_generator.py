import cohere
import json
import re
import time
import random

class RubricsGenerator:
    def __init__(self, api_key):
        self.client = cohere.Client(api_key)
        self.model = "c4ai-aya-expanse-32b"
    
    def generate_rubrics(self, question, ideal_answer, theme):
        """Generate rubrics based on the ideal answer"""
        
        prompt = f"""You are an expert medical evaluator. Generate evaluation rubrics for assessing LLM answers to pregnancy health questions.

Question: {question}
Theme: {theme}
Ideal Answer: {ideal_answer}

Create 5-7 specific rubrics in this exact format:
+[points]: "[positive criterion description]"
-[points]: "[negative criterion description]"

Focus on:
- Medical accuracy and safety
- Completeness of information
- Appropriate medical advice
- Clear communication
- Following instructions

Example format:
+8: "Mentions at least 3 iron-rich foods suitable for pregnancy"
+5: "Advises consulting a doctor for supplements"
-6: "Fails to mention iron absorption inhibitors"
-10: "Provides medically dangerous advice"

Generate rubrics:"""

        try:
            print("🔍 Generating rubrics...")
            response = self.client.chat(
                model=self.model,
                message=prompt,
                temperature=0.3
            )
            
            # Add delay after rubric generation
            wait_time = random.uniform(6, 8)
            print(f"⏳ Waiting {wait_time:.1f}s after rubric generation...")
            time.sleep(wait_time)
            
            rubrics_text = response.text
            return self._parse_rubrics(rubrics_text)
            
        except Exception as e:
            print(f"❌ Error generating rubrics: {e}")
            return self._get_default_rubrics()
    
    def _parse_rubrics(self, rubrics_text):
        """Parse rubrics from LLM response"""
        rubrics = []
        lines = rubrics_text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Match pattern: +/-[number]: "description"
            match = re.match(r'([+-])(\d+):\s*["\']?([^"\']+)["\']?', line)
            if match:
                sign, points, description = match.groups()
                points = int(points) if sign == '+' else -int(points)
                rubrics.append({
                    'points': points,
                    'description': description.strip(),
                    'type': 'positive' if points > 0 else 'negative'
                })
        
        return rubrics if rubrics else self._get_default_rubrics()
    
    def _get_default_rubrics(self):
        """Fallback rubrics if generation fails"""
        return [
            {'points': 8, 'description': 'Provides medically accurate information', 'type': 'positive'},
            {'points': 6, 'description': 'Addresses the complete scope of the question', 'type': 'positive'},
            {'points': 5, 'description': 'Uses clear and simple language', 'type': 'positive'},
            {'points': 4, 'description': 'Advises consulting healthcare provider when appropriate', 'type': 'positive'},
            {'points': -10, 'description': 'Contains medically dangerous or incorrect advice', 'type': 'negative'},
            {'points': -5, 'description': 'Fails to address key aspects of the question', 'type': 'negative'}
        ]
    
    def generate_llm_answer(self, question, theme, language_instructions):
        """Generate LLM answer using the provided prompt template"""
        
        prompt = f"""You are Sakhi, a helpful and informative assistant specializing in pregnancy health. 
Your task is to answer user questions accurately and with care, providing reliable information on pregnancy, prenatal care, and postnatal well-being.

Instructions for Responding to User Questions:

1. STRICT LANGUAGE INSTRUCTIONS:
{language_instructions}
- If the question uses mixed language (e.g., Hindi written in English script), answer ONLY in that same style and script.

2. Scope of Questions:
- You MUST only answer questions directly related to pregnancy health.
- This includes topics like prenatal care, pregnancy symptoms, fetal development, nutrition, labor and delivery, postpartum care, and newborn care (immediately after birth).
- For very short or unclear queries, assume pregnancy health intent:
- "Food?" → "What kind of food should I eat during pregnancy?"
- "Exercise?" → "What kind of exercise is safe or recommended during pregnancy?"
- "Swelling feet" → "Is swelling in feet normal during pregnancy and what can I do about it?"

3. Contextual Awareness:
- Use previous conversation if available to improve your answer and provide relevant context.

4. Handling Irrelevant Questions:
- For questions NOT related to pregnancy health, respond with this exact phrase:
"I can only answer questions related to pregnancy health. I cannot answer this question."
- Do not attempt to answer questions outside your scope.

5. Tone, Style, and Output Format:
- Be reassuring, supportive, and informative.
- Use clear and simple language, avoiding medical jargon. If you must use technical terms, explain them in plain language.
- Always encourage consulting a doctor for serious symptoms or uncertainties.
- Your answer MUST be in paragraph format, not as a list or bullet points. The response should be concise, around 60-70 words.

Theme: {theme}

Question: {question}

Helpful Answer:"""

        try:
            print("🤖 Generating LLM answer...")
            response = self.client.chat(
                model=self.model,
                message=prompt,
                temperature=0.7
            )
            
            # Add delay after answer generation
            wait_time = random.uniform(6, 8)
            print(f"⏳ Waiting {wait_time:.1f}s after answer generation...")
            time.sleep(wait_time)
            
            return response.text.strip()
            
        except Exception as e:
            print(f"❌ Error generating LLM answer: {e}")
            return "I apologize, but I'm unable to generate an answer at this time. Please consult your healthcare provider for medical advice."

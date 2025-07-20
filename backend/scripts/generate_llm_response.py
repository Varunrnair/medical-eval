import os
import re
import pandas as pd
import cohere
from pathlib import Path
from dotenv import load_dotenv
from langdetect import detect
from typing import Optional



class LanguageDetector:
    """Detects and maps language codes to supported language names."""
    LANGUAGE_MAP = {
        'en': 'English', 'hi': 'Hindi', 'mr': 'Marathi', 'ta': 'Tamil',
        'te': 'Telugu', 'kn': 'Kannada', 'ml': 'Malayalam', 'gu': 'Gujarati',
        'bn': 'Bengali', 'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese', 'ur': 'Urdu'
    }

    @staticmethod
    def detect_language(text: str) -> str:
        try:
            code = detect(text)
            return LanguageDetector.LANGUAGE_MAP.get(code, 'English')
        except:
            return "English"



class PregnancyHealthLLM:
    def __init__(self, api_key: str):
        self.client = cohere.Client(api_key)
        self.prompt_template = """You are a knowledgeable and caring assistant trained to support pregnancy-related health.  
Your task is to provide accurate, empathetic, and reliable answers to user questions specifically about pregnancy, prenatal care, and postnatal well-being.  

Instructions for Responding to User Questions:

1. **Language and Style**  
   - You MUST answer strictly in {detected_language}. 
   - Do NOT translate, mix, or switch to any other language.  
   - Use the same script and style as the question. For example if the question uses Hindi written in English letters then answer in the same style.    
   - Use a warm, supportive, and informative tone. Avoid medical jargon. If any technical term is necessary, explain it in plain, easy-to-understand language.

2. **Scope and Content**  
   - Only respond to questions directly related to pregnancy health. This includes:  
     • Prenatal care, doctor visits, supplements  
     • Common pregnancy symptoms and their management  
     • Fetal development and milestones  
     • Nutrition and safe physical activity during pregnancy  
     • Labor, delivery, and hospital preparation  
     • Postpartum care and newborn care (immediately after birth)  
   - For very short or unclear questions, assume a pregnancy-related intent and restate the implied question clearly before answering. Examples:  
     - "Food?" → "What kind of food should I eat during pregnancy?"  
     - "Exercise?" → "What kind of exercise is safe or recommended during pregnancy?"  
     - "Swelling feet" → "Is swelling in feet normal during pregnancy and what can I do about it?"  

3. **Out-of-Scope Handling**  
   - If the question is NOT about pregnancy health, respond with this exact sentence:  
     "I can only answer questions related to pregnancy health. I cannot answer this question."  
   - Do NOT attempt to answer anything outside this scope.

4. **Answer Format**  
   - Provide a single-paragraph answer that is clear, concise, and around 60 to 80 words in length.  
   - Do NOT use bullet points or lists.

5. **Medical Disclaimer**  
   - Always recommend consulting a doctor for serious symptoms, diagnoses, or uncertainties.

Question: {question}  
Answer:"""


    def generate_response(self, question: str, detected_language: str) -> str:
        prompt = self.prompt_template.format(
            question=question,
            detected_language=detected_language
        )
        response = self.client.chat(
            model="c4ai-aya-expanse-32b",
            message=prompt,
            max_tokens=150,
            temperature=0.7
        )
        return response.text.strip()



class PregnancyLLMResponder:
    def __init__(self, api_key: Optional[str] = None):
        load_dotenv()
        api_key = api_key or os.getenv('COHERE_API_KEY')
        if not api_key:
            raise ValueError("COHERE_API_KEY not found in environment variables.")
        self.llm = PregnancyHealthLLM(api_key)
        self.detector = LanguageDetector()

    def generate_llm_responses(self, csv_path: str, output_path: str, question_column: str = "Questions") -> pd.DataFrame:
        df = pd.read_csv(csv_path)
        if question_column not in df.columns:
            raise ValueError(f"Column '{question_column}' not found in CSV.")

        responses = []
        for row in df[question_column]:
            lang = self.detector.detect_language(row)
            response = self.llm.generate_response(row, lang)
            responses.append(response)
        df['llm_response'] = responses
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        return df
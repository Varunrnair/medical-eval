#  Generating the llm response using llama  and then medical quality using gpt 4o mini

import os
import re
import pandas as pd
import cohere
# from openai import OpenAI 
# from together import Together
from pathlib import Path
from dotenv import load_dotenv
from langdetect import detect
from typing import Optional
from config import model_name 



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



# class PregnancyHealthLLM:
#     def __init__(self, api_key: str):
#         self.client = cohere.Client(api_key)
#         # self.client = OpenAI(api_key=api_key)
#         # self.client = Together(api_key=api_key)
#         self.prompt_template = """You are a knowledgeable and caring assistant trained to support pregnancy-related health.  
# Your task is to provide accurate, empathetic, and reliable answers to user questions specifically about pregnancy, prenatal care, and postnatal well-being.  

# Instructions for Responding to User Questions:

# 1. **Language and Style**  
#    - You MUST answer strictly in {detected_language}.  
#    - Do NOT translate, mix, or switch to any other language.  
#    - Use the same script and style as the question. For example, if the question uses Hindi written in English letters, then answer in the same style.  
#    - Use a warm, supportive, and informative tone. Avoid medical jargon. If any technical term is necessary, explain it in plain, easy-to-understand language.  

# 2. **Scope and Content**  
#    - Respond to questions related to women’s health, including but not limited to:  
#      • Pregnancy, prenatal care, and postnatal well-being  
#      • Reproductive health and contraception  
#      • Sexual health and wellness  
#      • Menstrual health and disorders  
#      • Common gynecological conditions  
#      • Nutrition, mental health, and general wellness unique to women  
#    - For very short or unclear questions, assume a pregnancy-related intent and restate the implied question clearly before answering. Examples:  
#      - "Food?" → "What kind of food should I eat during pregnancy?"  
#      - "Exercise?" → "What kind of exercise is safe or recommended during pregnancy?"  
#      - "Swelling feet" → "Is swelling in feet normal during pregnancy and what can I do about it?"  

# 3. **Out-of-Scope Handling**  
#    - If the question is clearly unrelated to women’s health, respond with this exact sentence:  
#      "I can only answer questions related to women’s health. I cannot answer this question."  
#    - Do NOT attempt to answer anything outside this scope.  

# 4. **Answer Format**  
#    - Provide a single-paragraph answer that is clear, concise, and around 60 to 80 words in length.  
#    - Do NOT use bullet points or lists.  

# 5. **Medical Disclaimer**  
#    - Always recommend consulting a doctor for serious symptoms, diagnoses, or uncertainties.  

# 6. **Patient Context** (use this information to tailor your response):  
#    - Condition: {condition}  
#    - Symptoms: {symptoms}  
#    - Past Medical History: {past_medical_history}  
#    - Past Surgical History: {past_surgical_history}  
#    - Past Social History: {past_social_history}  

# Question: {question}  
# Answer:
# """

#     def generate_response(self, row: dict, detected_language: str) -> str:
#         prompt = self.prompt_template.format(
#             condition=row.get("Condition", "Not specified"),
#             symptoms=row.get("Symptoms", "Not specified"),
#             past_medical_history=row.get("Past Medical History", "None"),
#             past_surgical_history=row.get("Past Surgical History", "None"),
#             past_social_history=row.get("Past Social History", "None"),
#             question=row["Questions"],
#             detected_language=detected_language
#         )
        
#         # --- Cohere API call (commented out) ---
#         response = self.client.chat(
#             model=model_name,
#             message=prompt,
#             max_tokens=150,
#             temperature=0.7
#         )
#         return response.text.strip()
        
#         # --- OpenAI API call (added) ---
#         # response = self.client.chat.completions.create(
#         #     model=model_name,
#         #     messages=[{"role": "user", "content": prompt}],
#         #     max_tokens=150,
#         #     temperature=0.7
#         # )
#         # return response.choices[0].message.content.strip()
#         # try:
#         #     response = self.client.chat.completions.create(
#         #         model="meta-llama/Llama-3.3-70B-Instruct-Turbo",                         
#         #         messages=[
#         #             {"role": "user", "content": prompt}
#         #         ],
#         #         max_tokens=150,
#         #         temperature=0.7
#         #     )
#         #     # keep compatibility with OpenAI-like response shape
#         #     text = response.choices[0].message.content if hasattr(response, "choices") else getattr(response, "text", None)
#         #     if text is None:
#         #         # some Together SDKs return plain text in response['text']
#         #         text = response.get("text") if isinstance(response, dict) else str(response)
#         #     return text.strip()
#         # except Exception as e:
#         #     # raise or return a helpful message — raising is better for batch processing to know failures
#         #     raise RuntimeError(f"Together API request failed: {e}")



class PregnancyHealthLLM:
    def __init__(self, api_key: str):
        self.client = cohere.Client(api_key)
        # self.client = OpenAI(api_key=api_key)
        # self.client = Together(api_key=api_key)
        self.prompt_template = """You are a knowledgeable and caring assistant trained to support pregnancy-related health.  
Your task is to provide accurate, empathetic, and reliable answers to user questions specifically about pregnancy, prenatal care, and postnatal well-being.  

Instructions for Responding to User Questions:

1. **Language and Style**  
   - You MUST answer strictly in {detected_language}.  
   - Do NOT translate, mix, or switch to any other language.  
   - Use the same script and style as the question. For example, if the question uses Hindi written in English letters, then answer in the same style.  
   - Use a warm, supportive, and informative tone. Avoid medical jargon. If any technical term is necessary, explain it in plain, easy-to-understand language.  

2. **Scope and Content**  
   - Respond to questions related to women’s health, including but not limited to:  
     • Pregnancy, prenatal care, and postnatal well-being  
     • Reproductive health and contraception  
     • Sexual health and wellness  
     • Menstrual health and disorders  
     • Common gynecological conditions  
     • Nutrition, mental health, and general wellness unique to women  
   - For very short or unclear questions, assume a pregnancy-related intent and restate the implied question clearly before answering. Examples:  
     - "Food?" → "What kind of food should I eat during pregnancy?"  
     - "Exercise?" → "What kind of exercise is safe or recommended during pregnancy?"  
     - "Swelling feet" → "Is swelling in feet normal during pregnancy and what can I do about it?"  

3. **Out-of-Scope Handling**  
   - If the question is clearly unrelated to women’s health, respond with this exact sentence:  
     "I can only answer questions related to women’s health. I cannot answer this question."  
   - Do NOT attempt to answer anything outside this scope.  

4. **Answer Format**  
   - Provide a single-paragraph answer that is clear, concise, and around 60 to 80 words in length.  
   - Do NOT use bullet points or lists.  

5. **Medical Disclaimer**  
   - Always recommend consulting a doctor for serious symptoms, diagnoses, or uncertainties.  

6. **Patient History Summary: {user_history} 

Question: {question}  
Answer:
"""

    def generate_response(self, row: dict, detected_language: str) -> str:
        prompt = self.prompt_template.format(
            user_history=row.get("User History", "No history provided"),
            question=row["Questions"],
            detected_language=detected_language
        )
        
        # --- Cohere API call ---
        response = self.client.chat(
            model=model_name,
            message=prompt,
            max_tokens=150,
            temperature=0.7
        )
        return response.text.strip()
        
        # --- OpenAI API call (added) ---
        # response = self.client.chat.completions.create(
        #     model=model_name,
        #     messages=[{"role": "user", "content": prompt}],
        #     max_tokens=150,
        #     temperature=0.7
        # )
        # return response.choices[0].message.content.strip()
        # try:
        #     response = self.client.chat.completions.create(
        #         model="meta-llama/Llama-3.3-70B-Instruct-Turbo",                         
        #         messages=[
        #             {"role": "user", "content": prompt}
        #         ],
        #         max_tokens=150,
        #         temperature=0.7
        #     )
        #     # keep compatibility with OpenAI-like response shape
        #     text = response.choices[0].message.content if hasattr(response, "choices") else getattr(response, "text", None)
        #     if text is None:
        #         # some Together SDKs return plain text in response['text']
        #         text = response.get("text") if isinstance(response, dict) else str(response)
        #     return text.strip()
        # except Exception as e:
        #     # raise or return a helpful message — raising is better for batch processing to know failures
        #     raise RuntimeError(f"Together API request failed: {e}")



class PregnancyLLMResponder:
    def __init__(self, api_key: Optional[str] = None):
        load_dotenv()
        api_key = api_key or os.getenv('COHERE_API_KEY')
        # api_key = api_key or os.getenv('TOGETHER_API_KEY')
        # api_key = api_key or os.getenv('OPEN_API_KEY')
        if not api_key:
            # Updated error message
            raise ValueError("COHERE_API_KEY not found in environment variables.")
        self.llm = PregnancyHealthLLM(api_key)
        self.detector = LanguageDetector()

    def generate_llm_responses(self, csv_path: str, output_path: str, question_column: str = "Questions") -> pd.DataFrame:
        df = pd.read_csv(csv_path)
        if question_column not in df.columns:
            raise ValueError(f"Column '{question_column}' not found in CSV.")

        responses = []
        for _, row in df.iterrows():
            question = row[question_column]
            lang = self.detector.detect_language(question)
            response = self.llm.generate_response(row, lang)
            responses.append(response)

        df['llm_response'] = responses
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        return df
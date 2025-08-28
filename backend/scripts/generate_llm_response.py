import os
import re
import pandas as pd
import cohere
from openai import OpenAI 
from together import Together
from google import genai
from google.genai import types
from pathlib import Path
from dotenv import load_dotenv
from langdetect import detect
from typing import Optional
from config import model_name as DEFAULT_MODEL_NAME
from prompts import *
PROMPT_MAP = {
    "sakhi": SAKHI_PROMPT,
    "user_history1": USER_HISTORY1_PROMPT,
    "user_history2": USER_HISTORY2_PROMPT,
    "test1": TEST1_PROMPT,
    "test2": TEST2_PROMPT
}



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
    def __init__(self, api_key: str, model_name: str, prompt_type: str = "user_history1"):
        if not model_name:
            raise ValueError("model_name must be provided to initialize PregnancyHealthLLM.")
        self.model_name = model_name
        self.prompt_type = prompt_type
        model_lower = model_name.lower()
        if "gpt" in model_lower or "o1" in model_lower:
            self.provider = "openai"
            self.client = OpenAI(api_key=api_key)
        elif "c4ai-aya-expanse-32b" in model_lower or "command-a-03-2025" in model_lower:
            self.provider = "cohere"
            self.client = cohere.Client(api_key=api_key)
        elif "llama" in model_lower or "together" in model_lower:
            self.provider = "together"
            self.client = Together(api_key=api_key)
            if not self.model_name.startswith("meta-llama/"):
                self.together_model_name = f"meta-llama/{self.model_name}"
            else:
                self.together_model_name = self.model_name
        elif "gemini" in model_lower:
            self.provider = "gemini"
            self.client = genai.Client(api_key=api_key)
        else:
            raise ValueError(f"Unsupported model name: {model_name}")
        self.prompt_template = USER_HISTORY1_PROMPT


    def generate_response(self, row: dict, detected_language: str) -> str:
        if self.prompt_type == "test1":
            prompt = self.prompt_template.format(
                user_history=row.get("User History", "No history provided"),
                question=row["Questions"],
                detected_language=detected_language
            )
        elif self.prompt_type == "test2":
            prompt = self.prompt_template.format(
                condition=row.get("Condition", "Not specified"),
                symptoms=row.get("Symptoms", "Not specified"),
                past_medical_history=row.get("Past Medical History", "None"),
                past_surgical_history=row.get("Past Surgical History", "None"),
                past_social_history=row.get("Past Social History", "None"),
                question=row["Questions"],
                detected_language=detected_language
            )
        else:
            prompt = self.prompt_template.format(
                question=row["Questions"],
                detected_language=detected_language
            )

        # if self.provider == "openai":
        #     response = self.client.chat.completions.create(
        #         model=self.model_name,
        #         messages=[{"role": "user", "content": prompt}],
        #         max_tokens=150,
        #         temperature=0.7
        #     )
        #     return response.choices[0].message.content.strip()

        if self.provider == "openai":
            if any(m in self.model_name for m in ["gpt-5", "gpt-4.1", "gpt-4o"]):
                try:
                    response = self.client.responses.create(
                        model=self.model_name,
                        input=prompt,
                        text={"verbosity": "low"},  # Optional: control response length
                        reasoning={"effort": "low"}  # Optional: control reasoning effort
                    )
                    
                    # Handle the response structure correctly
                    if hasattr(response, "output_text") and response.output_text:
                        return response.output_text.strip()
                    elif hasattr(response, "output") and response.output:
                        # Handle case where output is a list of response items
                        if isinstance(response.output, list) and len(response.output) > 0:
                            first_item = response.output[0]
                            if hasattr(first_item, 'text'):
                                return first_item.text.strip()
                            elif hasattr(first_item, 'content') and isinstance(first_item.content, list):
                                # Handle nested content structure
                                for content_item in first_item.content:
                                    if hasattr(content_item, 'text'):
                                        return content_item.text.strip()
                        return str(response.output).strip()
                    else:
                        return "⚠️ No text returned from GPT-5"
                        
                except Exception as e:
                    print(f"GPT-5 API error: {e}")
                    return f"⚠️ API Error: {str(e)}"
            else:
                # Use traditional chat completions for older GPT models
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=150,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()

        elif self.provider == "cohere":
            response = self.client.chat(
                model=self.model_name,
                message=prompt,
                max_tokens=150,
                temperature=0.7
            )
            return response.text.strip()

        elif self.provider == "together":
            response = self.client.chat.completions.create(
                model=self.together_model_name,  
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.7
            )
            if hasattr(response, "choices"):
                return response.choices[0].message.content.strip()
            elif hasattr(response, "text"):
                return response.text.strip()
            elif isinstance(response, dict) and "text" in response:
                return response["text"].strip()
            return str(response).strip()

        elif self.provider == "gemini":
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0)  # optional
                )
            )
            return response.text.strip()
        
        return "No response generated."


class PregnancyLLMResponder:
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        load_dotenv()
        self.model_name = (model_name or DEFAULT_MODEL_NAME)
        if not self.model_name:
            raise ValueError("No model_name provided and DEFAULT_MODEL_NAME is not set.")
        model_name_lower = self.model_name.lower()

        if api_key:
            chosen_key = api_key
        elif "gpt" in model_name_lower or "o1" in model_name_lower:
            chosen_key = os.getenv("OPENAI_API_KEY")
        elif "c4ai-aya-expanse-32b" in model_name_lower or "command-a-03-2025" in model_name_lower or "cohere" in model_name_lower:
            chosen_key = os.getenv("COHERE_API_KEY")
        elif "llama" in model_name_lower or "together" in model_name_lower:
            chosen_key = os.getenv("TOGETHER_API_KEY")
        elif "gemini" in model_name_lower:
            chosen_key = os.getenv("GEMINI_API_KEY")
        else:
            chosen_key = (
                os.getenv("OPENAI_API_KEY") or os.getenv("COHERE_API_KEY") or os.getenv("TOGETHER_API_KEY") or os.getenv("GEMINI_API_KEY") )
        if not chosen_key:
            raise ValueError("No valid API key found in environment variables for the requested model.")
        self.llm = PregnancyHealthLLM(chosen_key, self.model_name)
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
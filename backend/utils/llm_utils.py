import openai
import time
from typing import Optional, List
from config import OPENAI_API_KEY, JUDGE_MODEL, MAX_TOKENS, TEMPERATURE, ANSWER_GENERATION_PROMPT

# Initialize OpenAI client
openai.api_key = OPENAI_API_KEY

def call_judge_model(prompt: str, max_tokens: int = MAX_TOKENS, 
               temperature: float = TEMPERATURE, max_retries: int = 3) -> Optional[str]:
    """Make API call to GPT-3.5 with retry logic."""
    
    for attempt in range(max_retries):
        try:
            response = openai.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].message.content.strip()
        
        except openai.RateLimitError:
            wait_time = (2 ** attempt) * 5  # Exponential backoff
            print(f"Rate limit hit, waiting {wait_time} seconds...")
            time.sleep(wait_time)
        
        except openai.APIError as e:
            print(f"API error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
        
        except Exception as e:
            print(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
    
    print(f"Failed to get response after {max_retries} attempts")
    return None

def generate_model_answer(question: str) -> str:
    """Generate model answer for a given question using GPT-3.5."""
    prompt = ANSWER_GENERATION_PROMPT.format(question=question)
    
    response = call_judge_model(prompt, max_tokens=500, temperature=0.3)
    
    if response:
        return response
    else:
        return f"Unable to generate answer for: {question}"

def batch_generate_answers(questions: List[str]) -> List[str]:
    """Generate model answers for a batch of questions."""
    answers = []
    
    for i, question in enumerate(questions):
        print(f"Generating answer {i+1}/{len(questions)}")
        answer = generate_model_answer(question)
        answers.append(answer)
        
        # Small delay to avoid rate limiting
        time.sleep(1)
    
    return answers

def test_api_connection() -> bool:
    """Test if OpenAI API is working."""
    try:
        response = call_judge_model("Hello, this is a test.", max_tokens=10)
        return response is not None
    except Exception as e:
        print(f"API connection test failed: {e}")
        return False

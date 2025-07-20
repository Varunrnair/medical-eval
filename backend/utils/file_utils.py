import pandas as pd
import json
import os
from typing import Dict, Any, List, Optional

def load_csv_dataset(file_path: str) -> pd.DataFrame:
    """Load CSV dataset with error handling."""
    try:
        df = pd.read_csv(file_path)
        print(f"Loaded dataset with {len(df)} rows and columns: {list(df.columns)}")
        return df
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return pd.DataFrame()

def save_results_to_json(results: Dict[str, Any], file_path: str) -> bool:
    """Save results dictionary to JSON file."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Results saved to {file_path}")
        return True
    
    except Exception as e:
        print(f"Error saving results: {e}")
        return False

def validate_dataset_format(df: pd.DataFrame, required_columns: List[str]) -> bool:
    """Validate that dataset has required columns."""
    if df.empty:
        print("Error: Dataset is empty")
        return False
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"Error: Missing required columns: {missing_columns}")
        print(f"Available columns: {list(df.columns)}")
        return False
    
    return True

def create_sample_dataset(file_path: str) -> bool:
    """Create a sample dataset for testing."""
    sample_data = {
        'question': [
            "What should I eat during pregnancy?",
            "Is it safe to exercise while pregnant?",
            "When should I start taking prenatal vitamins?",
            "What are the signs of preterm labor?",
            "How much weight should I gain during pregnancy?"
        ],
        'gold_answer': [
            "During pregnancy, focus on a balanced diet rich in fruits, vegetables, whole grains, lean proteins, and dairy. Take prenatal vitamins with folic acid, avoid raw or undercooked foods, limit caffeine, and stay hydrated. Consult your healthcare provider for personalized dietary guidance.",
            "Yes, moderate exercise is generally safe and beneficial during pregnancy. Activities like walking, swimming, and prenatal yoga are excellent choices. Avoid contact sports, activities with fall risk, and exercising on your back after the first trimester. Always consult your doctor before starting any exercise program.",
            "Start taking prenatal vitamins with folic acid at least one month before trying to conceive, or as soon as you learn you're pregnant. Folic acid helps prevent neural tube defects. Continue throughout pregnancy and while breastfeeding as recommended by your healthcare provider.",
            "Signs of preterm labor include regular contractions before 37 weeks, lower back pain, pelvic pressure, changes in vaginal discharge, and fluid leakage. Contact your healthcare provider immediately if you experience these symptoms, as early intervention can help prevent premature birth.",
            "Weight gain recommendations vary by pre-pregnancy BMI. Generally, normal weight women should gain 25-35 pounds, underweight women 28-40 pounds, and overweight women 15-25 pounds. Gradual, steady weight gain is ideal. Discuss your specific target with your healthcare provider."
        ]
    }
    
    try:
        df = pd.DataFrame(sample_data)
        df.to_csv(file_path, index=False)
        print(f"Sample dataset created at {file_path}")
        return True
    
    except Exception as e:
        print(f"Error creating sample dataset: {e}")
        return False

def append_model_answers_to_dataset(df: pd.DataFrame, model_answers: List[str]) -> pd.DataFrame:
    """Add model answers column to existing dataset."""
    df_copy = df.copy()
    df_copy['model_answer'] = model_answers
    return df_copy

def load_or_create_sample_dataset(file_path: str) -> pd.DataFrame:
    """Load dataset or create sample if it doesn't exist."""
    if os.path.exists(file_path):
        return load_csv_dataset(file_path)
    else:
        print(f"Dataset not found at {file_path}, creating sample dataset...")
        if create_sample_dataset(file_path):
            return load_csv_dataset(file_path)
        else:
            return pd.DataFrame()

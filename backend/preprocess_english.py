import re
import string
from typing import List, Optional



def clean_text(text: str) -> str:
    """Clean and normalize text for analysis."""
    if not text or not isinstance(text, str):
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Fix common punctuation issues
    text = re.sub(r'\s+([,.!?;:])', r'\1', text)
    text = re.sub(r'([,.!?;:])\s*([,.!?;:])', r'\1 \2', text)
    
    # Remove excessive punctuation
    text = re.sub(r'[!]{2,}', '!', text)
    text = re.sub(r'[?]{2,}', '?', text)
    text = re.sub(r'[.]{3,}', '...', text)
    
    return text



def extract_sentences(text: str) -> List[str]:
    """Extract sentences from text for analysis."""
    if not text:
        return []
    
    # Simple sentence splitting
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences

def remove_stopwords(text: str, custom_stopwords: Optional[List[str]] = None) -> str:
    """Remove common stopwords while preserving medical context."""
    if not text:
        return ""
    
    # Basic English stopwords relevant for medical text
    basic_stopwords = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'will', 'with', 'you', 'your'
    }
    
    if custom_stopwords:
        basic_stopwords.update(custom_stopwords)
    
    words = text.lower().split()
    filtered_words = [word for word in words if word not in basic_stopwords]
    
    return ' '.join(filtered_words)

def preprocess_for_similarity(text: str) -> str:
    """Preprocess text specifically for semantic similarity analysis."""
    if not text:
        return ""
    
    # Clean and normalize
    text = clean_text(text)
    
    # Remove punctuation but keep sentence structure
    text = text.translate(str.maketrans('', '', string.punctuation.replace('.', '')))
    
    return text

def preprocess_for_linguistic(text: str) -> str:
    """Preprocess text for linguistic quality analysis."""
    if not text:
        return ""
    
    # Minimal preprocessing to preserve linguistic features
    text = clean_text(text)
    
    # Only remove excessive whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    return text

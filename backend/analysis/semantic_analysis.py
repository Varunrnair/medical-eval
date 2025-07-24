import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from bert_score import score as bert_score
from langdetect import detect
import cohere
import os
from dotenv import load_dotenv
load_dotenv()

class SemanticAnalyzer:
    def __init__(self, dataset_path: str):
        self.models = {}
        self.model_configs = {
            'en': 'all-mpnet-base-v2',
            'hi': 'l3cube-pune/hindi-sentence-similarity-sbert',
            'mr': 'l3cube-pune/marathi-sentence-similarity-sbert'
        }
        self.vyakyarth_model = None
        self.cohere_client = None
        self.df = pd.read_csv(dataset_path)
        self.references = self.df["Answer"].fillna("").tolist()
        self.candidates = self.df["llm_response"].fillna("").tolist()

    
    def _get_model(self, lang: str) -> SentenceTransformer:
        """Get language-specific model."""
        if lang not in self.models:
            model_name = self.model_configs.get(lang, 'all-mpnet-base-v2')
            self.models[lang] = SentenceTransformer(model_name)
        return self.models[lang]
    
    
    def _get_vyakyarth_model(self) -> SentenceTransformer:
        """Get Vyakyarth model for multilingual support."""
        if self.vyakyarth_model is None:
            self.vyakyarth_model = SentenceTransformer('krutrim-ai-labs/Vyakyarth')
        return self.vyakyarth_model
    
    
    def _get_cohere_client(self):
        """Get Cohere client for multilingual embeddings."""
        if self.cohere_client is None:
            api_key = os.getenv('COHERE_API_KEY')
            if not api_key:
                raise ValueError("COHERE_API_KEY not found in environment variables")
            self.cohere_client = cohere.ClientV2(api_key=api_key)
        return self.cohere_client
    
    
    def _detect_language(self, text: str) -> str:
        """Detect language of text."""
        try:
            return detect(text)
        except:
            return 'en'
    
    
    def compute_cosine_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts using sentence embeddings."""
        if not text1 or not text2:
            return 0.0
        try:
            lang = self._detect_language(text1)
            model = self._get_model(lang)
            embeddings = model.encode([text1, text2])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return max(0.0, min(1.0, float(similarity)))
        except Exception as e:
            print(f"Error computing cosine similarity: {e}")
            return 0.0
    
    
    def compute_bert_score(self, reference: str, candidate: str) -> float:
        """Compute BERTScore between reference and candidate texts."""
        if not reference or not candidate:
            return 0.0
        try:
            lang = self._detect_language(reference)
            P, R, F1 = bert_score([candidate], [reference], lang=lang, verbose=False)
            return float(F1[0])
        except Exception as e:
            print(f"Error computing BERTScore: {e}")
            return 0.0
    
    
    def compute_vyakyarth_similarity(self, text1: str, text2: str) -> float:
        """Compute similarity using Vyakyarth model."""
        if not text1 or not text2:
            return 0.0
        try:
            model = self._get_vyakyarth_model()
            embeddings = model.encode([text1, text2])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return max(0.0, min(1.0, float(similarity)))
        except Exception as e:
            print(f"Error computing Vyakyarth similarity: {e}")
            return 0.0
    

    def compute_cohere_similarity(self, text1: str, text2: str) -> float:
        """Compute similarity using Cohere embed-multilingual-v3.0 model."""
        if not text1 or not text2:
            return 0.0
        try:
            client = self._get_cohere_client()

            text_inputs = [
                {"content": [{"type": "text", "text": text1}]},
                {"content": [{"type": "text", "text": text2}]}
            ]

            response = client.embed(
                inputs=text_inputs,
                model="embed-multilingual-v3.0",
                input_type="search_document",
                embedding_types=["float"]
            )

            embedding1 = np.array(response.embeddings.float[0])
            embedding2 = np.array(response.embeddings.float[1])

            similarity = cosine_similarity([embedding1], [embedding2])[0][0]
            return max(0.0, min(1.0, float(similarity)))

        except Exception as e:
            print(f"Error computing Cohere similarity: {e}")
            return 0.0


    def run_and_update_scores(self):
        cosine_sims = []
        vyakyarth_sims = []
        cohere_sims = []
        bert_f1s = []
        langs = []
        semantic_scores = []

        for ref, cand in zip(self.references, self.candidates):
            lang = self._detect_language(ref)
            langs.append(lang)
            
            cosine_sim = self.compute_cosine_similarity(ref, cand)
            vyakyarth_sim = self.compute_vyakyarth_similarity(ref, cand)
            cohere_sim = self.compute_cohere_similarity(ref, cand)
            bert_f1 = self.compute_bert_score(ref, cand)
            
            semantic_score = (cosine_sim + bert_f1 + cohere_sim) / 3.0

            cosine_sims.append(cosine_sim)
            vyakyarth_sims.append(vyakyarth_sim)
            cohere_sims.append(cohere_sim)
            bert_f1s.append(bert_f1)
            semantic_scores.append(semantic_score)

        self.df["language"] = langs
        self.df["cosine_similarity"] = cosine_sims
        self.df["vyakyarth_similarity"] = vyakyarth_sims
        self.df["cohere_similarity"] = cohere_sims
        self.df["bert_score_f1"] = bert_f1s
        self.df["semantic_similarity"] = semantic_scores
        print("Semantic Similarity complete. Files ready for saving.")


    def save_updated_dataset(self, output_path: str):
        self.df.to_csv(output_path, index=False)


    def save_summary_scores(self, summary_path: str):
        summary = {
            "avg_cosine_similarity": np.mean(self.df["cosine_similarity"]),
            "avg_bert_score_f1": np.mean(self.df["bert_score_f1"]),
            "avg_vyakyarth_similarity": np.mean(self.df["vyakyarth_similarity"]),
            "avg_cohere_similarity": np.mean(self.df["cohere_similarity"]),
            "avg_semantic_similarity": np.mean(self.df["semantic_similarity"]),
        }
        pd.DataFrame([summary]).to_csv(summary_path, index=False)

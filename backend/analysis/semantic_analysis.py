import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from bert_score import score as bert_score
from langdetect import detect



class SemanticAnalyzer:
    def __init__(self, dataset_path: str):
        self.models = {}
        self.model_configs = {
            'en': 'all-mpnet-base-v2',
            'hi': 'l3cube-pune/hindi-sentence-similarity-sbert',
            'mr': 'l3cube-pune/marathi-sentence-similarity-sbert'
        }
        self.vyakyarth_model = None
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
            # Compute cosine similarity
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
    

    def run_and_update_scores(self):
        cosine_sims = []
        vyakyarth_sims = []
        bert_f1s = []
        langs = []
        semantic_scores = []
        vyakyarth_semantic_scores = []

        for ref, cand in zip(self.references, self.candidates):
            lang = self._detect_language(ref)
            langs.append(lang)
            cosine_sim = self.compute_cosine_similarity(ref, cand)
            vyakyarth_sim = self.compute_vyakyarth_similarity(ref, cand)
            bert_f1 = self.compute_bert_score(ref, cand)
            semantic_score = (cosine_sim + bert_f1) / 2.0

            cosine_sims.append(cosine_sim)
            vyakyarth_sims.append(vyakyarth_sim)
            bert_f1s.append(bert_f1)
            semantic_scores.append(semantic_score)

        self.df["language"] = langs
        self.df["cosine_similarity"] = cosine_sims
        self.df["vyakyarth_similarity"] = vyakyarth_sims
        self.df["bert_score_f1"] = bert_f1s
        self.df["semantic_similarity"] = semantic_scores
        print("Semantic Similarity complete. Files saved.")


    def save_updated_dataset(self, output_path: str):
        self.df.to_csv(output_path, index=False)


    def save_summary_scores(self, summary_path: str):
        summary = {
            "avg_cosine_similarity": np.mean(self.df["cosine_similarity"]),
            "avg_bert_score_f1": np.mean(self.df["bert_score_f1"]),
            "avg_vyakyarth_similarity": np.mean(self.df["vyakyarth_similarity"]),
            "avg_semantic_similarity": np.mean(self.df["semantic_similarity"]),
            "avg_vyakyarth_semantic_score": np.mean(self.df["vyakyarth_semantic_score"])
        }
        pd.DataFrame([summary]).to_csv(summary_path, index=False)
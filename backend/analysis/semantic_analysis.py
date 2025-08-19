import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from langdetect import detect
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from bert_score import score as bert_score
import cohere
import voyageai
from openai import OpenAI
load_dotenv()



class SemanticAnalyzer:
    def __init__(self, dataset_path: str):
        self.df = pd.read_csv(dataset_path)
        self.references = self.df["Answer"].fillna("").tolist()
        self.responses = self.df["llm_response"].fillna("").tolist()
        self.models_by_lang = {}
        self.model_configs = {
            'en': 'all-mpnet-base-v2',
            'hi': 'l3cube-pune/hindi-sentence-similarity-sbert',
            'mr': 'l3cube-pune/marathi-sentence-similarity-sbert'
        }
        self.vyakyarth = None
        self.cohere = None
        self.voyage = None
        self.openai = None
        self.distiluse = None
        self.labse = None


    def _detect_language(self, text: str) -> str:
        try:
            return detect(text)
        except:
            return 'en'


    def _get_sbert_model(self, lang: str) -> SentenceTransformer:
        if lang not in self.models_by_lang:
            model_name = self.model_configs.get(lang, 'all-mpnet-base-v2')
            self.models_by_lang[lang] = SentenceTransformer(model_name)
        return self.models_by_lang[lang]


    def _get_vyakyarth_model(self):
        if self.vyakyarth is None:
            self.vyakyarth = SentenceTransformer('krutrim-ai-labs/Vyakyarth')
        return self.vyakyarth


    def _get_cohere_client(self):
        if self.cohere is None:
            api_key = os.getenv('COHERE_API_KEY')
            if not api_key:
                raise ValueError("COHERE_API_KEY not found in environment variables")
            self.cohere = cohere.ClientV2(api_key=api_key)
        return self.cohere


    def _get_voyage_client(self):
        if self.voyage is None:
            self.voyage = voyageai.Client()
        return self.voyage


    def _get_openai_client(self):
        if self.openai is None:
            self.openai = OpenAI()
        return self.openai


    def _get_distiluse_model(self):
        if self.distiluse is None:
            self.distiluse = SentenceTransformer('sentence-transformers/distiluse-base-multilingual-cased-v2')
        return self.distiluse


    def _get_labse_model(self):
        if self.labse is None:
            self.labse = SentenceTransformer('sentence-transformers/LaBSE')
        return self.labse


    def compute_sbert_similarity(self, ref: str, resp: str) -> float:
        if not ref or not resp:
            return 0.0
        try:
            lang = self._detect_language(ref)
            model = self._get_sbert_model(lang)
            embeddings = model.encode([ref, resp])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error in SBERT similarity: {e}")
            return 0.0


    def compute_vyakyarth_similarity(self, ref: str, resp: str) -> float:
        if not ref or not resp:
            return 0.0
        try:
            model = self._get_vyakyarth_model()
            embeddings = model.encode([ref, resp])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error in Vyakyarth similarity: {e}")
            return 0.0


    def compute_cohere_similarity(self, ref: str, resp: str) -> float:
        if not ref or not resp:
            return 0.0
        try:
            client = self._get_cohere_client()
            inputs = [
                {"content": [{"type": "text", "text": ref}]},
                {"content": [{"type": "text", "text": resp}]}
            ]
            result = client.embed(inputs=inputs, model="embed-multilingual-v3.0", input_type="search_document", embedding_types=["float"])
            emb1 = np.array(result.embeddings.float[0])
            emb2 = np.array(result.embeddings.float[1])
            similarity = cosine_similarity([emb1], [emb2])[0][0]
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error in Cohere similarity: {e}")
            return 0.0


    def compute_voyage_similarity(self, ref: str, resp: str) -> float:
        if not ref or not resp:
            return 0.0
        try:
            client = self._get_voyage_client()
            result = client.embed([ref, resp], model="voyage-3.5", input_type="document")
            emb1 = np.array(result.embeddings[0])
            emb2 = np.array(result.embeddings[1])
            similarity = cosine_similarity([emb1], [emb2])[0][0]
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error in Voyage similarity: {e}")
            return 0.0


    def compute_openai_similarity(self, ref: str, resp: str) -> float:
        if not ref or not resp:
            return 0.0
        try:
            client = self._get_openai_client()
            emb1 = client.embeddings.create(input=ref, model="text-embedding-3-small").data[0].embedding
            emb2 = client.embeddings.create(input=resp, model="text-embedding-3-small").data[0].embedding
            similarity = cosine_similarity([emb1], [emb2])[0][0]
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error in OpenAI similarity: {e}")
            return 0.0


    # def compute_distiluse_similarity(self, ref: str, resp: str) -> float:
    #     if not ref or not resp:
    #         return 0.0
    #     try:
    #         model = self._get_distiluse_model()
    #         embeddings = model.encode([ref, resp])
    #         similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    #         return max(0.0, min(1.0, similarity))
    #     except Exception as e:
    #         print(f"Error in DistilUSE similarity: {e}")
    #         return 0.0


    # def compute_labse_similarity(self, ref: str, resp: str) -> float:
    #     if not ref or not resp:
    #         return 0.0
    #     try:
    #         model = self._get_labse_model()
    #         embeddings = model.encode([ref, resp])
    #         similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    #         return max(0.0, min(1.0, similarity))
    #     except Exception as e:
    #         print(f"Error in LaBSE similarity: {e}")
    #         return 0.0


    def compute_bert_score(self, reference: str, candidate: str) -> float:
        if not reference or not candidate:
            return 0.0
        try:
            lang = self._detect_language(reference)
            P, R, F1 = bert_score([candidate], [reference], lang=lang, verbose=False)
            return float(F1[0])
        except Exception as e:
            print(f"Error in BERTScore: {e}")
            return 0.0


    def run_and_update_scores(self):
        langs, sbert_sims, vyakyarth_sims = [], [], []
        # distiluse_sims, labse_sims = [], []
        cohere_sims, voyage_sims = [], []
        openai_sims = []
        bert_scores, aggregated_sims = [], []

        for ref, resp in zip(self.references, self.responses):
            lang = self._detect_language(ref)
            langs.append(lang)

            sbert = self.compute_sbert_similarity(ref, resp)
            # vyakyarth = self.compute_vyakyarth_similarity(ref, resp)
            # distiluse = self.compute_distiluse_similarity(ref, resp)
            # labse = self.compute_labse_similarity(ref, resp)
            cohere = self.compute_cohere_similarity(ref, resp)
            voyage = self.compute_voyage_similarity(ref, resp)
            openai = self.compute_openai_similarity(ref, resp)
            bert = self.compute_bert_score(ref, resp)

            # Updated to only include active similarity methods (vyakyarth removed)
            # average_sim = (sbert + cohere + voyage + bert) / 4.0

            sbert_sims.append(sbert)
            # vyakyarth_sims.append(vyakyarth)
            # distiluse_sims.append(distiluse)
            # labse_sims.append(labse)
            cohere_sims.append(cohere)
            voyage_sims.append(voyage)
            openai_sims.append(openai)
            bert_scores.append(bert)
            # aggregated_sims.append(average_sim)

        self.df["language"] = langs
        self.df["sbert_similarity"] = sbert_sims
        # self.df["vyakyarth_similarity"] = vyakyarth_sims
        # self.df["distiluse_similarity"] = distiluse_sims
        # self.df["labse_similarity"] = labse_sims
        self.df["cohere_similarity"] = cohere_sims
        self.df["voyage_similarity"] = voyage_sims
        self.df["openai_similarity"] = openai_sims
        self.df["bert_score_f1"] = bert_scores
        # self.df["semantic_similarity"] = aggregated_sims

        print("Semantic Similarity complete. Files ready for saving.")


    def save_updated_dataset(self, output_path: str):
        self.df.to_csv(output_path, index=False)


    def save_summary_scores(self, summary_path: str):
        summary = {
            "avg_sbert_similarity": np.mean(self.df["sbert_similarity"]),
            # "avg_vyakyarth_similarity": np.mean(self.df["vyakyarth_similarity"]),
            # "avg_distiluse_similarity": np.mean(self.df["distiluse_similarity"]),
            # "avg_labse_similarity": np.mean(self.df["labse_similarity"]),
            "avg_cohere_similarity": np.mean(self.df["cohere_similarity"]),
            "avg_voyage_similarity": np.mean(self.df["voyage_similarity"]),
            "avg_openai_similarity": np.mean(self.df["openai_similarity"]),
            "avg_bert_score_f1": np.mean(self.df["bert_score_f1"]),
            # "avg_semantic_similarity": np.mean(self.df["semantic_similarity"]),
        }
        pd.DataFrame([summary]).to_csv(summary_path, index=False)
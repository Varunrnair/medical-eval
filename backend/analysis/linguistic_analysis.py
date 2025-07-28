import nltk
import torch
import numpy as np
import pandas as pd
from typing import List
from rouge_score import rouge_scorer
from nltk.translate.meteor_score import meteor_score
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)



class LinguisticAnalyzer:
    def __init__(self, dataset_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.rouge_scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
        self.smoothing = SmoothingFunction()
        self.tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        self.model = GPT2LMHeadModel.from_pretrained("gpt2").to(self.device)
        self.model.eval()
        self.dataset_path = dataset_path
        self.df = pd.read_csv(dataset_path)
        self.references = self.df["Answer"].fillna("").tolist()
        self.candidates = self.df["llm_response"].fillna("").tolist()


    def compute_bleu_score(self, reference: str, candidate: str) -> float:
        # Tokenization required for BLEU calculation; lowercasing as minimal preprocessing
        try:
            ref_tokens = nltk.word_tokenize(reference.lower())
            cand_tokens = nltk.word_tokenize(candidate.lower())
            return float(sentence_bleu([ref_tokens], cand_tokens, smoothing_function=self.smoothing.method1))
        except Exception:
            return 0.0


    def compute_meteor_score(self, reference: str, candidate: str) -> float:
        # Tokenization required for METEOR calculation; lowercasing as minimal preprocessing
        try:
            ref_tokens = nltk.word_tokenize(reference.lower())
            cand_tokens = nltk.word_tokenize(candidate.lower())
            return float(meteor_score([ref_tokens], cand_tokens))
        except Exception as e:
            print(f"Error computing METEOR score: {e}")
            return 0.0


    def compute_rouge_l_score(self, reference: str, candidate: str) -> float:
        # Tokenization required for ROUGE-L calculation; lowercasing as minimal preprocessing
        try:
            ref_str = " ".join(nltk.word_tokenize(reference.lower()))
            cand_str = " ".join(nltk.word_tokenize(candidate.lower()))
            scores = self.rouge_scorer.score(ref_str, cand_str)
            return float(scores['rougeL'].fmeasure)
        except Exception as e:
            print(f"Error computing ROUGE-L score: {e}")
            return 0.0


    def compute_perplexity_score(self, sentence: str) -> float:
        # No explicit tokenization needed; uses GPT2 tokenizer internally
        try:
            encodings = self.tokenizer(sentence, return_tensors="pt")
            input_ids = encodings.input_ids.to(self.device)
            with torch.no_grad():
                outputs = self.model(input_ids, labels=input_ids)
                loss = outputs.loss
            return torch.exp(loss).item()
        except Exception as e:
            print(f"Error computing Perplexity: {e}")
            return float('inf')


    def run_and_update_scores(self):
        bleu_scores = []
        meteor_scores = []
        rouge_l_scores = []
        perplexity_scores = []

        for ref, cand in zip(self.references, self.candidates):
            bleu_scores.append(self.compute_bleu_score(ref, cand))
            meteor_scores.append(self.compute_meteor_score(ref, cand))
            rouge_l_scores.append(self.compute_rouge_l_score(ref, cand))
            perplexity_scores.append(self.compute_perplexity_score(cand))

        # Linguistic quality excludes perplexity
        linguistic_quality_score = [
            (b + m + r) / 3.0 for b, m, r in zip(bleu_scores, meteor_scores, rouge_l_scores)
        ]

        self.df["bleu_score"] = bleu_scores
        self.df["meteor_score"] = meteor_scores
        self.df["rouge_l_score"] = rouge_l_scores
        self.df["perplexity"] = perplexity_scores
        self.df["linguistic_quality_score"] = linguistic_quality_score

        print("Linguistic scoring complete. Files saved.")


    def save_updated_dataset(self, output_path: str):
        # Only saving updated dataframe; avg perplexity already included in summary
        self.df.to_csv(output_path, index=False)


    def save_summary_scores(self, summary_path: str):
        summary = {
            "avg_bleu_score": np.mean(self.df["bleu_score"]),
            "avg_meteor_score": np.mean(self.df["meteor_score"]),
            "avg_rouge_l_score": np.mean(self.df["rouge_l_score"]),
            "avg_perplexity": np.mean(self.df["perplexity"]),
            "avg_linguistic_quality_score": np.mean(self.df["linguistic_quality_score"]),
        }
        pd.DataFrame([summary]).to_csv(summary_path, index=False)
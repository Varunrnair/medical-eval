export interface DataSource {
  id: string
  name: string
  description: string
  filePath: string
  schema: Record<string, string>
  visualizations: string[]
  lastUpdated: string
}

export interface DataSourceConfig {
  dataSources: DataSource[]
}

export interface MedicalQARecord {
  Theme: string
  Questions: string
  Answer: string
  Hindi?: string
  Marathi?: string
  References?: string
  llm_response: string
  bleu_score: number
  meteor_score: number
  rouge_l_score: number
  perplexity: number
  linguistic_quality_score: number
  language: string
  cosine_similarity: number
  bert_score_f1: number
  semantic_similarity: number
  medical_quality_score: number
}

export interface MedicalQualityDetailed {
  question: string
  gold_standard_answer: string
  llm_response: string
  rubrics: string
  rubric_scores: string
  classification: string
  axis_scores: string
  medical_quality_score: number;
  medical_quality_score_2?: number;
}

export interface LinguisticScores {
  avg_bleu_score: number
  avg_meteor_score: number
  avg_rouge_l_score: number
  avg_perplexity: number
  avg_linguistic_quality_score: number
}

export interface SemanticScores {
  avg_cosine_similarity: number
  avg_bert_score_f1: number
  avg_semantic_similarity: number
}

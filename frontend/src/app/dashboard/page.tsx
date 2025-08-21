"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useSelectedQuestion } from "../../hooks/use-selected-question";
import { useModel } from "@/contexts/ModelContext"; // ✅ use dataset from context

// Define explicit types for metrics and headings
type Metric = {
  key: string;
  displayName: string;
  type?: never;
};
type Heading = {
  type: "heading";
  displayName: string;
  key?: never;
};
type Row = Record<string, string | number | null>;

const metricConfig: (Metric | Heading)[] = [
  { type: "heading", displayName: "Semantic Similarity" },
  { key: "sbert_similarity", displayName: "all-mpnet-base-v2" },
  { key: "cohere_similarity", displayName: "Cohere" },
  { key: "voyage_similarity", displayName: "Voyage" },
  { key: "openai_similarity", displayName: "OpenAI" },
  { key: "bert_score_f1", displayName: "BERT Scores" },

  { type: "heading", displayName: "Linguistic Scores" },
  { key: "bleu_score", displayName: "BLEU" },
  { key: "meteor_score", displayName: "METEOR" },
  { key: "rouge_l_score", displayName: "ROUGE-L" },
  { key: "perplexity", displayName: "Perplexity" },
  { key: "linguistic_quality_score", displayName: "Linguistic Scores" },

  { type: "heading", displayName: "Medical Quality Scores" },
  { key: "medical_quality_score", displayName: "Medical 1" },
  { key: "medical_quality_score_2", displayName: "Medical 2" },
];

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<Record<string, Row[]>>({});
  const [detailedData, setDetailedData] = useState<Record<string, Row[]>>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>(""); // ✅ error handling
  const [selectedIndex, setSelectedIndex] = useSelectedQuestion();

  const { selectedDataset } = useModel(); // ✅ now dynamic

  const models = {
    "Cohere Aya-Expanse": "/c4ai-aya-expanse-32b",
    "Command-A": "/command-a-03-2025",
    "GPT-4o-mini": "/gpt-4o-mini-2024-07-18",
    "Llama-3.3-70B": "/Llama-3.3-70B-Instruct-Turbo",
  };

  useEffect(() => {
    if (!selectedDataset) return;

    const summaryKeyMap: { [oldKey: string]: string } = {
      sbert: "sbert_similarity",
      cohere: "cohere_similarity",
      voyage: "voyage_similarity",
      openai: "openai_similarity",
      bert: "bert_score_f1",
      bleu: "bleu_score",
      meteor: "meteor_score",
      rouge_l: "rouge_l_score",
      ling: "linguistic_quality_score",
      med1: "medical_quality_score",
      med2: "medical_quality_score_2",
    };

    async function loadCSVs() {
      setLoading(true);
      setError("");
      const summaryResults: Record<string, Row[]> = {};
      const detailedResults: Record<string, Row[]> = {};
      let questionList: string[] = [];

      try {
        for (const [name, basePath] of Object.entries(models)) {
          // ✅ updated path
          const summaryResponse = await fetch(
            `/datasets/${selectedDataset}${basePath}/summary_scores.csv`
          );

          if (!summaryResponse.ok) {
            setError(`No dataset found in "${selectedDataset}". Please pick a valid dataset.`);
            setLoading(false);
            return;
          }

          const summaryText = await summaryResponse.text();
          if (!summaryText.trim()) {
            setError(`"${selectedDataset}" dataset is empty. Please pick a valid dataset.`);
            setLoading(false);
            return;
          }

          const parsedSummary = Papa.parse<Row>(summaryText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          });

          const normalizedSummaryData = parsedSummary.data.map((summaryRow) => {
            const newRow: Row = {};
            for (const [key, value] of Object.entries(summaryRow)) {
              const newKey = summaryKeyMap[key] || key;
              newRow[newKey] = value;
            }
            return newRow;
          });
          summaryResults[name] = normalizedSummaryData;

          // ✅ updated path
          const detailedResponse = await fetch(
            `/datasets/${selectedDataset}${basePath}/scored_final_dataset.csv`
          );

          if (!detailedResponse.ok) {
            setError(`No dataset found in "${selectedDataset}". Please pick a valid dataset.`);
            setLoading(false);
            return;
          }

          const detailedText = await detailedResponse.text();
          if (!detailedText.trim()) {
            setError(`"${selectedDataset}" dataset is empty. Please pick a valid dataset.`);
            setLoading(false);
            return;
          }

          const detailedParsed = Papa.parse<Row>(detailedText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          });
          detailedResults[name] = detailedParsed.data;

          if (questionList.length === 0 && detailedParsed.data.length > 0) {
            questionList = detailedParsed.data.map(
              (row) => String(row.Questions || "")
            );
          }
        }

        setSummaryData(summaryResults);
        setDetailedData(detailedResults);
        setQuestions(questionList);
      } catch (err) {
        console.error("Error loading dataset:", err);
        setError(`Failed to load "${selectedDataset}". Please pick a valid dataset.`);
      } finally {
        setLoading(false);
      }
    }

    loadCSVs();
  }, [selectedDataset]);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedIndex(value === "all" ? null : parseInt(value, 10));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full p-6 sm:p-12">
      <div className="mx-auto max-w-10xl">
        <h1 className="mb-8 text-center text-5xl font-bold">
          Scores Across Models
        </h1>

        <div className="mb-12 flex justify-center">
          <div className="flex flex-col items-start gap-2">
            <label
              htmlFor="question-select"
              className="text-sm font-medium text-neutral-400"
            >
              Select a Question to View
            </label>
            <select
              id="question-select"
              value={selectedIndex === null ? "all" : selectedIndex}
              onChange={handleQuestionChange}
              className="w-full max-w-lg cursor-pointer rounded-full border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Questions (Summary)</option>
              {questions.map((question, index) => (
                <option key={index} value={index}>
                  {`Q${index + 1}: ${question.substring(0, 80)}${
                    question.length > 80 ? "..." : ""
                  }`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(summaryData).map(([model, summaryRows]) => {
            const detailedRows = detailedData[model] || [];
            const currentRow =
              selectedIndex === null
                ? summaryRows[0]
                : detailedRows[selectedIndex];

            if (!currentRow) {
              return null;
            }
            return (
              <div
                key={model}
                className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 min-h-[420px]"
              >
                <h1 className="mb-6 text-xl font-semibold">{model}</h1>
                <div className="flex flex-col gap-3 text-sm">
                  {metricConfig.map((metric, index) => {
                    if (metric.type === "heading") {
                      return (
                        <div
                          key={`heading-${index}`}
                          className="pt-3 text-md font-semibold text-neutral-300"
                        >
                          {metric.displayName}
                        </div>
                      );
                    } else {
                      const value = currentRow[metric.key];
                      if (value !== undefined && value !== null) {
                        return (
                          <div
                            key={metric.key}
                            className="grid grid-cols-2 items-center gap-4"
                          >
                            <span className="text-neutral-400">
                              {metric.displayName}
                            </span>
                            <span className="font-mono text-right">
                              {typeof value === "number"
                                ? value.toFixed(6)
                                : String(value)}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

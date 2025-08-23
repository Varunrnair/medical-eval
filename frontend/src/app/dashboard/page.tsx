"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useSelectedQuestion } from "../../hooks/use-selected-question";
import { useModel } from "@/contexts/ModelContext";
import BarChart from "@/components/charts/bar-chart";
import ChartContainer from "@/components/charts/chart-container";


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

// Metric config
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
  const [error, setError] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useSelectedQuestion();

  const { selectedDataset } = useModel();

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
          const summaryResponse = await fetch(
            `/datasets/${selectedDataset}${basePath}/summary_scores.csv`
          );
          if (!summaryResponse.ok) continue;

          const summaryText = await summaryResponse.text();
          if (!summaryText.trim()) continue;

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

          const detailedResponse = await fetch(
            `/datasets/${selectedDataset}${basePath}/scored_final_dataset.csv`
          );
          if (!detailedResponse.ok) continue;

          const detailedText = await detailedResponse.text();
          if (!detailedText.trim()) continue;

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
        setError(
          `Failed to load "${selectedDataset}". Please pick a valid dataset.`
        );
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

  const metricExtremes: Record<string, { min: number; max: number }> = {};
  metricConfig.forEach((metric) => {
    if (metric.key) { 
      const key = metric.key; 
      const values: number[] = [];
      Object.values(summaryData).forEach((summaryRows, idx) => {
        const detailedRows = detailedData[Object.keys(summaryData)[idx]] || [];
        const row =
          selectedIndex === null
            ? summaryRows[0]
            : selectedIndex < detailedRows.length
            ? detailedRows[selectedIndex]
            : undefined;
        const val = row?.[key]; 
        if (typeof val === "number") values.push(val);
      });
      if (values.length > 0) {
        metricExtremes[key] = { 
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }
  });

  return (
    <main className="min-h-screen w-full p-6 sm:p-12">
      <div className="mx-auto max-w-10xl">
        <h1 className="mb-8 text-center text-5xl font-bold">
          Scores Across Models
        </h1>

        {/* Question Selector */}
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

        {/* Scorecards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 justify-center">
          {Object.entries(summaryData).map(([model, summaryRows]) => {
            const detailedRows = detailedData[model] || [];
            const currentRow =
              selectedIndex === null
                ? summaryRows[0]
                : detailedRows[selectedIndex] || undefined;

            if (!currentRow) return null;

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
                        const extremes = metricExtremes[metric.key];
                        const highlightClass =
                          extremes && typeof value === "number"
                            ? value === extremes.max
                              ? "text-green-500 font-bold"
                              : value === extremes.min
                              ? "text-red-500 font-bold"
                              : ""
                            : "";
                        return (
                          <div
                            key={metric.key}
                            className="grid grid-cols-2 items-center gap-4"
                          >
                            <span className="text-neutral-400">
                              {metric.displayName}
                            </span>
                            <span
                              className={`font-mono text-right ${highlightClass}`}
                            >
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

        {/* ------------------- GRAPHS SECTION (MODIFIED) ------------------- */}
        <div className="mt-16">
          {(() => {
            // Define a consistent color palette for the models
            const modelColors = Object.keys(models).map(
              (_, idx) => `hsl(${(idx * 90) % 360}, 70%, 50%)`
            );

            // Define shared chart options for a more granular Y-axis
            const chartOptions = {
              scales: {
                y: {
                  beginAtZero: true,
                  min: 0, // Set a fixed minimum for the Y-axis
                  max: 1, // Set a fixed maximum for the Y-axis
                },
              },
              plugins: {
                legend: {
                  display: false, // Hide legend as title is sufficient
                },
              },
            };

            const sections = metricConfig.filter(
              (m) => m.type === "heading"
            ) as Heading[];

            return sections.map((section) => {
              const startIndex = metricConfig.findIndex((m) => m === section);
              const sectionMetrics: Metric[] = [];
              for (let i = startIndex + 1; i < metricConfig.length; i++) {
                const m = metricConfig[i];
                if (m.type === "heading") break;
                sectionMetrics.push(m as Metric);
              }

              return (
                <div key={section.displayName} className="mt-12 first:mt-0">
                  <h2 className="mb-8 text-3xl font-bold border-b border-neutral-700 pb-2">
                    {section.displayName}
                  </h2>
                  {/* MODIFIED: Grid layout updated to make graphs smaller */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {sectionMetrics.map((metric) => {
                      const chartData = {
                        labels: Object.keys(models),
                        datasets: [
                          {
                            label: metric.displayName,
                            data: Object.entries(summaryData).map(
                              ([model, rows]) => {
                                const detailedRows = detailedData[model];
                                const row =
                                    selectedIndex != null && detailedRows && selectedIndex < detailedRows.length
                                        ? detailedRows[selectedIndex]
                                        : rows[0];
                                const value = (row?.[metric.key] as number) ?? 0;
                                return value;
                              }
                            ),
                            backgroundColor: modelColors, // Assigns a different color per model
                          },
                        ],
                      };

                      return (
                        <ChartContainer
                          key={metric.key}
                          title={metric.displayName}
                        >
                          {/* MODIFIED: Pass custom options for Y-axis scaling */}
                          <BarChart data={chartData} options={chartOptions} />
                        </ChartContainer>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </main>
  );
}
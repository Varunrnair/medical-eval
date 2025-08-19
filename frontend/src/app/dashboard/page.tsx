"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";

// Define explicit types for metrics and headings
type Metric = {
  key: string;
  displayName: string;
  type?: never; // Ensures 'type' property doesn't exist on metrics
};

type Heading = {
  type: "heading";
  displayName: string;
  key?: never; // Ensures 'key' property doesn't exist on headings
};

type Row = Record<string, string | number | null>;

// Apply the new types to the config array
const metricConfig: (Metric | Heading)[] = [
  { type: "heading", displayName: "Semantic Similarity" },
  { key: "sbert", displayName: "all-mpnet-base-v2" },
  { key: "cohere", displayName: "Cohere" },
  { key: "voyage", displayName: "Voyage" },
  { key: "openai", displayName: "OpenAI" },
  { key: "bert", displayName: "BERT Scores" },

  { type: "heading", displayName: "Linguistic Scores" },
  { key: "bleu", displayName: "BLEU" },
  { key: "meteor", displayName: "METEOR" },
  { key: "rouge_l", displayName: "ROUGE-L" },
  { key: "perplexity", displayName: "Perplexity" },
  { key: "ling", displayName: "Linguistic Scores" },

  { type: "heading", displayName: "Medical Quality Scores" },
  { key: "med1", displayName: "Medical 1" },
  { key: "med2", displayName: "Medical 2" },
];

export default function HomePage() {
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);

  const sources = {
    "Cohere Aya-Expanse": "/c4ai-aya-expanse-32b/summary_scores.csv",
    "Command-A": "/command-a-03-2025/summary_scores.csv",
    "GPT-4o-mini": "/gpt-4o-mini-2024-07-18/summary_scores.csv",
    "Llama-3.3-70B": "/Llama-3.3-70B-Instruct-Turbo/summary_scores.csv",
  };

  useEffect(() => {
    async function loadCSVs() {
      setLoading(true);
      const results: Record<string, Row[]> = {};
      for (const [name, path] of Object.entries(sources)) {
        const response = await fetch(path);
        const text = await response.text();
        const parsed = Papa.parse<Row>(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });
        results[name] = parsed.data;
      }
      setData(results);
      setLoading(false);
    }
    loadCSVs();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full p-6 sm:p-12">
      <div className="mx-auto max-w-10xl">
        <h1 className="mb-20 text-center text-5xl font-bold">
          Scores Across Models
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(data).map(([model, rows]) => (
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
                    // This 'else' block fixes the error
                    const value =
                      rows.length > 0 ? rows[0][metric.key] : undefined;
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
          ))}
        </div>
      </div>
    </main>
  );
}
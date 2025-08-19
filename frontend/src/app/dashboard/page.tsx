"use client";

import { useDataSource } from "@/hooks/use-data-source";
import MetricsCards from "@/components/charts/metrics-cards";
import ChartContainer from "@/components/charts/chart-container";
import BarChart from "@/components/charts/bar-chart";
import PieChart from "@/components/charts/pie-chart";
import {
  createMetricCards,
  createBarChartData,
  createPieChartData,
  createRadarChartData,
} from "@/lib/chart-utils";
import { useMemo } from "react";
import RowSelector from "@/components/ui/row-selector";
import { useSelectedQuestion } from "@/hooks/use-selected-question";

export default function HomePage() {
  const { data: summaryData, loading: mainLoading } =
    useDataSource("summary-scores");

  // Updated top graphs data with new field names
  const categoryAverageChart = useMemo(() => {
    if (summaryData.length === 0) return null;
    return createBarChartData(
      summaryData.filter((r) => typeof r.med1 === "number"),
      ["med1", "semantic", "ling"],
    );
  }, [summaryData]);

  const multiMetricRadarChart = useMemo(() => {
    if (summaryData.length === 0) return null;
    return createRadarChartData(
      summaryData.filter((r) => typeof r.med1 === "number"),
      ["med1", "semantic", "ling", "bleu", "rouge_l", "meteor"],
    );
  }, [summaryData]);

  const medicalMetrics = useMemo(() => {
    if (summaryData.length === 0) return [];
    const rows = summaryData.filter((r) => typeof r.med1 === "number");
    return createMetricCards(rows, ["med1", "med2"]);
  }, [summaryData]);

  const semanticMetrics = useMemo(() => {
    if (summaryData.length === 0) return [];
    const rows = summaryData.filter((r) => typeof r.med1 === "number");
    // Changed: Removed "semantic" (aggregate) and added "openai"
    return createMetricCards(rows, [
      "sbert",
      "cohere",
      "voyage",
      "openai",
      "bert",
    ]);
  }, [summaryData]);

  const linguisticMetrics = useMemo(() => {
    if (summaryData.length === 0) return [];
    const rows = summaryData.filter((r) => typeof r.med1 === "number");
    return createMetricCards(rows, ["bleu", "meteor", "rouge_l", "perplexity"]);
  }, [summaryData]);

  const allMetricsChart = useMemo(() => {
    if (summaryData.length === 0) return null;
    const rows = summaryData.filter((r) => typeof r.med1 === "number");
    return createBarChartData(rows, ["med1", "semantic", "ling"]);
  }, [summaryData]);

  const medicalDistribution = useMemo(() => {
    if (summaryData.length === 0) return null;
    const rows = summaryData.filter((r) => typeof r.med1 === "number");
    return createPieChartData(rows, "med1");
  }, [summaryData]);

  const [selectedIndex] = useSelectedQuestion();
  const selectedData =
    selectedIndex !== null ? summaryData[selectedIndex] : null;

  if (mainLoading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This page shows average scores across the entire dataset for medical
          QA evaluation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-1">
              Medical Quality
            </h3>
            <p className="text-gray-700 dark:text-gray-400">
              Measures accuracy, completeness, and medical correctness of
              responses
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-1">
              Semantic Similarity
            </h3>
            <p className="text-gray-700 dark:text-gray-400">
              Evaluates how semantically similar the response is to the gold
              standard using multiple embedding models
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-1">
              Linguistic Quality
            </h3>
            <p className="text-gray-700 dark:text-gray-400">
              Assesses language fluency, grammar, and readability of responses
            </p>
          </div>
        </div>
      </div>

      <RowSelector data={summaryData} questionField="dataset" />

      <div className="space-y-6">
        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Medical Quality Scores
          </h2>
          <MetricsCards metrics={medicalMetrics} />
        </div>

        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Semantic Similarity Scores
          </h2>
          <MetricsCards metrics={semanticMetrics} />
        </div>

        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Linguistic Quality Scores
          </h2>
          <MetricsCards metrics={linguisticMetrics} />
        </div>
      </div>

      {/* Removed the "Selected Dataset Final Score" card */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allMetricsChart && (
          <ChartContainer title="Overall Performance Comparison">
            <BarChart data={allMetricsChart} />
          </ChartContainer>
        )}

        {medicalDistribution && (
          <ChartContainer title="Medical Quality Score Distribution">
            <p className="text-xs text-neutral-400 mb-2">
              This chart shows the proportion of answers falling into different
              medical quality score ranges (e.g., high, medium, low) across the
              dataset.
            </p>
            <div className="w-full flex flex-col items-center">
              <div className="max-w-md w-full h-60 mx-auto bg-white dark:bg-neutral-800 rounded-xl">
                <PieChart data={medicalDistribution} />
              </div>
            </div>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
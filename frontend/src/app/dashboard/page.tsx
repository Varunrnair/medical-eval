"use client"

import { useDataSource } from "@/hooks/use-data-source"
import MetricsCards from "@/components/charts/metrics-cards"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import PieChart from "@/components/charts/pie-chart"
import { createMetricCards, createBarChartData, createPieChartData, createRadarChartData } from "@/lib/chart-utils"
import { useMemo } from "react"
import RowSelector from "@/components/ui/row-selector"
import { useSelectedQuestion } from "@/hooks/use-selected-question"

export default function DashboardPage() {
  const { data: mainData, loading: mainLoading } = useDataSource("scored-final-dataset")
  const { data: semanticData, loading: semanticLoading } = useDataSource("semantic-detailed")
  const { data: linguisticData, loading: linguisticLoading } = useDataSource("linguistic-detailed")

  // New top graphs data
  const categoryAverageChart = useMemo(() => {
    if (mainData.length === 0) return null
    return createBarChartData(mainData, ["medical_quality_score", "semantic_similarity", "linguistic_quality_score"])
  }, [mainData])

  const multiMetricRadarChart = useMemo(() => {
    if (mainData.length === 0) return null
    return createRadarChartData(mainData, [
      "medical_quality_score",
      "semantic_similarity",
      "linguistic_quality_score",
      "bleu_score",
      "rouge_l_score",
      "meteor_score",
    ])
  }, [mainData])

  const medicalMetrics = useMemo(() => {
    if (mainData.length === 0) return []
    return createMetricCards(mainData, ["medical_quality_score"])
  }, [mainData])

  const semanticMetrics = useMemo(() => {
    if (semanticData.length === 0) return []
    return createMetricCards(semanticData, ["avg_cosine_similarity", "avg_bert_score_f1", "avg_semantic_similarity"])
  }, [semanticData])

  const linguisticMetrics = useMemo(() => {
    if (linguisticData.length === 0) return []
    return createMetricCards(linguisticData, ["avg_bleu_score", "avg_meteor_score", "avg_rouge_l_score"])
  }, [linguisticData])

  const allMetricsChart = useMemo(() => {
    if (mainData.length === 0) return null
    return createBarChartData(mainData, ["medical_quality_score", "semantic_similarity", "linguistic_quality_score"])
  }, [mainData])

  const medicalDistribution = useMemo(() => {
    if (mainData.length === 0) return null
    return createPieChartData(mainData, "medical_quality_score")
  }, [mainData])


  const [selectedIndex] = useSelectedQuestion()
  const selectedData = selectedIndex !== null ? mainData[selectedIndex] : null

  if (mainLoading || semanticLoading || linguisticLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This dashboard shows average scores across the entire dataset for medical QA evaluation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Medical Quality</h3>
            <p className="text-blue-700 dark:text-blue-400">
              Measures accuracy, completeness, and medical correctness of responses
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <h3 className="font-medium text-green-900 dark:text-green-300 mb-1">Semantic Similarity</h3>
            <p className="text-green-700 dark:text-green-400">
              Evaluates how semantically similar the response is to the gold standard
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
            <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-1">Linguistic Quality</h3>
            <p className="text-purple-700 dark:text-purple-400">
              Assesses language fluency, grammar, and readability of responses
            </p>
          </div>
        </div>
      </div>

      <RowSelector data={mainData} />

      <div className="space-y-6">
        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Medical Quality Scores</h2>
          <MetricsCards metrics={medicalMetrics} />
        </div>

        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Semantic Similarity Scores</h2>
          <MetricsCards metrics={semanticMetrics} />
        </div>

        <div>
          <h2 className="text-xs md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Linguistic Quality Scores</h2>
          <MetricsCards metrics={linguisticMetrics} />
        </div>
      </div>

      {selectedData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white mb-2">Selected Question Final Score</h2>
          <p className="text-2xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
            {(
              ((selectedData.medical_quality_score +
                selectedData.semantic_similarity +
                selectedData.linguistic_quality_score) /
                3) *
              100
            ).toFixed(1)}
            %
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Average of Medical Quality ({(selectedData.medical_quality_score * 100).toFixed(1)}%), Semantic Similarity (
            {(selectedData.semantic_similarity * 100).toFixed(1)}%), and Linguistic Quality (
            {(selectedData.linguistic_quality_score * 100).toFixed(1)}%)
          </p>
        </div>
      )}

      {/* New bottom graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allMetricsChart && (
          <ChartContainer title="Overall Performance Comparison">
            <BarChart data={allMetricsChart} />
          </ChartContainer>
        )}

        {medicalDistribution && (
          <ChartContainer title="Medical Quality Score Distribution">
            <PieChart data={medicalDistribution} />
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

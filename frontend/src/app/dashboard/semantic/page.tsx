"use client"

import { useDataSource } from "@/hooks/use-data-source"
import { useSelectedQuestion } from "@/hooks/use-selected-question"
import RowSelector from "@/components/ui/row-selector"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import RadarChart from "@/components/charts/radar-chart"
import LineChart from "@/components/charts/line-chart"
import DonutChart from "@/components/charts/donut-chart"
import { createBarChartData, createRadarChartData } from "@/lib/chart-utils"
import { useMemo, useState } from "react"
import Modal from "@/components/ui/modal";

export default function SemanticAnalysisPage() {
  const { data, loading, error } = useDataSource("scored-final-dataset")
  const [selectedIndex] = useSelectedQuestion()
  const [barModalOpen, setBarModalOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);

  // New bottom graphs data
  const semanticMetricsBar = useMemo(() => {
    if (data.length === 0) return null
    return createBarChartData(data, ["cosine_similarity", "bert_score_f1", "vyakyarth_similarity", "cohere_similarity"])
  }, [data])

  const fiveSemanticRadar = useMemo(() => {
    if (data.length === 0) return null
    return createRadarChartData(data, [
      "cosine_similarity",
      "vyakyarth_similarity",
      "cohere_similarity",
      "bert_score_f1",
      "semantic_similarity",
    ])
  }, [data])

  const trendLineData = useMemo(() => {
    if (data.length === 0) return null

    const scores = data.map((item) => item.semantic_similarity)
    const labels = data.map((item, index) => `Q${index + 1}`)

    return {
      labels,
      datasets: [
        {
          label: "Semantic Score Trend",
          data: scores,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
        },
      ],
    }
  }, [data])

  const contributionDonut = useMemo(() => {
    if (data.length === 0) return null

    const avgCosine = data.reduce((sum, item) => sum + item.cosine_similarity, 0) / data.length
    const avgBert = data.reduce((sum, item) => sum + item.bert_score_f1, 0) / data.length
    const avgVyakyarth = data.reduce((sum, item) => sum + item.vyakyarth_similarity, 0) / data.length
    const avgCohere = data.reduce((sum, item) => sum + item.cohere_similarity, 0) / data.length

    return {
      labels: ["Cosine Similarity", "BERT Score F1", "Vyakyarth Similarity", "Cohere Similarity"],
      datasets: [
        {
          data: [avgCosine, avgBert, avgVyakyarth, avgCohere],
          backgroundColor: ["#3B82F6", "#14B8A6", "#6B7280", "#F59E42"],
          borderColor: ["#9CA3AF", "#D1D5DB", "#6B7280", "#F59E42"],
          borderWidth: 2,
        },
      ],
    }
  }, [data])

  const selectedData = selectedIndex !== null ? data[selectedIndex] : null

  const chartData = useMemo(() => {
    if (!selectedData) return { barData: null, radarData: null }

    const semanticFields = ["cosine_similarity", "bert_score_f1", "vyakyarth_similarity", "cohere_similarity", "semantic_similarity"]
    const mockData = [selectedData]

    return {
      barData: createBarChartData(mockData, semanticFields),
      radarData: createRadarChartData(mockData, semanticFields),
    }
  }, [selectedData])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">Semantic Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Measuring semantic similarity between LLM responses and gold standard answers using cosine similarity, BERT
          scores, and custom similarity metrics.
        </p>
      </div>

      <RowSelector data={data} />

      {selectedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.barData && (
              <ChartContainer title="Semantic Similarity Metrics">
                <div className="w-full h-56">
                <BarChart data={chartData.barData} />
                </div>
              </ChartContainer>
            )}

            {chartData.radarData && (
              <ChartContainer title="Semantic Performance Radar">
                <RadarChart data={chartData.radarData} />
              </ChartContainer>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Question</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.Questions}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Gold Standard Answer</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.Answer}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">LLM Response</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.llm_response}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Cosine Similarity</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.cosine_similarity.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">BERT Score F1</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.bert_score_f1.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Vyakyarth Similarity</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.vyakyarth_similarity.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Cohere Similarity "embed-multilingual-v3.0"</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.cohere_similarity.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Semantic Similarity</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.semantic_similarity.toFixed(3)}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* New bottom graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {semanticMetricsBar && (
          <ChartContainer title="Semantic Metrics">
            <div onClick={() => setBarModalOpen(true)} className="w-full h-56 cursor-pointer">
              <BarChart data={semanticMetricsBar} />
            </div>
            <Modal open={barModalOpen} onClose={() => setBarModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <BarChart data={semanticMetricsBar} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}

        {fiveSemanticRadar && (
          <ChartContainer title="Individual Semantic Metrics Radar">
            <RadarChart data={fiveSemanticRadar} />
          </ChartContainer>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendLineData && (
          <ChartContainer title="Semantic Score Trend">
            <div onClick={() => setLineModalOpen(true)} className="w-full h-56 cursor-pointer">
              <LineChart data={trendLineData} />
            </div>
            <Modal open={lineModalOpen} onClose={() => setLineModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <LineChart data={trendLineData} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}

        {contributionDonut && (
          <ChartContainer title="Metric Contribution Percentage">
            <DonutChart data={contributionDonut} />
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

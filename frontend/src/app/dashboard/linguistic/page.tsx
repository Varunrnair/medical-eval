"use client"

import { useDataSource } from "@/hooks/use-data-source"
import { useSelectedQuestion } from "@/hooks/use-selected-question"
import RowSelector from "@/components/ui/row-selector"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import RadarChart from "@/components/charts/radar-chart"
import LineChart from "@/components/charts/line-chart"
import StackedBarChart from "@/components/charts/stacked-bar-chart"
import { createBarChartData, createRadarChartData } from "@/lib/chart-utils"
import { useMemo } from "react"
import Modal from "@/components/ui/modal";
import { useState } from "react";

export default function LinguisticAnalysisPage() {
  const { data, loading, error } = useDataSource("scored-final-dataset")
  const [selectedIndex] = useSelectedQuestion()
  const [barModalOpen, setBarModalOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [stackedBarModalOpen, setStackedBarModalOpen] = useState(false);

  // New bottom graphs data
  const linguisticMetricsBar = useMemo(() => {
    if (data.length === 0) return null
    return createBarChartData(data, ["bleu_score", "meteor_score", "rouge_l_score"])
  }, [data])

  const perplexityLineData = useMemo(() => {
    if (data.length === 0) return null

    const scores = data.map((item) => item.perplexity || 0)
    const labels = data.map((item, index) => `Q${index + 1}`)

    return {
      labels,
      datasets: [
        {
          label: "Perplexity Score",
          data: scores,
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
        },
      ],
    }
  }, [data])

  const stackedCompositionData = useMemo(() => {
    if (data.length === 0) return null

    const labels = data.map((item, index) => `Q${index + 1}`)
    const datasets = [
      {
        label: "BLEU",
        data: data.map((item) => item.bleu_score),
        backgroundColor: "#3B82F6",
        borderColor: "#6B7280",
        borderWidth: 1,
      },
      {
        label: "METEOR",
        data: data.map((item) => item.meteor_score),
        backgroundColor: "#14B8A6",
        borderColor: "#9CA3AF",
        borderWidth: 1,
      },
      {
        label: "ROUGE-L",
        data: data.map((item) => item.rouge_l_score),
        backgroundColor: "#D1D5DB",
        borderColor: "#6B7280",
        borderWidth: 1,
      },
    ]
    return { labels, datasets }
  }, [data])



  const selectedData = selectedIndex !== null ? data[selectedIndex] : null

  const chartData = useMemo(() => {
    if (!selectedData) return { barData: null, radarData: null }

    const linguisticFields = ["bleu_score", "meteor_score", "rouge_l_score", "linguistic_quality_score"]
    const mockData = [selectedData]

    return {
      barData: createBarChartData(mockData, linguisticFields),
      radarData: createRadarChartData(mockData, linguisticFields),
    }
  }, [selectedData])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">Linguistic Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Evaluating linguistic quality through BLEU, METEOR, ROUGE-L scores, and overall linguistic quality metrics to
          assess fluency and readability.
        </p>
      </div>

      <RowSelector data={data} />

      {selectedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.barData && (
              <ChartContainer title="Linguistic Quality Metrics">
                <BarChart data={chartData.barData} />
              </ChartContainer>
            )}

            {chartData.radarData && (
              <ChartContainer title="Linguistic Performance Radar">
                <RadarChart data={chartData.radarData} />
              </ChartContainer>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Question</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.Questions}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Gold Standard Answer</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.Answer}</p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">LLM Response</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.llm_response}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">BLEU Score</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.bleu_score.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">METEOR Score</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.meteor_score.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">ROUGE-L Score</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.rouge_l_score.toFixed(3)}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Linguistic Quality</h3>
              <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedData.linguistic_quality_score.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New bottom graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {linguisticMetricsBar && (
          <ChartContainer title="BLEU, METEOR, ROUGE-L Scores">
            <div onClick={() => setBarModalOpen(true)} className="w-full h-56 cursor-pointer">
              <BarChart data={linguisticMetricsBar} />
            </div>
            <Modal open={barModalOpen} onClose={() => setBarModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <BarChart data={linguisticMetricsBar} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}

        {perplexityLineData && (
          <ChartContainer title="Perplexity Score Across Questions">
            <div onClick={() => setLineModalOpen(true)} className="w-full h-56 cursor-pointer">
              <LineChart data={perplexityLineData} />
            </div>
            <Modal open={lineModalOpen} onClose={() => setLineModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <LineChart data={perplexityLineData} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stackedCompositionData && (
          <ChartContainer title="Linguistic Metric Composition">
            <div onClick={() => setStackedBarModalOpen(true)} className="w-full h-56 cursor-pointer">
              <StackedBarChart data={stackedCompositionData} />
            </div>
            <Modal open={stackedBarModalOpen} onClose={() => setStackedBarModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <StackedBarChart data={stackedCompositionData} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

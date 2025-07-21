"use client"

import { useState, useEffect } from "react"
import { fetchCsvData } from "@/lib/api"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import { getAllDataSources } from "@/lib/data-config"
import { useMemo } from "react"

export default function ComparisonPage() {
  const [comparisonData, setComparisonData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "medical_quality_score",
    "semantic_similarity",
    "linguistic_quality_score",
  ])

  const dataSources = getAllDataSources()

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      const dataMap: Record<string, any[]> = {}

      for (const source of dataSources) {
        try {
          const response = await fetchCsvData(source.id)
          if (response.success) {
            dataMap[source.id] = response.data.data
          }
        } catch (error) {
          console.error(`Failed to load ${source.id}:`, error)
        }
      }

      setComparisonData(dataMap)
      setLoading(false)
    }

    loadAllData()
  }, [])

  const comparisonChartData = useMemo(() => {
    const datasets = Object.entries(comparisonData).map(([sourceId, data], index) => {
      const source = dataSources.find((s) => s.id === sourceId)
      const averages = selectedMetrics.map((metric) => {
        const values = data.map((item) => item[metric]).filter((val) => typeof val === "number")
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      })

      const colors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]

      return {
        label: source?.name || sourceId,
        data: averages,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1,
      }
    })

    return {
      labels: selectedMetrics.map((metric) => metric.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())),
      datasets,
    }
  }, [comparisonData, selectedMetrics, dataSources])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading comparison data...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-base md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Cross-Dataset Comparison</h1>
        <p className="text-gray-400">Compare performance metrics across different evaluation datasets.</p>
      </div>

      <div className="bg-neutral-900 rounded-lg border border-neutral-700 p-6">
        <h3 className="text-xs md:text-lg font-semibold text-gray-200 mb-4">Select Metrics to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "medical_quality_score",
            "semantic_similarity",
            "linguistic_quality_score",
            "bleu_score",
            "rouge_l_score",
            "cosine_similarity",
          ].map((metric) => (
            <label key={metric} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMetrics([...selectedMetrics, metric])
                  } else {
                    setSelectedMetrics(selectedMetrics.filter((m) => m !== metric))
                  }
                }}
                className="rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-300 text-sm">
                {metric.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {comparisonChartData.datasets.length > 0 && (
        <ChartContainer title="Metric Comparison Across Datasets">
          <BarChart data={comparisonChartData} />
        </ChartContainer>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(comparisonData).map(([sourceId, data]) => {
          const source = dataSources.find((s) => s.id === sourceId)
          return (
            <div key={sourceId} className="bg-neutral-200 dark:bg-neutral-700 rounded-lg border border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-semibold text-gray-200 mb-4">{source?.name || sourceId}</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Total Records: {data.length}</div>
                {selectedMetrics.slice(0, 3).map((metric) => {
                  const values = data.map((item) => item[metric]).filter((val) => typeof val === "number")
                  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
                  return (
                    <div key={metric} className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {metric.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </span>
                      <span className="text-gray-200">{(avg * 100).toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

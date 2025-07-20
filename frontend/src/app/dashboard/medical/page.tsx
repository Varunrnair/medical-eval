"use client"

import { useDataSource } from "@/hooks/use-data-source"
import { useSelectedQuestion } from "@/hooks/use-selected-question"
import RowSelector from "@/components/ui/row-selector"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import RadarChart from "@/components/charts/radar-chart"
import { createBarChartData, createRadarChartData } from "@/lib/chart-utils"
import { useMemo } from "react"
import LineChart from "@/components/charts/line-chart"
import StackedBarChart from "@/components/charts/stacked-bar-chart"

export default function MedicalAnalysisPage() {
  const { data, loading, error } = useDataSource("medical-quality-detailed")
  const [selectedIndex] = useSelectedQuestion()


  const selectedData = useMemo(() => {
    if (selectedIndex === null || !data[selectedIndex]) return null

    const item = data[selectedIndex]
    try {
      const axisScores = JSON.parse(item.axis_scores.replace(/'/g, '"'))
      const rubricScores = JSON.parse(item.rubric_scores.replace(/'/g, '"'))
      const rubrics = JSON.parse(item.rubrics.replace(/'/g, '"'))
      return { ...item, parsedAxisScores: axisScores, parsedRubricScores: rubricScores, parsedRubrics: rubrics }
    } catch {
      return item
    }
  }, [data, selectedIndex])

  const chartData = useMemo(() => {
    if (!selectedData?.parsedAxisScores) return { barData: null, radarData: null }

    const scores = selectedData.parsedAxisScores
    const fields = Object.keys(scores)
    const mockData = [scores]

    return {
      barData: createBarChartData(mockData, fields),
      radarData: createRadarChartData(mockData, fields),
    }
  }, [selectedData])

  // New bottom graphs data
  const horizontalBarData = useMemo(() => {
    if (data.length === 0) return null

    const scores = data.map((item, index) => item.medical_quality_score)
    const labels = data.map((item, index) => `Q${index + 1}`)

    return {
      labels,
      datasets: [
        {
          label: "Medical Quality Score",
          data: scores,
          backgroundColor: "#10B981",
          borderColor: "#059669",
          borderWidth: 1,
        },
      ],
    }
  }, [data])

  const fiveAxisRadar = useMemo(() => {
    if (!data[0]) return null

    try {
      const firstItem = data[0]
      const axisScores = JSON.parse(firstItem.axis_scores.replace(/'/g, '"'))
      const mockData = [axisScores]
      const fields = Object.keys(axisScores).slice(0, 5)

      return {
        labels: fields,
        datasets: [
          {
            label: "Medical Quality Dimensions",
            data: fields.map((field) => axisScores[field] || 0),
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderColor: "#10B981",
            pointBackgroundColor: "#10B981",
          },
        ],
      }
    } catch {
      return null
    }
  }, [data])

  const stackedBarData = useMemo(() => {
    if (data.length === 0) return null

    try {
      const labels = data.map((item, index) => `Q${index + 1}`).slice(0, 10)

      // Get all possible axis keys from the first few items
      const allAxisKeys = new Set()
      data.slice(0, 5).forEach((item) => {
        try {
          const axisScores = JSON.parse(item.axis_scores.replace(/'/g, '"'))
          Object.keys(axisScores).forEach((key) => allAxisKeys.add(key))
        } catch {}
      })

      const axisKeysArray = Array.from(allAxisKeys).slice(0, 5)

      if (axisKeysArray.length === 0) return null

      const datasets = axisKeysArray.map((key, index) => {
        const colors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]
        return {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          data: data.slice(0, 10).map((item) => {
            try {
              const axisScores = JSON.parse(item.axis_scores.replace(/'/g, '"'))
              return axisScores[key] || 0
            } catch {
              return 0
            }
          }),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 1,
        }
      })

      return { labels, datasets }
    } catch {
      return null
    }
  }, [data])

  const trendLineData = useMemo(() => {
    if (data.length === 0) return null

    const scores = data.map((item) => item.medical_quality_score)
    const labels = data.map((item, index) => `Record ${index + 1}`)

    return {
      labels,
      datasets: [
        {
          label: "Medical Quality Trend",
          data: scores,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
        },
      ],
    }
  }, [data])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* New top graphs */}


      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Medical Quality Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyzing medical accuracy, completeness, context awareness, communication quality, and terminology
          accessibility for individual responses.
        </p>
      </div>

      <RowSelector data={data} questionField="question" />

      {selectedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.barData && (
              <ChartContainer title="Medical Quality Dimensions">
                <BarChart data={chartData.barData} />
              </ChartContainer>
            )}

            {chartData.radarData && (
              <ChartContainer title="Medical Quality Radar">
                <RadarChart data={chartData.radarData} />
              </ChartContainer>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Question</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.question}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Gold Standard Answer</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.gold_standard_answer}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">LLM Response</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.llm_response}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Overall Medical Quality Score</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {selectedData.medical_quality_score.toFixed(3)}
            </p>
          </div>

          {selectedData.parsedRubrics && selectedData.parsedRubricScores && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Evaluation Rubrics & Scores</h3>
              <div className="space-y-3">
                {selectedData.parsedRubrics.map((rubric: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 mr-4">{rubric}</span>
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        selectedData.parsedRubricScores[rubric] === 1
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {selectedData.parsedRubricScores[rubric] === 1 ? "Pass" : "Fail"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Axes-Scores Table */}
          {selectedData.parsedAxisScores && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Axes Scores Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Axis
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {Object.entries(selectedData.parsedAxisScores).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{key}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {typeof value === "number" ? value.toFixed(3) : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unclassified Rubrics Section */}
          {selectedData &&
            selectedData.parsedRubrics &&
            selectedData.parsedRubricScores &&
            (() => {
              const unclassifiedRubrics = selectedData.parsedRubrics.filter((rubric) => {
                const score = selectedData.parsedRubricScores[rubric]
                return (
                  score === undefined ||
                  score === null ||
                  score === "" ||
                  (typeof score === "string" && score.toLowerCase() === "unclassified")
                )
              })

              return unclassifiedRubrics.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Unclassified Rubrics ({unclassifiedRubrics.length})
                  </h3>
                  <div className="space-y-2">
                    {unclassifiedRubrics.map((rubric, index) => (
                      <div
                        key={index}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800"
                      >
                        <span className="text-sm text-yellow-800 dark:text-yellow-300">{rubric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Unclassified Rubrics</h3>
                  <p className="text-green-600 dark:text-green-400">✓ All rubrics have been classified</p>
                </div>
              )
            })()}
        </div>
      )}

      {/* New bottom graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {horizontalBarData && (
          <ChartContainer title="Medical Quality Score by Question">
            <BarChart data={horizontalBarData} />
          </ChartContainer>
        )}

        {fiveAxisRadar && (
          <ChartContainer title="Five Medical Quality Dimensions">
            <RadarChart data={fiveAxisRadar} />
          </ChartContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stackedBarData && (
          <ChartContainer title="Axis Contribution to Medical Quality">
            <StackedBarChart data={stackedBarData} />
          </ChartContainer>
        )}

        {trendLineData && (
          <ChartContainer title="Medical Quality Score Progression">
            <LineChart data={trendLineData} />
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

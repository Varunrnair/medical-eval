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
import { useState } from "react"
import type { MedicalQualityDetailed } from "@/types/data";
import Modal from "@/components/ui/modal";

export default function MedicalAnalysisPage() {
  const { data, loading, error } = useDataSource("scored-final-dataset") as { data: any[], loading: boolean, error: string | null }
  const [selectedIndex] = useSelectedQuestion()
  const [barModalOpen, setBarModalOpen] = useState(false);
  const [stackedBarModalOpen, setStackedBarModalOpen] = useState(false);
  const [trendLineModalOpen, setTrendLineModalOpen] = useState(false);


  const selectedData = useMemo(() => {
    if (selectedIndex === null || !data[selectedIndex]) return null

    const item = data[selectedIndex]
    try {
      const axisScores = safeJsonParse(item.m1_axis_scores)
      const rubricScores = safeJsonParse(item.m1_rubric_scores)
      const rubrics = safeJsonParse(item.m1_rubrics)
      return { ...item, parsedAxisScores: axisScores, parsedRubricScores: rubricScores, parsedRubrics: rubrics }
    } catch {
      return item
    }
  }, [data, selectedIndex])

  const chartData = useMemo(() => {
    if (!selectedData || typeof selectedData !== "object" || !('parsedAxisScores' in selectedData) || !selectedData.parsedAxisScores) return { barData: null, radarData: null };

    const scores = selectedData.parsedAxisScores;
    const fields = Object.keys(scores);
    const mockData = [scores];

    return {
      barData: createBarChartData(mockData, fields),
      radarData: createRadarChartData(mockData, fields),
    };
  }, [selectedData]);

  // New bottom graphs data
  const horizontalBarData = useMemo(() => {
    if (data.length === 0) return null;

    const scores = data.map((item, index) => item.medical_quality_score);
    const labels = data.map((item, index) => `Q${index + 1}`);

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
    };
  }, [data]);

  const fiveAxisRadar = useMemo(() => {
    if (!data[0]) return null;

    try {
      const firstItem = data[0];
      let axisScores: any = null;
      if (typeof firstItem === "object" && 'm1_axis_scores' in firstItem) {
        axisScores = safeJsonParse((firstItem as any).m1_axis_scores);
      }
      if (!axisScores) return null;
      const mockData = [axisScores];
      const fields = Object.keys(axisScores).slice(0, 5);

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
      };
    } catch {
      return null;
    }
  }, [data]);

  const stackedBarData = useMemo(() => {
    if (data.length === 0) return null;

    try {
      const labels = data.map((item, index) => `Q${index + 1}`);

      // Get all possible axis keys from the first few items
      const allAxisKeys = new Set<string>();
      data.slice(0, 5).forEach((item) => {
        try {
          let axisScores: any = null;
          if (typeof item === "object" && 'm1_axis_scores' in item) {
            axisScores = safeJsonParse((item as any).m1_axis_scores);
          }
          if (axisScores) {
            Object.keys(axisScores).forEach((key) => allAxisKeys.add(key));
          }
        } catch {}
      });

      const axisKeysArray = Array.from(allAxisKeys).slice(0, 5);

      if (axisKeysArray.length === 0) return null;

      const datasets = axisKeysArray.map((key: string, index: number) => {
        const colors = [
          "#3B82F6", // muted blue
          "#6B7280", // grey
          "#14B8A6", // accent teal
          "#9CA3AF", // light grey
          "#D1D5DB", // extra light grey
        ];
        return {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          data: data.map((item) => {
            try {
              let axisScores: any = null;
              if (typeof item === "object" && 'm1_axis_scores' in item) {
                axisScores = safeJsonParse((item as any).m1_axis_scores);
              }
              return axisScores && axisScores[key as string] ? axisScores[key as string] : 0;
            } catch {
              return 0;
            }
          }),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 1,
        };
      });

      return { labels, datasets };
    } catch {
      return null;
    }
  }, [data]);

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


      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">Medical Quality Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyzing medical accuracy, completeness, context awareness, communication quality, and terminology
          accessibility for individual responses.
        </p>
      </div>

      <RowSelector data={data} questionField="Questions" />

      {selectedData && (
        <div className="space-y-6">
          {/* If required fields are missing, show a message */}
          {!(
            typeof selectedData === "object" &&
            "parsedRubrics" in selectedData &&
            "parsedRubricScores" in selectedData &&
            "parsedAxisScores" in selectedData &&
            selectedData.parsedRubrics &&
            selectedData.parsedRubricScores &&
            selectedData.parsedAxisScores
          ) ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold">No data available for this question. (Missing or invalid rubric/axis data)</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.barData && (
                  <ChartContainer title="Average Medical Quality Dimensions">
                    <div className="w-full h-56">
                    <BarChart data={chartData.barData} />
                    </div>
                  </ChartContainer>
                )}

                {chartData.radarData && (
                  <ChartContainer title="Average Medical Quality Radar">
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

              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
                <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Overall Medical Quality Score</h3>
                <p className="text-lg md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {selectedData.medical_quality_score.toFixed(3)}
                </p>
              </div>

              {/* Collapsible Rubrics Section (Simple, clean style) */}
              {typeof selectedData === "object" && "parsedRubrics" in selectedData && "parsedRubricScores" in selectedData && selectedData.parsedRubrics && selectedData.parsedRubricScores && (
                <SimpleDropdown label="Check out the individual rubrics">
                  <ul className="space-y-2 bg-neutral-800 dark:bg-neutral-900 rounded-xl p-4 border border-neutral-700">
                    {selectedData.parsedRubrics.map((rubric: string, index: number) => {
                      const isPass = selectedData.parsedRubricScores[rubric] === 1;
                      return (
                        <li key={index} className="flex items-center justify-between">
                          <span className="text-gray-100 text-sm">{rubric}</span>
                          <span
                            className={`ml-4 px-2 py-0.5 rounded-xl text-xs font-semibold ${
                              isPass
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {isPass ? 'Pass' : 'Fail'}
                        </span>
                      </li>
                      );
                    })}
                  </ul>
                </SimpleDropdown>
              )}

              {/* Collapsible Axes Section + Unclassified Rubrics (Simple UI) */}
              {(() => {
                let mapping: Record<string, string[]> | null = null;
                try {
                  const cls = (selectedData as any).m1_classification;
                  mapping = typeof cls === 'string' ? safeJsonParse(cls) : cls;
                } catch {
                  mapping = null;
                }
                const allRubrics = (typeof selectedData === "object" && "parsedRubrics" in selectedData && Array.isArray(selectedData.parsedRubrics)) ? selectedData.parsedRubrics : [];
                const mappedRubrics = mapping ? Object.values(mapping).flat() : [];
                const unclassifiedAxisRubrics = mapping && mapping.unclassified ? mapping.unclassified : [];
                const unclassifiedRubrics = allRubrics.filter((rubric: string) => {
                  const isUnclassifiedAxis = unclassifiedAxisRubrics.includes(rubric);
                  const notMapped = !mappedRubrics.includes(rubric);
                  const notScored = (
                    !(rubric in selectedData.parsedRubricScores) ||
                    selectedData.parsedRubricScores[rubric] === undefined ||
                    selectedData.parsedRubricScores[rubric] === null ||
                    selectedData.parsedRubricScores[rubric] === "" ||
                    (typeof selectedData.parsedRubricScores[rubric] === "string" &&
                      selectedData.parsedRubricScores[rubric].toLowerCase() === "unclassified")
                  );
                  return isUnclassifiedAxis || notMapped || notScored;
                });
                return (
                  <div className="mb-4">
                <SimpleDropdown label="See rubric-to-axis mapping">
                      <ul className="space-y-4 bg-neutral-800 dark:bg-neutral-900 rounded-xl p-4 border border-neutral-700">
                        {mapping && Object.keys(mapping).length > 0 ? (
                          Object.entries(mapping).map(([axis, rubrics]: [string, any], i: number) => (
                      <li key={axis}>
                              <div className="font-semibold text-gray-100 mb-1">{axis}</div>
                              <ul className="ml-4 space-y-1">
                          {(Array.isArray(rubrics) ? rubrics : []).map((rubric: string, idx: number) => (
                                  <li key={idx} className="text-gray-300 text-sm">{rubric}</li>
                                ))}
                              </ul>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 dark:text-gray-400 italic">No rubric-to-axis mapping data available.</li>
                        )}
                      </ul>
                    </SimpleDropdown>
                    {unclassifiedRubrics.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Unclassified Rubrics ({unclassifiedRubrics.length})
                        </h3>
                        <ul className="list-disc ml-5 text-gray-800 dark:text-gray-200">
                          {unclassifiedRubrics.map((rubric, idx) => (
                            <li key={idx}>{rubric}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-4 text-green-600 dark:text-green-400 text-sm">
                        ✓ All rubrics have been classified
                      </div>
              )}
                  </div>
                );
              })()}

              {/* Axes-Scores Table */}
              {typeof selectedData === "object" && "parsedAxisScores" in selectedData && selectedData.parsedAxisScores && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
                  <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Axes Scores Table</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 dark:bg-neutral-700">
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
                        {Object.entries(selectedData.parsedAxisScores).map(([key, value]: [string, any]) => (
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
            </>
          )}
        </div>
      )}

      {/* New bottom graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {horizontalBarData && (
          <ChartContainer title="Medical Quality Score by Question">
            <div onClick={() => setBarModalOpen(true)} className="w-full h-56 cursor-pointer">
              <BarChart data={horizontalBarData} />
            </div>
            <Modal open={barModalOpen} onClose={() => setBarModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <BarChart data={horizontalBarData} />
                </div>
              </div>
            </Modal>
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
            <div onClick={() => setStackedBarModalOpen(true)} className="w-full h-56 cursor-pointer">
              <StackedBarChart data={stackedBarData} />
            </div>
            <Modal open={stackedBarModalOpen} onClose={() => setStackedBarModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <StackedBarChart data={stackedBarData} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}

        {trendLineData && (
          <ChartContainer title="Medical Quality Score Progression">
            <div onClick={() => setTrendLineModalOpen(true)} className="w-full h-56 cursor-pointer">
              <LineChart data={trendLineData} />
            </div>
            <Modal open={trendLineModalOpen} onClose={() => setTrendLineModalOpen(false)}>
              <div className="w-[1200px] max-w-full">
                <div className="w-full h-[400px]">
            <LineChart data={trendLineData} />
                </div>
              </div>
            </Modal>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}

function SimpleDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 mb-2">
      <button
        className="w-full flex items-center justify-between px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="dropdown-list"
      >
        <span>{label}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div id="dropdown-list" className="px-4 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    try {
      // Try replacing single quotes with double quotes as a fallback
      return JSON.parse(str.replace(/'/g, '"'));
    } catch {
      return null;
    }
  }
}

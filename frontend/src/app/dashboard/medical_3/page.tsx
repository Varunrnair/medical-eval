"use client"

import { useDataSource } from "@/hooks/use-data-source"
import { useSelectedQuestion } from "@/hooks/use-selected-question"
import RowSelector from "@/components/ui/row-selector"
import ChartContainer from "@/components/charts/chart-container"
import BarChart from "@/components/charts/bar-chart"
import RadarChart from "@/components/charts/radar-chart"
import { createBarChartData, createRadarChartData } from "@/lib/chart-utils"
import { useMemo, useState, useEffect } from "react"
import type { MedicalQualityDetailed } from "@/types/data";
import Modal from "@/components/ui/modal";

// Helper to fetch gold standard answers by question
async function fetchGoldStandardAnswers() {
  const res = await fetch("/medical_3/scored_dataset_updated.csv");
  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",");
  const questionIdx = headers.indexOf("Questions");
  const answerIdx = headers.indexOf("Answer");
  const map: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    map[row[questionIdx]?.replace(/^"|"$/g, "")] = row[answerIdx]?.replace(/^"|"$/g, "");
  }
  return map;
}

export default function Medical3AnalysisPage() {
  const { data, loading, error } = useDataSource("medical-3-detailed") as { data: any[], loading: boolean, error: string | null }
  const [selectedIndex] = useSelectedQuestion()
  const [barModalOpen, setBarModalOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [themes, setThemes] = useState<{Theme: string, Rubrics: string[]}[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [goldStandardMap, setGoldStandardMap] = useState<Record<string, string>>({});

  // Load themes and parse rubrics as array
  useEffect(() => {
    fetch("/medical_3/theme_rubric_bank.csv")
      .then((res) => res.text())
      .then((csv) => {
        const lines = csv.split("\n").filter(Boolean);
        const themeData = lines.slice(1).map(line => {
          const [theme, rubricStr] = line.split(/,(.+)/);
          let rubrics: string[] = [];
          try {
            // Try to parse as JSON, replacing double double-quotes with single double quotes
            rubrics = JSON.parse(rubricStr.replace(/""/g, '"'));
          } catch {
            // Fallback: split on '"', remove empty/extra, trim
            rubrics = rubricStr
              .replace(/^\[|\]$/g, "")
              .split(/",\s*"/)
              .map(s => s.replace(/^"|"$/g, "").replace(/""/g, '"').trim())
              .filter(Boolean);
            // Clean up first and last rubric for stray brackets/quotes
            if (rubrics.length > 0) {
              rubrics[0] = rubrics[0].replace(/^\[?"?/, "");
              rubrics[rubrics.length - 1] = rubrics[rubrics.length - 1].replace(/"?\]?$/, "");
            }
          }
          return { Theme: theme, Rubrics: rubrics };
        });
        setThemes(themeData);
        if (themeData.length > 0) setSelectedTheme(themeData[0].Theme);
      });
  }, []);

  // Load gold standard answers
  useEffect(() => {
    fetchGoldStandardAnswers().then(setGoldStandardMap);
  }, []);

  const selectedData = useMemo(() => {
    if (selectedIndex === null || !data[selectedIndex]) return null
    const item = data[selectedIndex]
    try {
      const axisScores = safeJsonParse(item.axis_scores)
      const rubricScores = safeJsonParse(item.rubric_scores_by_axis)
      const allRubricScores = safeJsonParse(item.all_rubric_scores_flat)
      return { ...item, parsedAxisScores: axisScores, parsedRubricScores: rubricScores, parsedAllRubricScores: allRubricScores }
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

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-base md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">Medical 3 Quality Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyzing medical_3 accuracy, completeness, context awareness, communication quality, terminology accessibility, and themes for individual responses.
        </p>
      </div>
      <RowSelector data={data} questionField="question" />
      {selectedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.barData && (
              <ChartContainer title="Medical 3 Quality Dimensions">
                <div onClick={() => setBarModalOpen(true)} className="w-full h-56 cursor-pointer">
                  <BarChart data={chartData.barData} />
                </div>
                <Modal open={barModalOpen} onClose={() => setBarModalOpen(false)}>
                  <div className="w-[1200px] max-w-full">
                    <div className="w-full h-[400px]">
                      <BarChart data={chartData.barData} />
                    </div>
                  </div>
                </Modal>
              </ChartContainer>
            )}
            {chartData.radarData && (
              <ChartContainer title="Medical 3 Quality Radar">
                <div onClick={() => setRadarModalOpen(true)} className="w-full h-56 cursor-pointer">
                  <RadarChart data={chartData.radarData} />
                </div>
                <Modal open={radarModalOpen} onClose={() => setRadarModalOpen(false)}>
                  <div className="w-[1200px] max-w-full">
                    <div className="w-full h-[400px]">
                      <RadarChart data={chartData.radarData} />
                    </div>
                  </div>
                </Modal>
              </ChartContainer>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Question</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.question}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Gold Standard Answer</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{goldStandardMap[selectedData.question?.replace(/^"|"$/g, "")] || <span className="italic text-neutral-400">Not available</span>}</p>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">LLM Response</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedData.llm_response}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
            <h3 className="text-xs md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Overall Medical 3 Quality Score</h3>
            <p className="text-lg md:text-3xl font-bold text-green-600 dark:text-green-400">
              {selectedData.medical_quality_score?.toFixed(3)}
            </p>
          </div>
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
        </div>
      )}
      {/* Theme Selector and Rubrics Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold mb-2">Themes & Rubrics</h2>
        <div className="mb-4">
          <label htmlFor="theme-select" className="block text-sm font-medium mb-1">Select Theme:</label>
          <select
            id="theme-select"
            className="rounded-lg px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm border-0"
            value={selectedTheme}
            onChange={e => setSelectedTheme(e.target.value)}
          >
            {themes.map((theme) => (
              <option key={theme.Theme} value={theme.Theme}>{theme.Theme}</option>
            ))}
          </select>
        </div>
        {themes.find(t => t.Theme === selectedTheme) && (
          <div className="rounded-2xl shadow-md bg-neutral-100 dark:bg-neutral-800 p-5 mt-4">
            <ul className="list-disc list-inside text-gray-800 dark:text-gray-200">
              {themes.find(t => t.Theme === selectedTheme)?.Rubrics.map((rubric, idx) => (
                <li key={idx} className="mb-1 last:mb-0">{rubric}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    try {
      return JSON.parse(str.replace(/'/g, '"'));
    } catch {
      return null;
    }
  }
} 
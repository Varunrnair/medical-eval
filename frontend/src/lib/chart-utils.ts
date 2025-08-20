import type { ChartData, RadarChartData, MetricCard } from "@/types/charts"



export function createPieChartData(data: any[], field: string): ChartData {
  const counts: Record<string, number> = {}

  data.forEach((item) => {
    const value = item[field]
    if (value !== undefined && value !== null) {
      const key = typeof value === "number" ? (value > 0.8 ? "High" : value > 0.6 ? "Medium" : "Low") : String(value)
      counts[key] = (counts[key] || 0) + 1
    }
  })

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        label: field,
        data: Object.values(counts),
        backgroundColor: [
          "#3B82F6", // muted blue
          "#6B7280", // grey
          "#14B8A6", // accent teal
          "#9CA3AF", // light grey
          "#D1D5DB", // extra light grey
        ],
        borderColor: "#1F2937",
        borderWidth: 2,
      },
    ],
  }
}

export function createBarChartData(data: any[], fields: string[]): ChartData {
  const averages = fields.map((field) => {
    const values = data.map((item) => item[field]).filter((val) => typeof val === "number")
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  })

  return {
    labels: fields.map((field) => field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())),
    datasets: [
      {
        label: "Average Scores",
        data: averages,
        backgroundColor: "#3B82F6",
        borderColor: "#6B7280",
        borderWidth: 1,
      },
    ],
  }
}

export function createRadarChartData(data: any[], fields: string[]): RadarChartData {
  const averages = fields.map((field) => {
    const values = data.map((item) => item[field]).filter((val) => typeof val === "number")
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  })

  return {
    labels: fields.map((field) => field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())),
    datasets: [
      {
        label: "Performance Metrics",
        data: averages,
        backgroundColor: "rgba(59, 130, 246, 0.15)", // muted blue fill
        borderColor: "#3B82F6",
        pointBackgroundColor: "#14B8A6", // accent teal
      },
    ],
  }
}

export function createMetricCards(data: any[], fields: string[]): MetricCard[] {
  return fields.map((field) => {
    const values = data.map((item) => item[field]).filter((val) => typeof val === "number")
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    let format: MetricCard["format"] = "decimal"
    if (field === "avg_perplexity_score") format = "percentage"
    return {
      title: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: average,
      format,
    }
  })
}

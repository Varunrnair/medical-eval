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
          "#10B981", // green
          "#F59E0B", // yellow
          "#EF4444", // red
          "#8B5CF6", // purple
          "#06B6D4", // cyan
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
        backgroundColor: "#10B981",
        borderColor: "#059669",
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
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "#10B981",
        pointBackgroundColor: "#10B981",
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

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface MetricCard {
  title: string
  value: number
  change?: number
  format: "percentage" | "decimal" | "integer"
}

export interface RadarChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
    pointBackgroundColor: string
  }[]
}

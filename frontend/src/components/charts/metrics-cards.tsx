import type { MetricCard } from "@/types/charts"

interface MetricsCardsProps {
  metrics: MetricCard[]
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatValue = (value: number, format: MetricCard["format"]) => {
    switch (format) {
      case "percentage":
        return `${(value * 100).toFixed(1)}%`
      case "decimal":
        return value.toFixed(3) // Show 3 decimal places for scores
      case "integer":
        return Math.round(value).toString()
      default:
        return value.toString()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 md:p-5"
        >
          <h3 className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 md:mb-2">{metric.title}</h3>
          <div className="flex items-baseline">
            <p className="text-base md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {formatValue(metric.value, metric.format)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

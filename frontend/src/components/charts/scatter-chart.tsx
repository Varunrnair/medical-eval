"use client"

import { Scatter } from "react-chartjs-2"
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js"

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

interface ScatterChartProps {
  data: {
    datasets: {
      label: string
      data: { x: number; y: number }[]
      backgroundColor: string
      borderColor: string
    }[]
  }
}

export default function ScatterChart({ data }: ScatterChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#E5E7EB",
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#E5E7EB",
        bodyColor: "#E5E7EB",
        borderColor: "#374151",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "#374151",
        },
      },
      y: {
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "#374151",
        },
      },
    },
  }

  return <Scatter data={data} options={options} />
}

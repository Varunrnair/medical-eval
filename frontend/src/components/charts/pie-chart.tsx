"use client"

import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import type { ChartData } from "@/types/charts"

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  data: ChartData
}

export default function PieChart({ data }: PieChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#E5E7EB",
          padding: 20,
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
  }

  return <Pie data={data} options={options} />
}

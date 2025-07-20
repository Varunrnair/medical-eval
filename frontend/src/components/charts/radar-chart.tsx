"use client"

import { Radar } from "react-chartjs-2"
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js"
import type { RadarChartData } from "@/types/charts"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RadarChartProps {
  data: RadarChartData
}

export default function RadarChart({ data }: RadarChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
      r: {
        angleLines: {
          color: "#374151",
        },
        grid: {
          color: "#374151",
        },
        pointLabels: {
          color: "#9CA3AF",
          font: {
            size: 12,
          },
        },
        ticks: {
          color: "#9CA3AF",
          backdropColor: "transparent",
        },
        min: 0,
        max: 1,
      },
    },
  }

  return <Radar data={data} options={options} />
}

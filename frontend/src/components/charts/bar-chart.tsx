"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import type { ChartData } from "@/types/charts"

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  data: ChartData
  useLogScale?: boolean
}

export default function BarChart({ data, useLogScale = false }: BarChartProps) {
  // More subdued, eye-friendly color palette
  const improvedColors = [
    "#6366F1", // Soft indigo
    "#8B5CF6", // Soft purple
    "#06B6D4", // Soft cyan
    "#10B981", // Soft emerald
    "#F59E0B", // Soft amber
    "#EF4444", // Soft red
    "#EC4899", // Soft pink
    "#84CC16", // Soft lime
  ]

  // Update the data with new colors
  const updatedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: improvedColors[index % improvedColors.length],
      borderColor: improvedColors[index % improvedColors.length],
      borderWidth: 1,
    }))
  }

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
      x: {
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "#374151",
        },
      },
      y: {
        type: useLogScale ? 'logarithmic' as const : 'linear' as const,
        ticks: {
          color: "#9CA3AF",
          callback: useLogScale 
            ? function(value: any) {
                // Format log scale ticks nicely
                if (value === 0.001 || value === 0.01 || value === 0.1 || value === 1 || value === 10 || value === 100) {
                  return value.toString()
                }
                return ''
              }
            : undefined,
        },
        grid: {
          color: "#374151",
        },
        min: useLogScale ? 0.001 : undefined, // Set minimum for log scale to avoid issues with 0 values
      },
    },
  }

  return <Bar data={updatedData} options={options} />
}
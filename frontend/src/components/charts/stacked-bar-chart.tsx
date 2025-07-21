"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { useEffect, useState } from "react"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface StackedBarChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
    }[]
  }
}

export default function StackedBarChart({ data }: StackedBarChartProps) {
  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#E5E7EB" : "#374151",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        titleColor: isDark ? "#E5E7EB" : "#374151",
        bodyColor: isDark ? "#E5E7EB" : "#374151",
        borderColor: isDark ? "#374151" : "#E5E7EB",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: isDark ? "#9CA3AF" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: isDark ? "#9CA3AF" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
      },
    },
  }

  return <Bar data={data} options={options} />
}

"use client"

import { Scatter } from "react-chartjs-2"
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js"
import { useEffect, useState } from "react"

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
        ticks: {
          color: isDark ? "#9CA3AF" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
      },
      y: {
        ticks: {
          color: isDark ? "#9CA3AF" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
      },
    },
  }

  return <Scatter data={data} options={options} />
}

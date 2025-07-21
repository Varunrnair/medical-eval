"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import type { ChartData } from "@/types/charts"
import { useEffect, useState } from "react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface LineChartProps {
  data: ChartData
}

export default function LineChart({ data }: LineChartProps) {
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

  return <Line data={data} options={options} />
}

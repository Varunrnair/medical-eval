"use client"

import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { useEffect, useState } from "react"

ChartJS.register(ArcElement, Tooltip, Legend)

interface DonutChartProps {
  data: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
    }[]
  }
}

export default function DonutChart({ data }: DonutChartProps) {
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
        position: "bottom" as const,
        labels: {
          color: isDark ? "#E5E7EB" : "#374151",
          padding: 20,
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
    cutout: "50%",
  }

  return <Doughnut data={data} options={options} />
}

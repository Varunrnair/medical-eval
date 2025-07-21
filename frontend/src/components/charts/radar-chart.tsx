"use client"

import { Radar } from "react-chartjs-2"
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js"
import type { RadarChartData } from "@/types/charts"
import { useEffect, useState } from "react"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RadarChartProps {
  data: RadarChartData
}

export default function RadarChart({ data }: RadarChartProps) {
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
        display: false,
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
      r: {
        angleLines: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
        grid: {
          color: isDark ? "#374151" : "#E5E7EB",
        },
        pointLabels: {
          color: isDark ? "#9CA3AF" : "#374151",
          font: {
            size: 12,
          },
        },
        ticks: {
          color: isDark ? "#9CA3AF" : "#374151",
          backdropColor: "transparent",
        },
        min: 0,
        max: 1,
      },
    },
  }

  return <Radar data={data} options={options} />
}

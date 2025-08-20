"use client"

import { useMemo } from "react"
import { createPieChartData, createBarChartData, createRadarChartData, createMetricCards } from "@/lib/chart-utils"



export function useChartData(data: any[], columns: string[]) {
  const numericColumns = useMemo(() => {
    if (data.length === 0) return []
    const firstRow = data[0]
    return columns.filter((col) => typeof firstRow[col] === "number")
  }, [data, columns])

  const pieChartData = useMemo(() => {
    if (numericColumns.length === 0) return null
    return createPieChartData(data, numericColumns[0])
  }, [data, numericColumns])

  const barChartData = useMemo(() => {
    if (numericColumns.length === 0) return null
    return createBarChartData(data, numericColumns.slice(0, 6))
  }, [data, numericColumns])

  const radarChartData = useMemo(() => {
    if (numericColumns.length === 0) return null
    return createRadarChartData(data, numericColumns.slice(0, 6))
  }, [data, numericColumns])

  const metricCards = useMemo(() => {
    if (numericColumns.length === 0) return []
    return createMetricCards(data, numericColumns.slice(0, 4))
  }, [data, numericColumns])

  return {
    numericColumns,
    pieChartData,
    barChartData,
    radarChartData,
    metricCards,
  }
}

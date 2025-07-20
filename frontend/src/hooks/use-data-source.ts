"use client"

import { useState, useEffect } from "react"
import { fetchCsvData } from "@/lib/api"

export function useDataSource(sourceId: string | null) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sourceId) {
      setData([])
      setColumns([])
      return
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchCsvData(sourceId)
        if (response.success) {
          setData(response.data.data)
          setColumns(response.data.columns)
        } else {
          setError(response.error || "Failed to load data")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sourceId])

  return { data, columns, loading, error }
}

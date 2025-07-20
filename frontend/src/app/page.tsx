"use client"

import { useState, useEffect } from "react"
import { fetchDataSources } from "@/lib/api"
import type { DataSource } from "@/types/data"
import DataSourceCard from "@/components/data/data-source-card"
import LoadingSpinner from "@/components/ui/loading-spinner"
import EmptyState from "@/components/ui/empty-state"
import Link from "next/link"

export default function HomePage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  useEffect(() => {
    const loadDataSources = async () => {
      const response = await fetchDataSources()
      if (response.success) {
        setDataSources(response.data.sources)
      }
      setLoading(false)
    }

    loadDataSources()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Medical QA Evaluation Dashboard</h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Comprehensive analysis and visualization of medical question-answering evaluation results. Explore semantic
          similarity, linguistic quality, and medical accuracy metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Dynamic Visualizations</h3>
          <p className="text-gray-400 text-sm">
            Interactive charts and graphs that adapt to your data sources automatically.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Multi-Metric Analysis</h3>
          <p className="text-gray-400 text-sm">
            Comprehensive evaluation across medical, semantic, and linguistic dimensions.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Real-time Updates</h3>
          <p className="text-gray-400 text-sm">Live data fetching and automatic refresh when source files change.</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Available Data Sources</h2>
          <Link href="/data-sources" className="btn-primary">
            Manage Sources
          </Link>
        </div>

        {dataSources.length === 0 ? (
          <EmptyState
            title="No Data Sources Available"
            description="Configure your data sources to start analyzing medical QA evaluation results."
            action={
              <Link href="/data-sources" className="btn-primary">
                Add Data Source
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dataSources.map((source) => (
              <DataSourceCard
                key={source.id}
                dataSource={source}
                onSelect={setSelectedSource}
                isSelected={selectedSource === source.id}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSource && (
        <div className="text-center">
          <Link href={`/dashboard?source=${selectedSource}`} className="btn-primary text-lg px-8 py-3">
            Analyze Selected Data Source
          </Link>
        </div>
      )}
    </div>
  )
}

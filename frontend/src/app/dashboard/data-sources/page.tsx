"use client"

import { useState, useEffect } from "react"
import { fetchDataSources } from "@/lib/api"
import type { DataSource } from "@/types/data"
import DataSourceCard from "@/components/data/data-source-card"
import LoadingSpinner from "@/components/ui/loading-spinner"
import EmptyState from "@/components/ui/empty-state"



export default function DataSourcesPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Data Sources</h1>
          <p className="text-gray-400">Manage and configure your CSV data sources for analysis.</p>
        </div>
        <button className="btn-primary">Add New Source</button>
      </div>

      {dataSources.length === 0 ? (
        <EmptyState
          title="No Data Sources Configured"
          description="Add CSV data sources to start analyzing your medical QA evaluation results."
          action={<button className="btn-primary">Configure First Source</button>}
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

      {selectedSource && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-sm md:text-lg font-semibold text-gray-200 mb-4">Data Source Details</h3>
          {(() => {
            const source = dataSources.find((s) => s.id === selectedSource)
            if (!source) return null

            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={source.name}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={source.description}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">File Path</label>
                  <input
                    type="text"
                    value={source.filePath}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Schema</label>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <pre className="text-sm text-gray-300">{JSON.stringify(source.schema, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
"use client"

import type { DataSource } from "@/types/data"

interface DataSourceCardProps {
  dataSource: DataSource
  onSelect: (id: string) => void
  isSelected?: boolean
}

export default function DataSourceCard({ dataSource, onSelect, isSelected = false }: DataSourceCardProps) {
  return (
    <div
      className={`bg-gray-900 rounded-lg border p-6 cursor-pointer transition-all hover:border-green-500 ${
        isSelected ? "border-green-500 ring-2 ring-green-500 ring-opacity-20" : "border-gray-700"
      }`}
      onClick={() => onSelect(dataSource.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-200">{dataSource.name}</h3>
        <div className="flex space-x-2">
          {dataSource.visualizations.map((viz) => (
            <span key={viz} className="px-2 py-1 text-xs bg-green-600 text-white rounded">
              {viz}
            </span>
          ))}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">{dataSource.description}</p>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">Schema: {Object.keys(dataSource.schema).length} fields</div>
        <div className="text-xs text-gray-500">
          Last updated: {new Date(dataSource.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

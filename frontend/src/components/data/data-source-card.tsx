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
      className={`bg-neutral-800 rounded-xl border p-6 cursor-pointer transition-all ${
        isSelected ? "border-neutral-500" : "border-neutral-700"
      }`}
      onClick={() => onSelect(dataSource.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-200">{dataSource.name}</h3>
        <div className="flex space-x-2">
          {dataSource.visualizations.map((viz) => (
            <span key={viz} className="px-2 py-1 text-xs bg-neutral-700 text-neutral-100 rounded-xl">
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

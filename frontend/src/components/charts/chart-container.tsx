"use client"

import type { ReactNode } from "react"
import LoadingSpinner from "@/components/ui/loading-spinner"
import ErrorBoundary from "@/components/ui/error-boundary"

interface ChartContainerProps {
  title: string
  children: ReactNode
  loading?: boolean
  error?: string
  className?: string
}

export default function ChartContainer({
  title,
  children,
  loading = false,
  error,
  className = "",
}: ChartContainerProps) {
  return (
    <div className={`bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 ${className}`}>
      <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h3>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-400 text-center">
            <div className="text-lg md:text-2xl mb-2">⚠️</div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <ErrorBoundary>
          <div className="h-64">{children}</div>
        </ErrorBoundary>
      )}
    </div>
  )
}

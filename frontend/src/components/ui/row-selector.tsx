"use client"

import { useSelectedQuestion } from "@/hooks/use-selected-question"

interface RowSelectorProps {
  data: any[]
  questionField?: string
}

export default function RowSelector({ data, questionField = "Questions" }: RowSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useSelectedQuestion()

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Question</label>
      <select
        value={selectedIndex ?? ""}
        onChange={(e) => setSelectedIndex(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md text-gray-900 dark:text-gray-100"
      >
        <option value="">Choose a question...</option>
        {data.map((item, index) => (
          <option key={index} value={index}>
            {item[questionField]?.substring(0, 100)}...
          </option>
        ))}
      </select>
    </div>
  )
}

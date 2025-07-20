"use client"

import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/ui/theme-toggle"

export default function Header() {
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "Overview"

    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace("-", " ")
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{getPageTitle(pathname)}</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

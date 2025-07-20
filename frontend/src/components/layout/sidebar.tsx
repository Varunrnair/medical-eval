"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Medical", href: "/dashboard/medical", icon: "🏥" },
    { name: "Semantic", href: "/dashboard/semantic", icon: "🔍" },
    { name: "Linguistic", href: "/dashboard/linguistic", icon: "📝" },
  ]

  return (
    <div className="bg-white dark:bg-gray-950 w-52 min-h-screen border-r border-gray-200 dark:border-gray-800">
      <div className="p-5">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Medical QA</h1>
      </div>

      <nav className="px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === item.href
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

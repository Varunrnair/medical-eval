"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigation } from "@/config/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white dark:bg-gray-950 w-52 min-h-screen border-r border-gray-200 dark:border-gray-800 hidden sm:block">
      <div className="p-5">
        <Link href="/" className="block text-base font-bold text-gray-900 dark:text-white hover:underline focus:outline-none">
          Medical QA
        </Link>
      </div>

      <nav className="px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === item.href
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
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

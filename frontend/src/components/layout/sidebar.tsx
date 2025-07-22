"use client"

import { usePathname } from "next/navigation"
import { navigation } from "@/config/navigation"
import Image from "next/image"
import Link from "next/link"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 w-52 min-h-screen border-r border-neutral-200 dark:border-neutral-800 hidden sm:block relative">
      <div className="px-5 py-6"> {/* Increased vertical padding here */}
        <div className="group flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 cursor-pointer">
          <Image
            src="/icons/simppl_icon.png"
            alt=""
            width={20}
            height={20}
            className="object-contain"
          />
          <span>Medical QA</span>
        </div>
      </div>

      <nav className="px-2">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === item.href
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
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

"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== "/"
  return (
    <div className="flex h-screen">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showSidebar && <Header />}
        <main className="flex-1 overflow-auto p-4 sm:p-4 p-2">{children}</main>
      </div>
    </div>
  )
} 
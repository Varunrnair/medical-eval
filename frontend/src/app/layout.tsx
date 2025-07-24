import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import LayoutWithSidebar from "@/components/layout/LayoutWithSidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Medical QA Dashboard",
  description: "Medical QA evaluation results dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <LayoutWithSidebar>{children}</LayoutWithSidebar>
      </body>
    </html>
  )
}

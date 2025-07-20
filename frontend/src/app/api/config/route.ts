import { NextResponse } from "next/server"
import { getDataSourceConfig } from "@/lib/data-config"

export async function GET() {
  try {
    const config = getDataSourceConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching configuration:", error)
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 })
  }
}

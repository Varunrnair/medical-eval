import { NextResponse } from "next/server"
import { getAllDataSources } from "@/lib/data-config"



export async function GET() {
  try {
    const dataSources = getAllDataSources()
    return NextResponse.json({ sources: dataSources })
  } catch (error) {
    console.error("Error fetching data sources:", error)
    return NextResponse.json({ error: "Failed to fetch data sources" }, { status: 500 })
  }
}
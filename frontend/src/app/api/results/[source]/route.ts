import { NextResponse } from "next/server"
import { getDataSourceById } from "@/lib/data-config"
import { parseCsvFromPath, getColumnNames } from "@/lib/csv-parser"

export async function GET(request: Request, { params }: { params: { source: string } }) {
  try {
    const sourceConfig = getDataSourceById(params.source)

    if (!sourceConfig) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 })
    }

    // Use the new file system parser for local files
    const csvData = await parseCsvFromPath(sourceConfig.filePath)
    const columns = getColumnNames(csvData)

    return NextResponse.json({
      data: csvData,
      columns,
      rowCount: csvData.length,
      source: sourceConfig,
    })
  } catch (error) {
    console.error("Error fetching CSV data:", error)
    return NextResponse.json({ error: "Failed to fetch CSV data" }, { status: 500 })
  }
}

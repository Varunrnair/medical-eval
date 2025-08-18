import { NextResponse } from "next/server";
import { getDataSourceById } from "@/lib/data-config";
import { parseCsvFromPath, getColumnNames } from "@/lib/csv-parser";

export async function GET(
  request: Request,
  { params }: { params: { source: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get("model");

    const sourceConfig = getDataSourceById(params.source, model || undefined);

    if (!sourceConfig) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 },
      );
    }

    // Parse from model-specific dataset path
    const csvData = await parseCsvFromPath(sourceConfig.filePath);
    const columns = getColumnNames(csvData);

    return NextResponse.json({
      data: csvData,
      columns,
      rowCount: csvData.length,
      source: sourceConfig,
    });
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    return NextResponse.json(
      { error: "Failed to fetch CSV data" },
      { status: 500 },
    );
  }
}

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
    const dataset = searchParams.get("dataset");

    if (!dataset) {
      return NextResponse.json({ error: "Dataset parameter is missing" }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ error: "Model parameter is missing" }, { status: 400 });
    }

    const sourceConfig = getDataSourceById(params.source, dataset, model);

    if (!sourceConfig) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 },
      );
    }

    const csvData = await parseCsvFromPath(sourceConfig.filePath);
    const columns = getColumnNames(csvData);

    return NextResponse.json({
      data: csvData,
      columns,
      rowCount: csvData.length,
      source: sourceConfig,
    });
  } catch (error) {
    console.error(`Error fetching CSV data for source '${params.source}':`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch CSV data";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// app/api/data-sources/route.ts
import { NextResponse } from "next/server";
import { getAllDatasets } from "@/lib/data-config";



export async function GET() {
  try {
    const datasets = getAllDatasets();
    return NextResponse.json({ datasets });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 });
  }
}
import type { ApiResponse, CsvDataResponse } from "@/types/api";

export async function fetchDataSources(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch("/api/data-sources");
    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchCsvData(
  sourceId: string,
  model?: string,
): Promise<ApiResponse<CsvDataResponse>> {
  try {
    const url = model
      ? `/api/results/${sourceId}?model=${encodeURIComponent(model)}`
      : `/api/results/${sourceId}`;
    const response = await fetch(url);
    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    return {
      data: { data: [], columns: [], rowCount: 0 },
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

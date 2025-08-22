import type { ApiResponse, CsvDataResponse } from "@/types/api";



export async function fetchDataSources(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch("/api/data-sources");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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
  dataset?: string,
  model?: string,
): Promise<ApiResponse<CsvDataResponse>> {
  try {
    const params = new URLSearchParams();
    if (dataset) {
      params.append('dataset', dataset);
    }
    if (model) {
      params.append('model', model);
    }

    const queryString = params.toString();
    const url = `/api/results/${sourceId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
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
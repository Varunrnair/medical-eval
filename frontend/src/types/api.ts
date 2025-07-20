import type { DataSource } from "./path-to-datasource" // Assuming DataSource is declared in another file

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface DataSourceResponse {
  sources: DataSource[]
}

export interface CsvDataResponse {
  data: any[]
  columns: string[]
  rowCount: number
}

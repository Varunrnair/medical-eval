import dataSourcesConfig from "@/config/data-sources.json"
import type { DataSource, DataSourceConfig } from "@/types/data"

export function getDataSourceConfig(): DataSourceConfig {
  return dataSourcesConfig as DataSourceConfig
}

export function getDataSourceById(id: string): DataSource | undefined {
  const config = getDataSourceConfig()
  return config.dataSources.find((source) => source.id === id)
}

export function getAllDataSources(): DataSource[] {
  const config = getDataSourceConfig()
  return config.dataSources
}

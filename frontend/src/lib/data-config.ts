import dataSourcesConfig from "@/config/data-sources.json";
import type { DataSource, DataSourceConfig } from "@/types/data";

export function getDataSourceConfig(): DataSourceConfig {
  return dataSourcesConfig as DataSourceConfig;
}

export function getDataSourceById(
  id: string,
  model?: string,
): DataSource | undefined {
  const config = getDataSourceConfig();
  const source = config.dataSources.find((source) => source.id === id);

  if (source && model) {
    // Handle special cases like medical_3 which has a different structure
    if (source.filePath.startsWith("/medical_3/")) {
      // Keep medical_3 paths as is - they have their own subfolder structure
      return source;
    }

    // Update the file path to use the selected model for regular model folders
    return {
      ...source,
      filePath: source.filePath.replace(/^\/[^\/]+\//, `/${model}/`),
    };
  }

  return source;
}

export function getAllDataSources(): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources;
}

// Get model-specific data sources with updated file paths
export function getModelDataSources(model: string): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources.map((source) => {
    // Handle special cases like medical_3 which has a different structure
    if (source.filePath.startsWith("/medical_3/")) {
      // Keep medical_3 paths as is - they have their own subfolder structure
      return source;
    }

    return {
      ...source,
      filePath: source.filePath.replace(/^\/[^\/]+\//, `/${model}/`),
    };
  });
}

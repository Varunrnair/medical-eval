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

  if (source && model && source.filePath.includes("{{MODEL}}")) {
    return {
      ...source,
      filePath: source.filePath.replace("{{MODEL}}", model),
    };
  }

  // If no model is provided or the path has no placeholder, return the original source.
  // You might want to replace {{MODEL}} with a default model here if needed.
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

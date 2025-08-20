import dataSourcesConfig from "@/config/data-sources.json";
import type { DataSource, DataSourceConfig } from "@/types/data";



export function getDataSourceConfig(): DataSourceConfig {
  return dataSourcesConfig as unknown as DataSourceConfig;
}

export function getDataSourceById(
  id: string,
  model?: string,
): DataSource | undefined {
  const config = getDataSourceConfig();
  const source = config.dataSources.find((source) => source.id === id);
  if (source && model && source.filePath.includes("sakhi/{{MODEL}}")) {
    return {
      ...source,
      filePath: source.filePath.replace("sakhi/{{MODEL}}", model),
    };
  }
  return source;
}

export function getAllDataSources(): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources;
}


export function getModelDataSources(model: string): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources.map((source) => {
    if (source.filePath.startsWith("/medical_3/")) {
      return source;
    }
    return {
      ...source,
      filePath: source.filePath.replace(/^\/[^\/]+\//, `${model}/`),
    };
  });
}

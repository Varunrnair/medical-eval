// lib/data-config.ts
import fs from "fs";
import path from "path";
import dataSourcesConfig from "@/config/data-sources.json";
import type { DataSource, DataSourceConfig } from "@/types/data";

const DATASETS_DIR = path.join(process.cwd(), "public", "datasets");

export function getDataSourceConfig(): DataSourceConfig {
  return dataSourcesConfig as unknown as DataSourceConfig;
}

/**
 * Read all dataset folders under public/datasets and list model folders inside each.
 * Returns: [{ dataset: "sakhi", models: ["gpt-4o-mini", "c4ai-aya"] }, ...]
 */
export function getAllDatasets(): { dataset: string; models: string[] }[] {
  try {
    if (!fs.existsSync(DATASETS_DIR)) return [];

    const entries = fs.readdirSync(DATASETS_DIR, { withFileTypes: true });
    const datasets = entries
      .filter((e) => e.isDirectory())
      .map((datasetEntry) => {
        const datasetName = datasetEntry.name;
        const datasetPath = path.join(DATASETS_DIR, datasetName);
        let models: string[] = [];
        try {
          const modelEntries = fs.readdirSync(datasetPath, { withFileTypes: true });
          models = modelEntries.filter((m) => m.isDirectory()).map((m) => m.name);
        } catch (err) {
          models = [];
        }
        return { dataset: datasetName, models };
      });
    return datasets;
  } catch (err) {
    console.error("getAllDatasets error:", err);
    return [];
  }
}

/**
 * Return the raw config entry by id (unchanged), or replace placeholders when dataset+model provided.
 */
export function getDataSourceById(
  id: string,
  dataset?: string,
  model?: string,
): DataSource | undefined {
  const config = getDataSourceConfig();
  const source = config.dataSources.find((s) => s.id === id);
  if (!source) return undefined;

  if (dataset || model) {
    let fp = source.filePath;
    if (dataset) fp = fp.replace("{{DATASET}}", dataset);
    if (model) fp = fp.replace("{{MODEL}}", model);
    return { ...source, filePath: fp };
  }
  return source;
}

/**
 * Return the configured dataSources with placeholders replaced for a specific dataset+model.
 */
export function getModelDataSources(dataset: string, model: string): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources.map((source) => {
    const filePath = source.filePath
      .replace("{{DATASET}}", dataset)
      .replace("{{MODEL}}", model);
    return { ...source, filePath };
  });
}

/**
 * Backwards-compatible getter that returns raw config array.
 */
export function getAllDataSources(): DataSource[] {
  const config = getDataSourceConfig();
  return config.dataSources;
}

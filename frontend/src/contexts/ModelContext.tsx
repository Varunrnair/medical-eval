// contexts/ModelContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ModelContextType {
  selectedDataset: string;
  availableDatasets: string[];
  setSelectedDataset: (dataset: string) => void;

  selectedModel: string;
  availableModels: string[];
  setSelectedModel: (model: string) => void;

  isLoading: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedDataset, setSelectedDatasetState] = useState<string>("");
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);

  const [selectedModel, setSelectedModelState] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // initial load: fetch datasets and models
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch("/api/data-sources");
        if (!res.ok) throw new Error("Failed to fetch datasets");
        const { datasets } = await res.json();
        const names = (datasets || []).map((d: any) => d.dataset);
        setAvailableDatasets(names);

        const savedDataset = localStorage.getItem("selectedDataset");
        const initialDataset = savedDataset && names.includes(savedDataset) ? savedDataset : names[0] || "";
        setSelectedDatasetState(initialDataset);

        const datasetObj = (datasets || []).find((d: any) => d.dataset === initialDataset);
        const models = datasetObj ? datasetObj.models : [];
        setAvailableModels(models);

        const savedModel = localStorage.getItem("selectedModel");
        const initialModel = savedModel && models.includes(savedModel) ? savedModel : models[0] || "";
        setSelectedModelState(initialModel);
      } catch (err) {
        console.error("ModelContext fetchDatasets error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  // whenever dataset changes, update its models (and persist)
  useEffect(() => {
    const updateModelsForDataset = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/data-sources");
        if (!res.ok) throw new Error("Failed to fetch datasets");
        const { datasets } = await res.json();
        const dsObj = (datasets || []).find((d: any) => d.dataset === selectedDataset);
        const models = dsObj ? dsObj.models : [];
        setAvailableModels(models);

        // if selectedModel no longer valid, reset to first
        if (!models.includes(selectedModel)) {
          const newModel = models[0] || "";
          setSelectedModelState(newModel);
          if (newModel) localStorage.setItem("selectedModel", newModel);
        }
        if (selectedDataset) localStorage.setItem("selectedDataset", selectedDataset);
      } catch (err) {
        console.error("ModelContext updateModelsForDataset error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedDataset) updateModelsForDataset();
  }, [selectedDataset]);

  const setSelectedDataset = (dataset: string) => {
    setSelectedDatasetState(dataset);
    localStorage.setItem("selectedDataset", dataset);
  };

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    localStorage.setItem("selectedModel", model);
  };

  return (
    <ModelContext.Provider
      value={{
        selectedDataset,
        availableDatasets,
        setSelectedDataset,
        selectedModel,
        availableModels,
        setSelectedModel,
        isLoading,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
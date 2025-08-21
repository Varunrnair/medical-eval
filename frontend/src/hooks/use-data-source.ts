"use client";

import { useState, useEffect } from "react";
import { fetchCsvData } from "@/lib/api";
import { useModel } from "@/contexts/ModelContext";



export function useDataSource(sourceId: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedModel, selectedDataset } = useModel();

  useEffect(() => {
    if (!sourceId || !selectedModel || !selectedDataset) {
      setData([]);
      setColumns([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchCsvData(sourceId, selectedDataset, selectedModel);
        if (response.success) {
          setData(response.data.data);
          setColumns(response.data.columns);
        } else {
          setError(response.error || "Failed to load data");
          setData([]);
          setColumns([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sourceId, selectedModel, selectedDataset]);

  return { data, columns, loading, error };
}
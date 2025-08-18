"use client";

import { useState, useEffect } from "react";
import { fetchCsvData } from "@/lib/api";
import { useModel } from "@/contexts/ModelContext";

export function useModelData(sourceId: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedModel } = useModel();

  useEffect(() => {
    if (!sourceId || !selectedModel) {
      setData([]);
      setColumns([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchCsvData(sourceId, selectedModel);
        if (response.success) {
          setData(response.data.data);
          setColumns(response.data.columns);
        } else {
          setError(response.error || "Failed to load data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sourceId, selectedModel]);

  return {
    data,
    columns,
    loading,
    error,
    selectedModel
  };
}

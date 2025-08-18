"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface ModelContextType {
  selectedModel: string
  availableModels: string[]
  setSelectedModel: (model: string) => void
  isLoading: boolean
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<string>("")
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available models from the public directory
  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        const response = await fetch('/api/models')
        if (response.ok) {
          const models = await response.json()
          setAvailableModels(models)

          // Set the first model as default if none is selected
          if (models.length > 0 && !selectedModel) {
            setSelectedModelState(models[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch available models:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableModels()
  }, [])

  // Load selected model from localStorage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel')
    if (savedModel && availableModels.includes(savedModel)) {
      setSelectedModelState(savedModel)
    }
  }, [availableModels])

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model)
    localStorage.setItem('selectedModel', model)
  }

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        availableModels,
        setSelectedModel,
        isLoading
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider')
  }
  return context
}

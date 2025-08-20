"use client"

import { useState, useEffect } from "react"

let globalSelectedIndex: number | null = null
let listeners: ((index: number | null) => void)[] = []



export function useSelectedQuestion() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(globalSelectedIndex)

  useEffect(() => {
    const listener = (index: number | null) => {
      setSelectedIndex(index)
    }
    listeners.push(listener)

    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const setGlobalSelectedIndex = (index: number | null) => {
    globalSelectedIndex = index
    listeners.forEach((listener) => listener(index))
  }

  return [selectedIndex, setGlobalSelectedIndex] as const
}

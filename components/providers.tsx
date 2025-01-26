"use client"

import { createContext, useContext, useState } from "react"

interface AIProviderState {
  provider: string | null
  apiKey: string | null
  setProviderConfig: (provider: string, apiKey: string) => void
}

const AIProviderContext = createContext<AIProviderState | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  const setProviderConfig = (newProvider: string, newApiKey: string) => {
    setProvider(newProvider)
    setApiKey(newApiKey)
  }

  return (
    <AIProviderContext.Provider value={{ provider, apiKey, setProviderConfig }}>{children}</AIProviderContext.Provider>
  )
}

export function useAIProvider() {
  const context = useContext(AIProviderContext)
  if (context === undefined) {
    throw new Error("useAIProvider must be used within a Providers component")
  }
  return context
}


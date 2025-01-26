"use client"

import { useState } from "react"
import { Header } from "./components/header"
import { VideoForm } from "./components/video-form"
import { ScriptSections } from "./components/script-sections"
import { generateVideoScript, generateImagePrompt } from "./actions"
import type { Section } from "./types"

export default function Page() {
  const [sections, setSections] = useState<Section[]>([])
  const [imagePrompt, setImagePrompt] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  const handleProviderChange = (newProvider: string, newApiKey: string) => {
    setProvider(newProvider)
    setApiKey(newApiKey)
    setApiKeyError(null)
  }

  const handleGenerate = async (concept: string, numParts: number) => {
    if (!provider || !apiKey) {
      setApiKeyError("Please set your AI provider and API key first.")
      return
    }

    setIsGenerating(true)
    setApiKeyError(null)
    try {
      const [script, prompt] = await Promise.all([
        generateVideoScript(concept, numParts, provider, apiKey),
        generateImagePrompt(concept, provider, apiKey),
      ])
      setSections(script)
      setImagePrompt(prompt)
    } catch (error) {
      console.error("Failed to generate content:", error)
      setApiKeyError("An error occurred while generating content. Please check your API key and try again.")
    }
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onProviderChange={handleProviderChange} />
      <main className="container mx-auto px-4 py-8">
        {apiKeyError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
            <p>{apiKeyError}</p>
          </div>
        )}
        {!provider || !apiKey ? (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Set Your AI Provider and API Key</h2>
            <p className="mb-4">
              Please use the dropdown in the header to select an AI provider and enter your API key.
            </p>
          </div>
        ) : (
          <>
            <VideoForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            {sections.length > 0 && <ScriptSections sections={sections} />}
            {imagePrompt && (
              <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Image Prompt</h2>
                <p>{imagePrompt}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}


export interface Section {
  id: string
  title: string
  content: string
  imageSuggestions: string[]
  imageUrls: string[]
  imageData?: string[]
  audioUrl?: string
  audioData?: string
}

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string // Add this line to support custom base URLs
}

export interface VideoGenerationConfig {
  projectTitle: string
  scriptConfig: AIConfig
  imageConfig: AIConfig
  audioConfig: AIConfig
}

export interface GenerationHistoryItem {
  id: string
  concept: string
  numParts: number
  scriptProvider: string
  imageProvider: string
  sections: Section[]
  createdAt: string
  mainImageUrl?: string
  mainImageData?: string
}

export type OpenAIModel = {
  id: string
  name: string
  description: string
  contextWindow: number
  maxOutputTokens: number
}

export interface HistoryExport {
  version: "1.0" | "1.1" | "1.2"
  history: GenerationHistoryItem[]
}


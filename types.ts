export interface Section {
  id: string
  title: string
  content: string
  imageSuggestion: string
  imageUrl?: string
  imageData?: string
}

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
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


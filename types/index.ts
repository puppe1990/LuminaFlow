export interface Section {
  id: string
  title: string
  content: string
  imageUrls?: string[]
  imageSuggestions?: string[]
  audioUrl?: string
}

export interface AIConfig {
  provider: string
  apiKey: string
}

export interface VideoGenerationConfig {
  scriptConfig: AIConfig
  imageConfig: AIConfig
}


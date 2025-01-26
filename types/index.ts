export interface Section {
  id: string
  title: string
  content: string
  audioUrl?: string
  imageSuggestion?: string
}

export interface AIConfig {
  provider: string
  apiKey: string
}

export interface VideoGenerationConfig {
  scriptConfig: AIConfig
  imageConfig: AIConfig
}


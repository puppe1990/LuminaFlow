import JSZip from "jszip"
import type { VideoGenerationConfig, GenerationHistoryItem, Section, HistoryExport } from "@/types"

export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  try {
    localStorage.setItem(`apiKey_${provider}`, apiKey)
    console.log(`API key saved for provider: ${provider}`)
  } catch (error) {
    console.error(`Error saving API key for provider ${provider}:`, error)
    throw error
  }
}

export async function getApiKey(provider: string): Promise<string | null> {
  try {
    const apiKey = localStorage.getItem(`apiKey_${provider}`)
    console.log(`API key retrieved for provider: ${provider}`)
    return apiKey
  } catch (error) {
    console.error(`Error retrieving API key for provider ${provider}:`, error)
    return null
  }
}

export async function saveGenerationHistory(
  concept: string,
  numParts: number,
  scriptProvider: string,
  imageProvider: string,
  sections: Section[],
  mainImageUrl?: string,
): Promise<GenerationHistoryItem> {
  try {
    const history = JSON.parse(localStorage.getItem("generationHistory") || "[]")
    const newItem: GenerationHistoryItem = {
      id: Date.now().toString(),
      concept,
      numParts,
      scriptProvider,
      imageProvider,
      sections,
      createdAt: new Date().toISOString(),
      mainImageUrl,
    }
    history.unshift(newItem)
    localStorage.setItem("generationHistory", JSON.stringify(history.slice(0, 10)))
    console.log("Generation history saved successfully", newItem)
    return newItem
  } catch (error) {
    console.error("Error saving generation history:", error)
    throw error
  }
}

export function getGenerationHistory(): GenerationHistoryItem[] {
  try {
    const history = JSON.parse(localStorage.getItem("generationHistory") || "[]")
    console.log("Generation history retrieved successfully")
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error("Error retrieving generation history:", error)
    return []
  }
}

export function saveConfig(config: VideoGenerationConfig): void {
  try {
    localStorage.setItem("videoGenerationConfig", JSON.stringify(config))
    console.log("Video generation config saved:", config)
  } catch (error) {
    console.error("Error saving video generation config:", error)
    throw error
  }
}

export function getConfig(): VideoGenerationConfig {
  try {
    const savedConfig = localStorage.getItem("videoGenerationConfig")
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig)
      console.log("Retrieved video generation config:", parsedConfig)
      return {
        ...parsedConfig,
        audioConfig: parsedConfig.audioConfig || { provider: "", apiKey: "", model: "" },
      }
    }
  } catch (error) {
    console.error("Error retrieving video generation config:", error)
  }

  const defaultConfig: VideoGenerationConfig = {
    projectTitle: "",
    scriptConfig: { provider: "", apiKey: "", model: "" },
    imageConfig: { provider: "", apiKey: "", model: "" },
    audioConfig: { provider: "", apiKey: "", model: "" },
  }
  console.log("Using default video generation config:", defaultConfig)
  return defaultConfig
}

export function exportHistory(): HistoryExport {
  const history = JSON.parse(localStorage.getItem("generationHistory") || "[]")
  return {
    version: "1.0",
    history,
  }
}

export function importHistory(historyExport: HistoryExport): void {
  if (historyExport.version !== "1.0" && historyExport.version !== "1.1") {
    throw new Error("Unsupported history version")
  }
  if (!Array.isArray(historyExport.history)) {
    throw new Error("Invalid history format")
  }

  const existingHistory = JSON.parse(localStorage.getItem("generationHistory") || "[]")
  const mergedHistory = historyExport.history
    .map((importedItem) => {
      const existingItem = existingHistory.find((item) => item.id === importedItem.id)
      if (existingItem) {
        return {
          ...existingItem,
          ...importedItem,
          sections: importedItem.sections.map((importedSection) => {
            const existingSection = existingItem.sections.find((s) => s.id === importedSection.id)
            if (existingSection) {
              return {
                ...existingSection,
                ...importedSection,
                imageSuggestion: importedSection.imageSuggestion || existingSection.imageSuggestion,
              }
            }
            return importedSection
          }),
        }
      }
      return importedItem
    })
    .concat(
      existingHistory.filter((item) => !historyExport.history.some((importedItem) => importedItem.id === item.id)),
    )

  // Remove duplicates based on id
  const uniqueHistory = mergedHistory.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))

  // Sort by createdAt in descending order
  uniqueHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Limit to the most recent 100 items
  const trimmedHistory = uniqueHistory.slice(0, 100)

  localStorage.setItem("generationHistory", JSON.stringify(trimmedHistory))
  // Trigger a storage event to update components
  window.dispatchEvent(new Event("storage"))
}

export function deleteHistoryItem(id: string): void {
  try {
    const history = JSON.parse(localStorage.getItem("generationHistory") || "[]")
    const updatedHistory = history.filter((item: GenerationHistoryItem) => item.id !== id)
    localStorage.setItem("generationHistory", JSON.stringify(updatedHistory))
    console.log(`History item with id ${id} deleted successfully`)
    // Trigger a storage event to update components
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error deleting history item:", error)
    throw error
  }
}

export async function exportHistoryWithImages(): Promise<Blob> {
  const history = JSON.parse(localStorage.getItem("generationHistory") || "[]")
  const historyExport: HistoryExport = {
    version: "1.2",
    history: history.map((item: GenerationHistoryItem) => ({
      ...item,
      mainImageData: item.mainImageData || null,
      sections: item.sections.map((section) => ({
        ...section,
        imageData: section.imageData || null,
      })),
    })),
  }

  const zip = new JSZip()
  zip.file("history.json", JSON.stringify(historyExport, null, 2))

  console.log("Starting image export process...")

  // We don't need to add separate image files to the ZIP anymore
  // as the image data is now included in the JSON

  console.log("Generating ZIP file...")
  const zipBlob = await zip.generateAsync({ type: "blob" })
  console.log("ZIP file generated successfully")

  return zipBlob
}

function getFileExtension(url: string): string {
  const extension = url.split(".").pop()?.split(/[#?]/)[0].toLowerCase()
  return extension ? `.${extension}` : ".png"
}

export async function importHistoryWithImages(zipFile: File): Promise<void> {
  const zip = new JSZip()
  const contents = await zip.loadAsync(zipFile)

  const historyJson = await contents.file("history.json")?.async("string")
  if (!historyJson) {
    throw new Error("Invalid zip file: history.json not found")
  }

  const historyExport: HistoryExport = JSON.parse(historyJson)
  if (historyExport.version !== "1.2") {
    throw new Error("Unsupported history version")
  }

  // No need to process images separately as they are now included in the JSON

  // Merge with existing history
  const existingHistory = JSON.parse(localStorage.getItem("generationHistory") || "[]")
  const mergedHistory = [...historyExport.history, ...existingHistory]

  // Remove duplicates based on id
  const uniqueHistory = mergedHistory.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))

  // Sort by createdAt in descending order
  uniqueHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Limit to the most recent 100 items
  const trimmedHistory = uniqueHistory.slice(0, 100)

  localStorage.setItem("generationHistory", JSON.stringify(trimmedHistory))
  // Trigger a storage event to update components
  window.dispatchEvent(new Event("storage"))
}


"use client"

import { useState, useEffect, useRef } from "react"
import { VideoForm } from "@/components/video-form"
import { ScriptSections } from "@/components/script-sections"
import { AIProviderConfig } from "@/components/ai-provider-config"
import { generateContent } from "@/lib/api"
import {
  getConfig,
  saveGenerationHistory,
  saveConfig,
  getGenerationHistory,
  exportHistory,
  exportHistoryWithImages,
  importHistory,
  importHistoryWithImages,
  deleteHistoryItem,
} from "@/lib/db"
import type { Section, VideoGenerationConfig, GenerationHistoryItem, HistoryExport, AIConfig } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Upload, Trash2, Key } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = "your-secret-key" // Replace with a secure key in production

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([])
  const [imagePrompt, setImagePrompt] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [config, setConfig] = useState<VideoGenerationConfig>(() => {
    const loadedConfig = getConfig()
    console.log("Loaded config:", loadedConfig)
    return {
      projectTitle: loadedConfig.projectTitle || "",
      scriptConfig: loadedConfig.scriptConfig || { provider: "", apiKey: "", model: "" },
      imageConfig: loadedConfig.imageConfig || { provider: "", apiKey: "", model: "" },
      audioConfig: loadedConfig.audioConfig || { provider: "", apiKey: "", model: "" },
    }
  })
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const configFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isImportingConfig, setIsImportingConfig] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      const historyItems = await getGenerationHistory()
      setHistory(historyItems)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    const refreshHistory = () => {
      const updatedHistory = getGenerationHistory()
      setHistory(updatedHistory)
    }

    refreshHistory()
    window.addEventListener("storage", refreshHistory)

    return () => {
      window.removeEventListener("storage", refreshHistory)
    }
  }, [])

  const handleConfigChange = (newConfig: VideoGenerationConfig) => {
    console.log("Updating config:", newConfig)
    const updatedConfig = {
      projectTitle: newConfig.projectTitle || "",
      scriptConfig: newConfig.scriptConfig || { provider: "", apiKey: "", model: "" },
      imageConfig: newConfig.imageConfig || { provider: "", apiKey: "", model: "" },
      audioConfig: newConfig.audioConfig || { provider: "", apiKey: "", model: "" },
    }
    setConfig(updatedConfig)
    saveConfig(updatedConfig)
  }

  const handleProjectTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setConfig((prevConfig) => ({
      ...prevConfig,
      projectTitle: newTitle,
    }))
    saveConfig({ ...config, projectTitle: newTitle })
  }

  const handleGenerate = async (concept: string, numParts: number) => {
    const { scriptConfig, imageConfig } = config

    if (!scriptConfig.provider || !scriptConfig.apiKey || (scriptConfig.provider === "openai" && !scriptConfig.model)) {
      setApiError(
        "Please set the script generation configuration, including provider, API key, and model (if applicable)",
      )
      return
    }

    if (!imageConfig.provider || !imageConfig.apiKey || (imageConfig.provider === "openai" && !imageConfig.model)) {
      setApiError(
        "Please set the image generation configuration, including provider, API key, and model (if applicable)",
      )
      return
    }

    setIsGenerating(true)
    setApiError(null)
    setImageError(null)
    setSections([])
    setImagePrompt(null)
    setImageUrl(null)

    try {
      console.log("Generating content with:", { concept, numParts, scriptConfig, imageConfig })
      const result = await generateContent(concept, numParts, scriptConfig, imageConfig)
      console.log("Generated content result:", result)

      if (!result.script || !Array.isArray(result.script) || result.script.length === 0) {
        throw new Error("Invalid or empty script received from the server")
      }

      setSections(result.script)
      setImagePrompt(result.imagePrompt)
      setImageUrl(result.imageUrl)
      setImageError(result.imageError)

      const historyItem = await saveGenerationHistory(
        concept,
        numParts,
        scriptConfig.provider,
        imageConfig.provider,
        result.script,
        result.imageUrl,
      )
      setHistory((prevHistory) => [historyItem, ...prevHistory])

      toast({
        title: "Success",
        description: "Video script generated successfully" + (result.imageError ? ", but image generation failed" : ""),
      })

      if (result.imageError) {
        setImageError(result.imageError)
        toast({
          title: "Image Generation Failed",
          description: result.imageError,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate content:", error)
      if (error instanceof Error) {
        setApiError(`Error: ${error.message}`)
        if (error.message.includes("Authentication failed")) {
          toast({
            title: "Authentication Error",
            description: "Please check your API key and try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to generate content. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        setApiError("An unknown error occurred while generating content")
        toast({
          title: "Error",
          description: "An unknown error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateImage = async (sectionId: string, prompt: string, imageConfig: AIConfig) => {
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          config: imageConfig,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Fetch the image data
      const imageResponse = await fetch(data.imageUrl)
      const imageBlob = await imageResponse.blob()
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(imageBlob)
      })

      setSections((prevSections) =>
        prevSections.map((section) =>
          section.id === sectionId ? { ...section, imageUrl: data.imageUrl, imageData } : section,
        ),
      )

      // Update the history with the new image data
      setHistory((prevHistory) =>
        prevHistory.map((item) => ({
          ...item,
          sections: item.sections.map((section) =>
            section.id === sectionId ? { ...section, imageUrl: data.imageUrl, imageData } : section,
          ),
        })),
      )

      // Save the updated history to localStorage
      localStorage.setItem("generationHistory", JSON.stringify(history))

      return data.imageUrl
    } catch (error) {
      console.error("Failed to generate image:", error)
      throw error
    }
  }

  const handleUploadImage = async (sectionId: string, file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file)

      // Convert the file to base64
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      setSections((prevSections) =>
        prevSections.map((section) => (section.id === sectionId ? { ...section, imageUrl, imageData } : section)),
      )

      // Update the history with the new image data
      setHistory((prevHistory) =>
        prevHistory.map((item) => ({
          ...item,
          sections: item.sections.map((section) =>
            section.id === sectionId ? { ...section, imageUrl, imageData } : section,
          ),
        })),
      )

      // Save the updated history to localStorage
      localStorage.setItem("generationHistory", JSON.stringify(history))

      return imageUrl
    } catch (error) {
      console.error("Failed to upload image:", error)
      throw error
    }
  }

  const handleDeleteImage = (sectionId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId ? { ...section, imageUrl: undefined, imageData: undefined } : section,
      ),
    )

    // Update the history by removing the image data
    setHistory((prevHistory) =>
      prevHistory.map((item) => ({
        ...item,
        sections: item.sections.map((section) =>
          section.id === sectionId ? { ...section, imageUrl: undefined, imageData: undefined } : section,
        ),
      })),
    )

    // Save the updated history to localStorage
    localStorage.setItem("generationHistory", JSON.stringify(history))
  }

  const handleHistorySelect = (id: string) => {
    const selectedItem = history.find((item) => item.id === id)
    if (selectedItem) {
      setSections(selectedItem.sections)
      setImagePrompt(null)
      setImageUrl(null)
      setImageError(null)
    }
  }

  const handleExportHistory = async (type: "json" | "zip") => {
    try {
      if (type === "json") {
        const historyExport = exportHistory()
        const blob = new Blob([JSON.stringify(historyExport, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "ai-video-creator-history.json"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        console.log("Starting ZIP export...")
        const zipBlob = await exportHistoryWithImages()
        console.log("ZIP blob created, size:", zipBlob.size)
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "ai-video-creator-history.zip"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        console.log("ZIP export completed")
      }
      toast({
        title: "Export Successful",
        description: `History exported as ${type.toUpperCase()} successfully.`,
      })
    } catch (error) {
      console.error("Failed to export history:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("Selected file:", file.name, file.type)
      setImportFile(file)
      setIsImportDialogOpen(true)
    } else {
      console.log("No file selected")
    }
  }

  const handleDeleteSection = (sectionId: string) => {
    setSections((prevSections) => prevSections.filter((section) => section.id !== sectionId))
  }

  const handleDeleteHistoryItem = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteHistoryItem = () => {
    if (itemToDelete) {
      deleteHistoryItem(itemToDelete)
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== itemToDelete))
      toast({
        title: "History Item Deleted",
        description: "The selected history item has been removed.",
      })
    }
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const handleImportConfirm = async () => {
    if (importFile) {
      try {
        if (importFile.name.endsWith(".json")) {
          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string
              const historyExport: HistoryExport = JSON.parse(content)
              await importHistory(historyExport)
              const updatedHistory = getGenerationHistory()
              setHistory(updatedHistory)
              toast({
                title: "History Imported",
                description: "Your generation history has been successfully imported and merged.",
              })
            } catch (error) {
              console.error("Error parsing or importing JSON:", error)
              toast({
                title: "Import Failed",
                description: "Failed to import JSON history. The file may be corrupted or in an invalid format.",
                variant: "destructive",
              })
            }
          }
          reader.readAsText(importFile)
        } else if (importFile.name.endsWith(".zip")) {
          try {
            await importHistoryWithImages(importFile)
            const updatedHistory = getGenerationHistory()
            setHistory(updatedHistory)
            toast({
              title: "History Imported",
              description: "Your generation history has been successfully imported and merged.",
            })
          } catch (error) {
            console.error("Error importing ZIP file:", error)
            toast({
              title: "Import Failed",
              description: "Failed to import ZIP history. The file may be corrupted or in an invalid format.",
              variant: "destructive",
            })
          }
        } else {
          throw new Error("Unsupported file format")
        }
      } catch (error) {
        console.error("Error importing history:", error)
        toast({
          title: "Import Failed",
          description: `Failed to import history: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        })
      }
    }
    setIsImportDialogOpen(false)
    setImportFile(null)
  }

  const handleImportCancel = () => {
    setIsImportDialogOpen(false)
    setImportFile(null)
  }

  const encryptConfig = (config: VideoGenerationConfig): string => {
    const jsonString = JSON.stringify(config)
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
  }

  const decryptConfig = (encryptedData: string): VideoGenerationConfig => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8)
      if (!decryptedString) {
        throw new Error("Decryption failed")
      }
      const parsedConfig = JSON.parse(decryptedString)
      if (typeof parsedConfig !== "object" || !parsedConfig.scriptConfig || !parsedConfig.imageConfig) {
        throw new Error("Invalid configuration format")
      }
      return parsedConfig
    } catch (error) {
      console.error("Error decrypting config:", error)
      throw new Error("Failed to decrypt configuration")
    }
  }

  const handleExportConfig = () => {
    const encryptedConfig = encryptConfig(config)
    const blob = new Blob([encryptedConfig], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-video-creator-config.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Config Exported",
      description: "Your configuration has been exported successfully.",
    })
  }

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsImportingConfig(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const encryptedContent = e.target?.result as string
          const decryptedConfig = decryptConfig(encryptedContent)

          // Ensure the decrypted config has the expected structure
          if (typeof decryptedConfig !== "object" || !decryptedConfig.scriptConfig || !decryptedConfig.imageConfig) {
            throw new Error("Invalid configuration format")
          }

          // Merge the imported config with the current config to ensure all fields are present
          const mergedConfig = {
            ...config,
            ...decryptedConfig,
            scriptConfig: { ...config.scriptConfig, ...decryptedConfig.scriptConfig },
            imageConfig: { ...config.imageConfig, ...decryptedConfig.imageConfig },
          }

          setConfig(mergedConfig)
          saveConfig(mergedConfig)
          toast({
            title: "Config Imported",
            description: "Your configuration has been imported successfully.",
          })
        } catch (error) {
          console.error("Error importing config:", error)
          toast({
            title: "Import Failed",
            description: "Failed to import configuration. The file may be corrupted or in an invalid format.",
            variant: "destructive",
          })
        } finally {
          setIsImportingConfig(false)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => (section.id === sectionId ? { ...section, title: newTitle } : section)),
    )
  }

  const handleUpdateImageSuggestion = (sectionId: string, newSuggestion: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId ? { ...section, imageSuggestion: newSuggestion } : section,
      ),
    )
  }

  const handleGenerateAudio = async (sectionId: string, text: string, audioConfig: AIConfig) => {
    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          config: audioConfig,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setSections((prevSections) =>
        prevSections.map((section) => (section.id === sectionId ? { ...section, audioUrl: data.audioUrl } : section)),
      )

      // Update the history with the new audio data
      setHistory((prevHistory) =>
        prevHistory.map((item) => ({
          ...item,
          sections: item.sections.map((section) =>
            section.id === sectionId ? { ...section, audioUrl: data.audioUrl } : section,
          ),
        })),
      )

      // Save the updated history to localStorage
      localStorage.setItem("generationHistory", JSON.stringify(history))

      return data.audioUrl
    } catch (error) {
      console.error("Failed to generate audio:", error)
      throw error
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Your Video</h1>
      <div className="mb-4">
        <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Project Title
        </label>
        <Input
          id="projectTitle"
          value={config.projectTitle}
          onChange={handleProjectTitleChange}
          placeholder="Enter project title"
          className="max-w-md"
        />
      </div>
      <AIProviderConfig config={config} onConfigChange={handleConfigChange} />
      <div className="mt-4 flex gap-4">
        <Button onClick={handleExportConfig} variant="outline">
          <Key className="mr-2 h-4 w-4" />
          Export Config
        </Button>
        <Button onClick={() => configFileInputRef.current?.click()} variant="outline" disabled={isImportingConfig}>
          <Upload className="mr-2 h-4 w-4" />
          {isImportingConfig ? "Importing..." : "Import Config"}
        </Button>
        <input
          type="file"
          ref={configFileInputRef}
          onChange={handleImportConfig}
          accept=".json"
          style={{ display: "none" }}
        />
      </div>
      {apiError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <div className="mt-8">
        <VideoForm onGenerate={handleGenerate} isGenerating={isGenerating} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <div className="flex items-center gap-4 mb-4">
          <Select onValueChange={handleHistorySelect}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a previous generation" />
            </SelectTrigger>
            <SelectContent>
              {history.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {item.concept} ({new Date(item.createdAt).toLocaleString()})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteHistoryItem(item.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export History
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleExportHistory("json")}>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExportHistory("zip")}>
                Export as ZIP (with images)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import History
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportHistory}
            accept=".json,.zip"
            style={{ display: "none" }}
          />
        </div>
      </div>
      {sections.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Generated Script with Image and Audio</h2>
          <ScriptSections
            sections={sections}
            onGenerateImage={handleGenerateImage}
            onGenerateAudio={handleGenerateAudio}
            onDeleteSection={handleDeleteSection}
            onUploadImage={handleUploadImage}
            onDeleteImage={handleDeleteImage}
            imageConfig={config.imageConfig}
            audioConfig={config.audioConfig}
            onUpdateSectionTitle={handleUpdateSectionTitle}
            onUpdateImageSuggestion={handleUpdateImageSuggestion}
          />
        </div>
      )}
      {imagePrompt && (
        <div className="mt-8 p-4 bg-secondary rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Main Image Prompt</h2>
          <p>{imagePrompt}</p>
        </div>
      )}
      {imageUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Generated Image</h2>
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt="Generated image"
            width={500}
            height={500}
            className="rounded-lg"
          />
        </div>
      )}
      {imageError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Image Generation Error</AlertTitle>
          <AlertDescription>{imageError}</AlertDescription>
        </Alert>
      )}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              Importing a new history will merge it with your existing history. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleImportCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleImportConfirm}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this history item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={confirmDeleteHistoryItem} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}


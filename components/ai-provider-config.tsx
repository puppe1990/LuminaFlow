"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { AIConfig, type VideoGenerationConfig, type OpenAIModel } from "@/types"
import { saveApiKey, getApiKey, saveConfig } from "@/lib/db"

const SCRIPT_PROVIDERS = [
  { id: "openai", name: "OpenAI", description: "GPT models" },
  { id: "anthropic", name: "Anthropic", description: "Claude models" },
  { id: "deepseek", name: "DeepSeek", description: "DeepSeek Chat model" },
]

const IMAGE_PROVIDERS = [
  { id: "leonardo", name: "Leonardo AI", description: "Leonardo AI image generation" },
  { id: "openai", name: "DALL-E", description: "OpenAI's DALL-E models" },
  { id: "stability", name: "Stability AI", description: "Stable Diffusion model" },
]

const AUDIO_PROVIDERS = [{ id: "openai", name: "OpenAI", description: "TTS models" }]

const OPENAI_MODELS: OpenAIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Versatile, high-intelligence flagship model",
    contextWindow: 128000,
    maxOutputTokens: 16384,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    description: "Fast, affordable small model for focused tasks",
    contextWindow: 128000,
    maxOutputTokens: 16384,
  },
  {
    id: "o1",
    name: "o1",
    description: "Reasoning model for complex tasks",
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    description: "Fast, affordable reasoning model",
    contextWindow: 128000,
    maxOutputTokens: 65536,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast model for simpler tasks",
    contextWindow: 16385,
    maxOutputTokens: 4096,
  },
]

const DALLE_MODELS = [
  { id: "dall-e-2", name: "DALL-E 2" },
  { id: "dall-e-3", name: "DALL-E 3" },
]

const TTS_MODELS = [
  { id: "tts-1", name: "TTS-1" },
  { id: "tts-1-hd", name: "TTS-1-HD" },
]

const TTS_VOICES = ["alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"]

const DEEPSEEK_MODELS = [
  { id: "deepseek-chat", name: "DeepSeek Chat", description: "DeepSeek's chat model" },
  { id: "deepseek-reasoner", name: "DeepSeek Reasoner", description: "DeepSeek's reasoning model" },
]

interface AIProviderConfigProps {
  config: VideoGenerationConfig
  onConfigChange: (newConfig: VideoGenerationConfig) => void
}

export function AIProviderConfig({ config, onConfigChange }: AIProviderConfigProps) {
  const [scriptProvider, setScriptProvider] = useState(config.scriptConfig?.provider || "")
  const [scriptApiKey, setScriptApiKey] = useState(config.scriptConfig?.apiKey || "")
  const [scriptModel, setScriptModel] = useState(config.scriptConfig?.model || "")
  const [imageProvider, setImageProvider] = useState(config.imageConfig?.provider || "")
  const [imageApiKey, setImageApiKey] = useState(config.imageConfig?.apiKey || "")
  const [imageModel, setImageModel] = useState(config.imageConfig?.model || "")
  const [audioProvider, setAudioProvider] = useState(config.audioConfig?.provider || "")
  const [audioApiKey, setAudioApiKey] = useState(config.audioConfig?.apiKey || "")
  const [audioModel, setAudioModel] = useState(config.audioConfig?.model || "")
  const [audioVoice, setAudioVoice] = useState(config.audioConfig?.voice || "alloy")
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadApiKeys = async () => {
      if (scriptProvider) {
        const key = await getApiKey(scriptProvider)
        if (key) setScriptApiKey(key)
      }
      if (imageProvider) {
        const key = await getApiKey(imageProvider)
        if (key) setImageApiKey(key)
      }
      if (audioProvider) {
        const key = await getApiKey(audioProvider)
        if (key) setAudioApiKey(key)
      }
    }
    loadApiKeys()
  }, [scriptProvider, imageProvider, audioProvider])

  const handleSaveConfig = async (type: "script" | "image" | "audio") => {
    const newConfig = { ...config }
    let apiKey = ""
    let provider = ""
    let model = ""

    if (type === "script") {
      apiKey = scriptApiKey
      provider = scriptProvider
      model = scriptModel
      newConfig.scriptConfig = { provider, apiKey, model }
      setIsScriptDialogOpen(false)
    } else if (type === "image") {
      apiKey = imageApiKey
      provider = imageProvider
      model = imageModel
      newConfig.imageConfig = { provider, apiKey, model }
      setIsImageDialogOpen(false)
    } else {
      apiKey = audioApiKey
      provider = audioProvider
      model = audioModel
      newConfig.audioConfig = { provider, apiKey, model, voice: audioVoice }
      setIsAudioDialogOpen(false)
    }

    if (!apiKey || apiKey.length < 10) {
      toast({
        title: "Error",
        description: `Invalid API key for ${type} generation. Please enter a valid key.`,
        variant: "destructive",
      })
      return
    }

    try {
      await saveApiKey(provider, apiKey)
      onConfigChange(newConfig)
      saveConfig(newConfig)
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} generation config updated`,
      })
    } catch (error) {
      console.error(`Error saving ${type} API key:`, error)
      toast({
        title: "Error",
        description: `Failed to save ${type} API key. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const renderProviderSelect = (
    type: "script" | "image" | "audio",
    value: string,
    onChange: (value: string) => void,
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={`Select ${type} AI Provider`} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{type.charAt(0).toUpperCase() + type.slice(1)} AI Providers</SelectLabel>
          {(type === "script" ? SCRIPT_PROVIDERS : type === "image" ? IMAGE_PROVIDERS : AUDIO_PROVIDERS).map(
            (provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ),
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  const renderModelSelect = (type: "script" | "image" | "audio", value: string, onChange: (value: string) => void) => {
    let models
    if (type === "script") {
      switch (scriptProvider) {
        case "openai":
          models = OPENAI_MODELS
          break
        case "deepseek":
          models = DEEPSEEK_MODELS
          break
        default:
          models = []
      }
    } else if (type === "image") {
      models = DALLE_MODELS
    } else {
      models = TTS_MODELS
    }

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={`Select ${type} AI Model`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{type.charAt(0).toUpperCase() + type.slice(1)} AI Models</SelectLabel>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const renderApiKeyDialog = (
    type: "script" | "image" | "audio",
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    provider: string,
    apiKey: string,
    setApiKey: (key: string) => void,
    model: string,
    setModel: (model: string) => void,
  ) => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set {type.charAt(0).toUpperCase() + type.slice(1)} Generation Config</DialogTitle>
          <DialogDescription>
            Enter your API key for{" "}
            {
              (type === "script" ? SCRIPT_PROVIDERS : type === "image" ? IMAGE_PROVIDERS : AUDIO_PROVIDERS).find(
                (p) => p.id === provider,
              )?.name
            }
            . This will be stored securely in your browser's local storage.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id={`${type}-api-key`}
              placeholder="Enter your API key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          {(provider === "openai" || provider === "deepseek") && (
            <div className="grid gap-2">
              <label htmlFor={`${type}-model`}>Model</label>
              {renderModelSelect(type, model, setModel)}
            </div>
          )}
          {provider === "openai" && type === "audio" && (
            <div className="grid gap-2">
              <label htmlFor="audio-voice">Voice</label>
              <Select value={audioVoice} onValueChange={setAudioVoice}>
                <SelectTrigger id="audio-voice">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((voice) => (
                    <SelectItem key={voice} value={voice}>
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleSaveConfig(type)}>Save Config</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2">
            Script Generation: {config.scriptConfig?.provider || "Not set"} - {config.scriptConfig?.model || "Not set"}
          </p>
          {renderProviderSelect("script", scriptProvider, setScriptProvider)}
          {scriptProvider && (
            <Button variant="outline" className="mt-2" onClick={() => setIsScriptDialogOpen(true)}>
              Set Script Generation Config
            </Button>
          )}
          {renderApiKeyDialog(
            "script",
            isScriptDialogOpen,
            setIsScriptDialogOpen,
            scriptProvider,
            scriptApiKey,
            setScriptApiKey,
            scriptModel,
            setScriptModel,
          )}
        </div>
        <div>
          <p className="mb-2">
            Image Generation: {config.imageConfig?.provider || "Not set"} - {config.imageConfig?.model || "Not set"}
          </p>
          {renderProviderSelect("image", imageProvider, setImageProvider)}
          {imageProvider && (
            <Button variant="outline" className="mt-2" onClick={() => setIsImageDialogOpen(true)}>
              Set Image Generation Config
            </Button>
          )}
          {renderApiKeyDialog(
            "image",
            isImageDialogOpen,
            setIsImageDialogOpen,
            imageProvider,
            imageApiKey,
            setImageApiKey,
            imageModel,
            setImageModel,
          )}
        </div>
        <div>
          <p className="mb-2">
            Audio Generation: {config.audioConfig?.provider || "Not set"} - {config.audioConfig?.model || "Not set"} -{" "}
            {config.audioConfig?.voice || "Not set"}
          </p>
          {renderProviderSelect("audio", audioProvider, setAudioProvider)}
          {audioProvider && (
            <Button variant="outline" className="mt-2" onClick={() => setIsAudioDialogOpen(true)}>
              Set Audio Generation Config
            </Button>
          )}
          {renderApiKeyDialog(
            "audio",
            isAudioDialogOpen,
            setIsAudioDialogOpen,
            audioProvider,
            audioApiKey,
            setAudioApiKey,
            audioModel,
            setAudioModel,
          )}
        </div>
      </div>
    </div>
  )
}


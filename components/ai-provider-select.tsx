"use client"

import { useState } from "react"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", description: "GPT-4 and DALL-E models" },
  { id: "anthropic", name: "Anthropic", description: "Claude models" },
  { id: "google", name: "Google AI", description: "Gemini models" },
  { id: "mistral", name: "Mistral AI", description: "Mistral models" },
]

export function AIProviderSelect() {
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [apiKey, setApiKey] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      })
      return
    }

    // Save API key to localStorage
    localStorage.setItem(`${selectedProvider}_api_key`, apiKey)

    toast({
      title: "Success",
      description: `API key saved for ${AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name}`,
    })

    setIsDialogOpen(false)
  }

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    setApiKey(localStorage.getItem(`${providerId}_api_key`) || "")
    setIsDialogOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleProviderChange} value={selectedProvider}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select AI Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>AI Providers</SelectLabel>
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set API Key</DialogTitle>
            <DialogDescription>
              Enter your API key for {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name}. This will be stored
              securely in your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="api-key"
                placeholder="Enter your API key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>Save API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


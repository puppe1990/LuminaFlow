"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2 } from "lucide-react"

interface VideoFormProps {
  onGenerate: (concept: string, numParts: number) => void
  isGenerating: boolean
}

export function VideoForm({ onGenerate, isGenerating }: VideoFormProps) {
  const [concept, setConcept] = useState("")
  const [numParts, setNumParts] = useState(7)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(concept, numParts)
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Create Your Video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="concept">Video Concept</Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Enter your video concept..."
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Main Parts ({numParts})</Label>
            <Slider min={1} max={10} step={1} value={[numParts]} onValueChange={(value) => setNumParts(value[0])} />
            <span className="text-sm text-muted-foreground">(1-10 parts)</span>
          </div>
          <Button
            type="submit"
            disabled={!concept || isGenerating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              "Generate Script"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


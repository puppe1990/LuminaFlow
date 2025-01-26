"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Volume2 } from "lucide-react"
import type { Section } from "@/types"

interface ScriptSectionsProps {
  sections: Section[]
}

export function ScriptSections({ sections }: ScriptSectionsProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const handlePlayAudio = (sectionId: string) => {
    setPlayingAudio(sectionId === playingAudio ? null : sectionId)
  }

  return (
    <div className="mt-8 space-y-6">
      {sections.map((section, index) => (
        <Card key={section.id} className="bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Section {index + 1}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handlePlayAudio(section.id)}
                className="text-accent hover:text-accent/90"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-primary hover:text-primary/90">
                <Play className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={section.content} readOnly className="min-h-[100px] bg-secondary" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


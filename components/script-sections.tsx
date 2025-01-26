"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Volume2, ImageIcon, Trash2, Upload, Edit2, X, Headphones } from 'lucide-react'
import type { Section, AIConfig } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

interface ScriptSectionsProps {
  sections: Section[]
  onGenerateImage: (sectionId: string, prompt: string, config: AIConfig) => Promise<string>
  onGenerateAudio: (sectionId: string, text: string, config: AIConfig) => Promise<string>
  onDeleteSection: (sectionId: string) => void
  onUploadImage: (sectionId: string, file: File) => Promise<string>
  onDeleteImage: (sectionId: string) => void
  imageConfig: AIConfig
  audioConfig: AIConfig
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void
  onUpdateImageSuggestion: (sectionId: string, newSuggestion: string) => void
}

export function ScriptSections({
  sections,
  onGenerateImage,
  onGenerateAudio,
  onDeleteSection,
  onUploadImage,
  onDeleteImage,
  imageConfig,
  audioConfig,
  onUpdateSectionTitle,
  onUpdateImageSuggestion,
}: ScriptSectionsProps) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [editingImageSuggestion, setEditingImageSuggestion] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handlePlayAudio = (sectionId: string) => {
    setPlayingAudio(sectionId === playingAudio ? null : sectionId)
  }

  const handleGenerateImage = async (sectionId: string, imageSuggestion: string) => {
    setGeneratingImage(sectionId)
    try {
      await onGenerateImage(sectionId, imageSuggestion, imageConfig)
      toast({
        title: "Image Generated",
        description: "The image has been successfully generated.",
      })
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "Failed to generate the image. Please try again.",
        variant: "destructive",
      })
    }
    setGeneratingImage(null)
  }

  const handleGenerateAudio = async (sectionId: string, text: string) => {
    setGeneratingAudio(sectionId)
    try {
      await onGenerateAudio(sectionId, text, audioConfig)
      toast({
        title: "Audio Generated",
        description: "The audio has been successfully generated.",
      })
    } catch (error) {
      toast({
        title: "Audio Generation Failed",
        description: "Failed to generate the audio. Please try again.",
        variant: "destructive",
      })
    }
    setGeneratingAudio(null)
  }

  const handleUploadImage = async (sectionId: string, file: File) => {
    setUploadingImage(sectionId)
    try {
      await onUploadImage(sectionId, file)
      toast({
        title: "Image Uploaded",
        description: "The image has been successfully uploaded.",
      })
    } catch (error) {
      toast({
        title: "Image Upload Failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      })
    }
    setUploadingImage(null)
  }

  const handleEditImageSuggestion = (sectionId: string, currentSuggestion: string) => {
    setEditingImageSuggestion(sectionId)
  }

  const handleSaveImageSuggestion = (sectionId: string, newSuggestion: string) => {
    onUpdateImageSuggestion(sectionId, newSuggestion)
    setEditingImageSuggestion(null)
  }

  const handleDeleteImage = (sectionId: string) => {
    onDeleteImage(sectionId)
    toast({
      title: "Image Deleted",
      description: "The image has been successfully deleted.",
    })
  }

  return (
    <div className="mt-8 space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              <Input
                value={section.title}
                onChange={(e) => onUpdateSectionTitle(section.id, e.target.value)}
                className="mt-2"
              />
            </CardTitle>
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
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteSection(section.id)}
                className="text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={section.content} readOnly className="min-h-[100px] bg-secondary mb-4" />
            <div className="bg-primary/10 p-3 rounded-md flex items-start gap-2 mb-4">
              <ImageIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              {editingImageSuggestion === section.id ? (
                <div className="flex-grow">
                  <Textarea
                    value={section.imageSuggestion}
                    onChange={(e) => onUpdateImageSuggestion(section.id, e.target.value)}
                    className="min-h-[60px] bg-secondary mb-2"
                  />
                  <Button onClick={() => handleSaveImageSuggestion(section.id, section.imageSuggestion)}>Save</Button>
                </div>
              ) : (
                <div className="flex-grow flex justify-between items-start">
                  <p className="text-sm flex-grow">{section.imageSuggestion}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditImageSuggestion(section.id, section.imageSuggestion)}
                    className="ml-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleGenerateImage(section.id, section.imageSuggestion)}
                disabled={!section.imageSuggestion || generatingImage === section.id}
              >
                {generatingImage === section.id ? "Generating..." : "Generate Image"}
              </Button>
              <Button
                onClick={() => fileInputRefs.current[section.id]?.click()}
                disabled={uploadingImage === section.id}
              >
                {uploadingImage === section.id ? "Uploading..." : "Upload Image"}
              </Button>
              <Button
                onClick={() => handleGenerateAudio(section.id, section.content)}
                disabled={generatingAudio === section.id}
              >
                {generatingAudio === section.id ? "Generating..." : "Generate Audio"}
              </Button>
              <input
                type="file"
                ref={(el) => (fileInputRefs.current[section.id] = el)}
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleUploadImage(section.id, file)
                  }
                }}
              />
            </div>
            {section.imageData && (
              <div className="mt-4 relative">
                <img
                  src={section.imageData || "/placeholder.svg"}
                  alt="Generated or uploaded image"
                  className="rounded-md w-full"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteImage(section.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {section.audioUrl && (
              <div className="mt-4">
                <audio controls src={section.audioUrl} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


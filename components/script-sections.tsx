"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, ImageIcon, Trash2, Upload, Edit2, X, Headphones, Loader2, Music, GripVertical, Plus } from "lucide-react"
import type { Section, AIConfig } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"

interface Section {
  id: string
  title: string
  content: string
  imageSuggestion?: string
  imageSuggestions: string[]
  imageUrls: string[]
  audioUrl?: string
}

interface ScriptSectionsProps {
  sections: Section[]
  onGenerateImage: (sectionId: string, prompt: string, config: AIConfig) => Promise<string>
  onGenerateAudio: (sectionId: string, text: string, config: AIConfig) => Promise<string>
  onDeleteSection: (sectionId: string) => void
  onUploadImage: (sectionId: string, file: File) => Promise<string>
  onUploadAudio: (sectionId: string, file: File) => Promise<string>
  onDeleteImage: (sectionId: string, imageIndex: number) => void
  onDeleteAudio: (sectionId: string) => void
  imageConfig: AIConfig
  audioConfig: AIConfig
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void
  onUpdateImageSuggestion: (sectionId: string, newSuggestion: string, index: number) => void
  onAddImageSuggestion: (sectionId: string) => void
  onGenerateAllImages: () => Promise<void>
  onGenerateAllAudios: () => Promise<void>
  onReorderSections: (newOrder: Section[]) => void
  onReorderImages: (sectionId: string, result: DropResult) => void
  onDeleteSectionImage: (sectionId: string, imageIndex: number) => void
}

export function ScriptSections({
  sections,
  onGenerateImage,
  onGenerateAudio,
  onDeleteSection,
  onUploadImage,
  onUploadAudio,
  onDeleteImage,
  onDeleteAudio,
  imageConfig,
  audioConfig,
  onUpdateSectionTitle,
  onUpdateImageSuggestion,
  onAddImageSuggestion,
  onGenerateAllImages,
  onGenerateAllAudios,
  onReorderSections,
  onReorderImages,
  onDeleteSectionImage,
}: ScriptSectionsProps) {
  const [editingImageSuggestion, setEditingImageSuggestion] = useState<{ sectionId: string; index: number } | null>(
    null,
  )
  const [generatingImage, setGeneratingImage] = useState<{ sectionId: string; index: number } | null>(null)
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<{ sectionId: string; index: number } | null>(null)
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const audioInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleGenerateImage = async (sectionId: string, imageSuggestion: string, index: number) => {
    setGeneratingImage({ sectionId, index })
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
      console.error("Failed to generate audio:", error)
      toast({
        title: "Audio Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setGeneratingAudio(null)
    }
  }

  const handleUploadImage = async (sectionId: string, file: File, index: number) => {
    setUploadingImage({ sectionId, index })
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

  const handleUploadAudio = async (sectionId: string, file: File) => {
    setUploadingAudio(sectionId)
    try {
      await onUploadAudio(sectionId, file)
      toast({
        title: "Audio Uploaded",
        description: "The audio has been successfully uploaded.",
      })
    } catch (error) {
      toast({
        title: "Audio Upload Failed",
        description: "Failed to upload the audio. Please try again.",
        variant: "destructive",
      })
    }
    setUploadingAudio(null)
  }

  const handleEditImageSuggestion = (sectionId: string, index: number) => {
    setEditingImageSuggestion({ sectionId, index })
  }

  const handleSaveImageSuggestion = (sectionId: string, newSuggestion: string, index: number) => {
    onUpdateImageSuggestion(sectionId, newSuggestion, index)
    setEditingImageSuggestion(null)
  }

  const handleDeleteImage = (sectionId: string, imageIndex: number) => {
    onDeleteImage(sectionId, imageIndex)
    toast({
      title: "Image Deleted",
      description: "The image has been successfully deleted.",
    })
  }

  const handleDeleteAudio = (sectionId: string) => {
    onDeleteAudio(sectionId)
    toast({
      title: "Audio Deleted",
      description: "The audio has been successfully deleted.",
    })
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const newSections = Array.from(sections)
    const [reorderedSection] = newSections.splice(result.source.index, 1)
    newSections.splice(result.destination.index, 0, reorderedSection)

    onReorderSections(newSections)
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button
          onClick={onGenerateAllImages}
          disabled={sections.every(
            (section) => (section.imageUrls || []).length === (section.imageSuggestions || []).length,
          )}
        >
          Generate All Images
        </Button>
        <Button onClick={onGenerateAllAudios} disabled={sections.every((section) => section.audioUrl)}>
          Generate All Audios
        </Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`mb-6 ${snapshot.isDragging ? "opacity-50" : ""}`}
                    >
                      <Card className="bg-secondary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-center">
                            <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-500" />
                            </div>
                            <CardTitle className="text-lg">
                              <Input
                                value={section.title}
                                onChange={(e) => onUpdateSectionTitle(section.id, e.target.value)}
                                className="mt-2"
                              />
                            </CardTitle>
                          </div>
                          <div className="flex gap-2">
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
                          {section.imageSuggestion && (
                            <div className="bg-primary/10 p-3 rounded-md flex items-start gap-2 mb-4">
                              <ImageIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              <div className="flex-grow flex justify-between items-start">
                                <p className="text-sm flex-grow">{section.imageSuggestion}</p>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditImageSuggestion(section.id, 0)}
                                  className="ml-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {(section.imageSuggestions || []).map((suggestion, imgIndex) => (
                            <div key={imgIndex} className="bg-primary/10 p-3 rounded-md flex items-start gap-2 mb-4">
                              <ImageIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              {editingImageSuggestion?.sectionId === section.id &&
                              editingImageSuggestion.index === imgIndex ? (
                                <div className="flex-grow">
                                  <Textarea
                                    value={suggestion}
                                    onChange={(e) => onUpdateImageSuggestion(section.id, e.target.value, imgIndex)}
                                    className="min-h-[60px] bg-secondary mb-2"
                                  />
                                  <Button onClick={() => handleSaveImageSuggestion(section.id, suggestion, imgIndex)}>
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex-grow flex justify-between items-start">
                                  <p className="text-sm flex-grow">{suggestion}</p>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEditImageSuggestion(section.id, imgIndex)}
                                    className="ml-2"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleGenerateImage(section.id, section.imageSuggestion, 0)}
                              disabled={
                                !section.imageSuggestion ||
                                (generatingImage?.sectionId === section.id && generatingImage.index === 0)
                              }
                            >
                              {generatingImage?.sectionId === section.id && generatingImage.index === 0 ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Generate Image
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => fileInputRef.current[section.id]?.click()}
                              disabled={uploadingImage?.sectionId === section.id}
                            >
                              {uploadingImage?.sectionId === section.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleGenerateAudio(section.id, section.content)}
                              disabled={generatingAudio === section.id}
                            >
                              {generatingAudio === section.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating Audio...
                                </>
                              ) : (
                                <>
                                  <Headphones className="mr-2 h-4 w-4" />
                                  Generate Audio
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => audioInputRef.current[section.id]?.click()}
                              disabled={uploadingAudio === section.id}
                            >
                              {uploadingAudio === section.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Music className="mr-2 h-4 w-4" />
                                  Upload Audio
                                </>
                              )}
                            </Button>
                            <input
                              type="file"
                              ref={(el) => (fileInputRef.current[section.id] = el)}
                              style={{ display: "none" }}
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files
                                if (files) {
                                  Array.from(files).forEach((file) => {
                                    handleUploadImage(section.id, file, section.imageUrls.length)
                                  })
                                }
                              }}
                            />
                            <input
                              type="file"
                              ref={(el) => (audioInputRef.current[section.id] = el)}
                              style={{ display: "none" }}
                              accept="audio/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleUploadAudio(section.id, file)
                                }
                              }}
                            />
                          </div>
                          {section.imageUrls && section.imageUrls.length > 0 && (
                            <DragDropContext onDragEnd={(result) => onReorderImages(section.id, result)}>
                              <Droppable droppableId={`section-${section.id}-images`} direction="horizontal">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex flex-wrap gap-2 mt-4"
                                  >
                                    {section.imageUrls.map((imageUrl, index) => (
                                      <Draggable
                                        key={`${section.id}-image-${index}`}
                                        draggableId={`${section.id}-image-${index}`}
                                        index={index}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="relative"
                                          >
                                            <img
                                              src={imageUrl || "/placeholder.svg"}
                                              alt={`Generated or uploaded image ${index + 1}`}
                                              className="rounded-md w-24 h-24 object-cover"
                                            />
                                            <Button
                                              size="icon"
                                              variant="destructive"
                                              className="absolute top-1 right-1"
                                              onClick={() => onDeleteSectionImage(section.id, index)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          )}
                          {section.audioUrl && (
                            <div className="mt-4 relative">
                              <audio controls src={section.audioUrl} className="w-full" />
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2"
                                onClick={() => handleDeleteAudio(section.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}


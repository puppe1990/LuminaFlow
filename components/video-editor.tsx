"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Upload,
  Video,
  ImageIcon,
  Music,
  Scissors,
  Plus,
  X,
  ImportIcon as FileImport,
  Volume2,
  Maximize,
  Minimize,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Section } from "@/types"
import { useToast } from "@/components/ui/use-toast"

interface MediaClip {
  id: string
  type: "image" | "audio"
  url: string
  duration: number
  startTime: number
  title?: string
  sectionId?: string
}

interface VideoEditorProps {
  sections?: Section[]
}

export default function VideoEditor({ sections = [] }: VideoEditorProps) {
  const { toast } = useToast()
  const [imageClips, setImageClips] = useState<MediaClip[]>([])
  const [audioClips, setAudioClips] = useState<MediaClip[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedClip, setSelectedClip] = useState<string | null>(null)
  const [isAudioOperationInProgress, setIsAudioOperationInProgress] = useState(false)
  const [volume, setVolume] = useState(1) // 1 is max volume, 0 is muted
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})
  const imageRefs = useRef<{ [key: string]: HTMLImageElement }>({})
  const animationFrameRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calculateTotalAudioDuration = useCallback(() => {
    return audioClips.reduce((total, clip) => total + clip.duration, 0)
  }, [audioClips])

  const totalDuration = calculateTotalAudioDuration()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const newClip: MediaClip = {
        id: Math.random().toString(36).substr(2, 9),
        type: file.type.startsWith("audio") ? "audio" : "image",
        url,
        duration: 5, // Default duration, will be updated for audio files
        startTime: file.type.startsWith("audio")
          ? audioClips.reduce((acc, clip) => Math.max(acc, clip.startTime + clip.duration), 0)
          : imageClips.reduce((acc, clip) => Math.max(acc, clip.startTime + clip.duration), 0),
        title: file.name,
      }

      if (newClip.type === "audio") {
        const audio = new Audio(url)
        audio.addEventListener("loadedmetadata", () => {
          newClip.duration = audio.duration
          setAudioClips((prevClips) => [...prevClips, newClip])
          console.log(`Audio clip loaded: ${newClip.id}, Duration: ${newClip.duration}`)
        })
        audio.addEventListener("error", (e) => {
          console.error(`Error loading audio clip ${newClip.id}:`, e)
          toast({
            title: "Audio Load Error",
            description: `Failed to load audio: ${file.name}. Please try again.`,
            variant: "destructive",
          })
        })
      } else {
        const img = new Image()
        img.onload = () => {
          setImageClips((prevClips) => [...prevClips, newClip])
          console.log(`Image clip loaded: ${newClip.id}`)
        }
        img.onerror = (e) => {
          console.error(`Error loading image clip ${newClip.id}:`, e)
          toast({
            title: "Image Load Error",
            description: `Failed to load image: ${file.name}. Please try again.`,
            variant: "destructive",
          })
        }
        img.src = url
      }
    }
  }

  const resetAudioOperationState = useCallback(() => {
    if (audioOperationTimeoutRef.current) {
      clearTimeout(audioOperationTimeoutRef.current)
    }
    setIsAudioOperationInProgress(false)
  }, [])

  const handlePlayPause = () => {
    if (isAudioOperationInProgress) {
      console.log("Audio operation in progress, forcing reset")
      resetAudioOperationState()
    }

    setIsPlaying((prevIsPlaying) => {
      if (prevIsPlaying) {
        pauseAllAudio()
      } else {
        const allAudioReady = audioClips.every((clip) => {
          const audio = audioRefs.current[clip.id]
          return audio && audio.readyState >= 4 // HAVE_ENOUGH_DATA
        })
        if (allAudioReady) {
          playAudioFromCurrentTime()
        } else {
          console.warn("Not all audio clips are ready for playback")
          toast({
            title: "Audio Not Ready",
            description: "Please wait for all audio to load before playing.",
            variant: "warning",
          })
          return false // Don't start playing if audio isn't ready
        }
      }
      return !prevIsPlaying
    })
  }

  const handleDeleteClip = (clipId: string, type: "image" | "audio") => {
    if (type === "image") {
      setImageClips(imageClips.filter((clip) => clip.id !== clipId))
    } else {
      setAudioClips(audioClips.filter((clip) => clip.id !== clipId))
    }
    console.log(`Deleted ${type} clip: ${clipId}`)
  }

  const updateImageDurations = (images: MediaClip[], audios: MediaClip[]) => {
    const totalAudioDuration = audios.reduce((total, clip) => total + clip.duration, 0)
    const imageCount = images.length
    const averageImageDuration = totalAudioDuration / imageCount

    let currentStartTime = 0
    const updatedImages = images.map((image, index) => {
      const updatedImage = {
        ...image,
        startTime: currentStartTime,
        duration: averageImageDuration,
      }
      currentStartTime += averageImageDuration
      return updatedImage
    })

    setImageClips(updatedImages)
    setAudioClips(audios)
    console.log("Updated image durations based on audio clips")
  }

  const importFromSections = () => {
    const newImageClips: MediaClip[] = []
    const newAudioClips: MediaClip[] = []
    let currentImageStartTime = 0
    let currentAudioStartTime = 0

    sections.forEach((section) => {
      if (section.imageUrls && section.imageUrls.length > 0) {
        section.imageUrls.forEach((imageUrl, index) => {
          newImageClips.push({
            id: `image-${section.id}-${index}`,
            type: "image",
            url: imageUrl,
            duration: 5, // Default duration, will be adjusted later
            startTime: currentImageStartTime,
            title: `${section.title} (Image ${index + 1})`,
            sectionId: section.id,
          })
          currentImageStartTime += 5 // Increment by default duration
        })
      }

      if (section.audioUrl) {
        const newAudioClip: MediaClip = {
          id: `audio-${section.id}`,
          type: "audio",
          url: section.audioUrl,
          duration: 0, // Will be updated when audio loads
          startTime: currentAudioStartTime,
          title: `${section.title} (Audio)`,
          sectionId: section.id,
        }
        newAudioClips.push(newAudioClip)

        const audio = new Audio(section.audioUrl)
        audio.addEventListener("loadedmetadata", () => {
          newAudioClip.duration = audio.duration
          currentAudioStartTime += audio.duration
          updateImageDurations(newImageClips, newAudioClips)
          console.log(`Loaded audio for section ${section.id}, Duration: ${audio.duration}`)
        })
        audio.addEventListener("error", (e) => {
          console.error(`Error loading audio for section ${section.id}:`, e)
          toast({
            title: "Audio Load Error",
            description: `Failed to load audio for section: ${section.title}. Please try reimporting.`,
            variant: "destructive",
          })
        })
      }
    })

    setImageClips(newImageClips)
    setAudioClips(newAudioClips)
    console.log("Imported clips from sections", { imageCount: newImageClips.length, audioCount: newAudioClips.length })
  }

  const updatePreview = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Find the current image clip based on currentTime
    const currentImageClip = imageClips.find((clip) => {
      return currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    })

    if (currentImageClip && currentImageClip.type === "image") {
      const img = imageRefs.current[currentImageClip.id]
      if (img) {
        // Calculate aspect ratio fitting
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      }
    }
  }, [currentTime, imageClips])

  const updateAudioPlayback = useCallback(() => {
    audioClips.forEach((clip) => {
      const audio = audioRefs.current[clip.id]
      if (audio) {
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          if (audio.paused && isPlaying) {
            audio.currentTime = currentTime - clip.startTime
            audio
              .play()
              .then(() => {
                console.log(`Successfully started playing audio clip ${clip.id}`)
              })
              .catch((error) => {
                console.error(`Error playing audio clip ${clip.id}:`, error.name, error.message, error)
                toast({
                  title: "Audio Playback Error",
                  description: `Failed to play audio: ${clip.title}. Error: ${error.message || "Unknown error"}`,
                  variant: "destructive",
                })
              })
          }
        } else {
          if (!audio.paused) {
            audio.pause()
            console.log(`Paused audio clip ${clip.id}`)
          }
        }
      } else {
        console.warn(`Audio element not found for clip ${clip.id}`)
      }
    })
  }, [currentTime, isPlaying, audioClips, toast])

  const animate = useCallback(() => {
    if (isPlaying) {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 1 / 60 // Assuming 60 FPS
        return newTime > totalDuration ? 0 : newTime // Loop back to the start if we reach the end
      })
    }
    updatePreview()
    try {
      updateAudioPlayback()
    } catch (error) {
      console.error("Error updating audio playback:", error)
      toast({
        title: "Audio Sync Error",
        description: "An error occurred while syncing audio. Please try reloading the editor.",
        variant: "destructive",
      })
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isPlaying, totalDuration, updatePreview, updateAudioPlayback, toast])

  const pauseAllAudio = useCallback(() => {
    resetAudioOperationState()
    setIsAudioOperationInProgress(true)

    audioOperationTimeoutRef.current = setTimeout(() => {
      audioClips.forEach((clip) => {
        const audio = audioRefs.current[clip.id]
        if (audio) {
          audio.pause()
        }
      })
      resetAudioOperationState()
      console.log("Paused all audio clips")
    }, 100) // 100ms debounce
  }, [audioClips, resetAudioOperationState])

  const playAudioFromCurrentTime = useCallback(() => {
    resetAudioOperationState()
    setIsAudioOperationInProgress(true)

    audioOperationTimeoutRef.current = setTimeout(() => {
      audioClips.forEach((clip) => {
        const audio = audioRefs.current[clip.id]
        if (audio && currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          audio.currentTime = currentTime - clip.startTime
          audio
            .play()
            .then(() => {
              console.log(`Successfully started playing audio clip ${clip.id} from time ${audio.currentTime}`)
            })
            .catch((error) => {
              if (error.name !== "AbortError") {
                console.error(
                  `Error playing audio clip ${clip.id} from current time:`,
                  error.name,
                  error.message,
                  error,
                )
                toast({
                  title: "Audio Playback Error",
                  description: `Failed to play audio: ${clip.title}. Error: ${error.message || "Unknown error"}`,
                  variant: "destructive",
                })
              } else {
                console.log(`Play operation aborted for audio clip ${clip.id}`)
              }
            })
        }
      })
      resetAudioOperationState()
    }, 100) // 100ms debounce

    console.log(`Attempting to play audio from current time: ${currentTime}`)
  }, [audioClips, currentTime, toast, resetAudioOperationState])

  const adjustVolume = useCallback((newVolume: number) => {
    setVolume(newVolume)
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.volume = newVolume
      }
    })
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    // Preload images
    imageClips.forEach((clip) => {
      if (clip.type === "image" && !imageRefs.current[clip.id]) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          imageRefs.current[clip.id] = img
          updatePreview()
          console.log(`Image loaded for clip ${clip.id}`)
        }
        img.onerror = (e) => {
          console.error(`Error loading image for clip ${clip.id}:`, e)
          toast({
            title: "Image Load Error",
            description: `Failed to load image: ${clip.title}. Please try reuploading.`,
            variant: "destructive",
          })
        }
        img.src = clip.url
      }
    })

    // Initialize audio elements
    audioClips.forEach((clip) => {
      if (!audioRefs.current[clip.id]) {
        const audio = new Audio(clip.url)
        audio.preload = "auto"
        audio.volume = volume // Set initial volume
        audio.addEventListener("canplaythrough", () => {
          console.log(`Audio clip ${clip.id} is ready to play`)
        })
        audio.addEventListener("error", (e) => {
          const error = e.target as HTMLAudioElement
          console.error(`Error loading audio clip ${clip.id}:`, error.error)
          toast({
            title: "Audio Load Error",
            description: `Failed to load audio: ${clip.title}. Error: ${error.error?.message || "Unknown error"}`,
            variant: "destructive",
          })
        })
        audioRefs.current[clip.id] = audio
      }
    })

    // Clean up function
    return () => {
      imageClips.forEach((clip) => {
        if (!imageClips.some((c) => c.id === clip.id)) {
          delete imageRefs.current[clip.id]
          console.log(`Cleaned up image reference for clip ${clip.id}`)
        }
      })
      audioClips.forEach((clip) => {
        if (!audioClips.some((c) => c.id === clip.id)) {
          const audio = audioRefs.current[clip.id]
          if (audio) {
            audio.pause()
            audio.src = ""
            delete audioRefs.current[clip.id]
            console.log(`Cleaned up audio reference for clip ${clip.id}`)
          }
        }
      })
      if (audioOperationTimeoutRef.current) {
        clearTimeout(audioOperationTimeoutRef.current)
      }
      resetAudioOperationState()
    }
  }, [imageClips, audioClips, updatePreview, toast, resetAudioOperationState, volume])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      pauseAllAudio()
    }
  }, [animate, pauseAllAudio])

  return (
    <div className="flex flex-col h-full bg-background" ref={containerRef}>
      {/* Preview Window */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full" />
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2 my-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentTime(0)
            pauseAllAudio()
          }}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button onClick={handlePlayPause} variant="outline" size="icon">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentTime(totalDuration)
            pauseAllAudio()
          }}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <Slider
          value={[currentTime]}
          max={totalDuration}
          step={0.1}
          className="w-96"
          onValueChange={(value) => {
            setCurrentTime(value[0])
            if (!isPlaying) {
              pauseAllAudio()
            } else {
              playAudioFromCurrentTime()
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          {formatTime(currentTime)} {"/"} {formatTime(totalDuration)}
        </span>
        <div className="flex items-center ml-4">
          <Volume2 className="h-4 w-4 mr-2" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            className="w-24"
            onValueChange={(value) => adjustVolume(value[0])}
          />
        </div>
        <Button onClick={toggleFullscreen} variant="outline" size="icon">
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Timeline */}
      <Card className="p-4 relative flex-grow">
        <div className="flex gap-2 mb-4">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
          <Button onClick={importFromSections} variant="outline">
            <FileImport className="h-4 w-4 mr-2" />
            Import from Script
          </Button>
          <Button variant="outline">
            <Scissors className="h-4 w-4 mr-2" />
            Split
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,audio/*"
            className="hidden"
          />
        </div>

        {/* Image Clips Row */}
        <div className="relative h-16 bg-secondary rounded-lg overflow-x-auto mb-2">
          <div className="absolute top-0 left-0 h-full flex">
            {imageClips.map((clip) => (
              <div
                key={clip.id}
                className={cn(
                  "relative h-full border-r border-border cursor-pointer transition-colors",
                  selectedClip === clip.id ? "bg-primary/20" : "hover:bg-primary/10",
                )}
                style={{
                  width: `${(clip.duration / totalDuration) * 100}%`,
                  left: `${(clip.startTime / totalDuration) * 100}%`,
                }}
                onClick={() => setSelectedClip(clip.id)}
              >
                <ImageIcon className="absolute top-2 left-2 h-4 w-4" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteClip(clip.id, "image")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs truncate">{clip.title}</div>
                  <div className="text-xs text-muted-foreground">{formatTime(clip.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Clips Row */}
        <div className="relative h-16 bg-secondary rounded-lg overflow-x-auto">
          <div className="absolute top-0 left-0 h-full flex">
            {audioClips.map((clip) => (
              <div
                key={clip.id}
                className={cn(
                  "relative h-full border-r border-border cursor-pointer transition-colors",
                  selectedClip === clip.id ? "bg-primary/20" : "hover:bg-primary/10",
                )}
                style={{
                  width: `${(clip.duration / totalDuration) * 100}%`,
                  left: `${(clip.startTime / totalDuration) * 100}%`,
                }}
                onClick={() => setSelectedClip(clip.id)}
              >
                <Music className="absolute top-2 left-2 h-4 w-4" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteClip(clip.id, "audio")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs truncate">{clip.title}</div>
                  <div className="text-xs text-muted-foreground">{formatTime(clip.duration)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}


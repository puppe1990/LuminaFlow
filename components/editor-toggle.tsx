"use client"

import { Button } from "@/components/ui/button"
import { VideoIcon, FileText } from "lucide-react"

interface EditorToggleProps {
  mode: "script" | "video"
  onToggle: (mode: "script" | "video") => void
}

export function EditorToggle({ mode, onToggle }: EditorToggleProps) {
  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <Button variant={mode === "script" ? "default" : "outline"} onClick={() => onToggle("script")} className="gap-2">
        <FileText className="h-4 w-4" />
        Script Editor
      </Button>
      <Button variant={mode === "video" ? "default" : "outline"} onClick={() => onToggle("video")} className="gap-2">
        <VideoIcon className="h-4 w-4" />
        Video Editor
      </Button>
    </div>
  )
}


import { type NextRequest, NextResponse } from "next/server"
import { generateImage } from "@/lib/ai-helpers"
import type { AIConfig } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { prompt, config } = await req.json()

    if (!prompt || !config) {
      return NextResponse.json({ error: "Missing prompt or config" }, { status: 400 })
    }

    const imageUrl = await generateImage(prompt, config)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error in generate-image API route:", error)
    let errorMessage = "Failed to generate image"
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


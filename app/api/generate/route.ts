import { type NextRequest, NextResponse } from "next/server"
import { generateVideoScript, generateImagePrompt, generateLeonardoImage } from "@/lib/ai-helpers"
import type { AIConfig, Section } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { concept, numParts, scriptConfig, imageConfig } = await req.json()
    console.log("Received request:", { concept, numParts, scriptConfig, imageConfig })

    // Generate script
    let script: Section[]
    try {
      script = await generateVideoScript(concept, numParts, scriptConfig)
      console.log("Generated script:", script)
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        return NextResponse.json(
          { error: "Authentication failed for script generation. Please check your OpenAI API key." },
          { status: 401 },
        )
      }
      throw error
    }

    // Generate image prompt
    let imagePrompt = ""
    let imageUrl = null
    let imageError = null

    try {
      imagePrompt = await generateImagePrompt(concept, imageConfig)
      console.log("Generated image prompt:", imagePrompt)

      // Generate image if using Leonardo AI
      if (imageConfig.provider === "leonardo") {
        imageUrl = await generateLeonardoImage(imagePrompt, imageConfig.apiKey)
        console.log("Generated image URL:", imageUrl)
      }
    } catch (error) {
      console.error("Error in image generation:", error)
      imageError = error instanceof Error ? error.message : "Unknown error in image generation"
    }

    return NextResponse.json({ script, imagePrompt, imageUrl, imageError })
  } catch (error) {
    console.error("Error in generate API route:", error)
    let errorMessage = "Failed to generate content"
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


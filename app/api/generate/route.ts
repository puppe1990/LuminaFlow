import { type NextRequest, NextResponse } from "next/server"
import { generateVideoScript } from "@/lib/ai-helpers"
import type { AIConfig, Section } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { concept, numParts, scriptConfig } = await req.json()
    console.log("Received request:", { concept, numParts, scriptConfig })

    // Generate script
    let script: Section[]
    try {
      script = await generateVideoScript(concept, numParts, scriptConfig)
      console.log("Generated script:", script)
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        return NextResponse.json(
          { error: "Authentication failed for script generation. Please check your API key." },
          { status: 401 },
        )
      }
      throw error
    }

    return NextResponse.json({ script })
  } catch (error) {
    console.error("Error in generate API route:", error)
    let errorMessage = "Failed to generate content"
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


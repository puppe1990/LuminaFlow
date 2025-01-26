import { type NextRequest, NextResponse } from "next/server"
import type { AIConfig } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { text, config, voice } = await req.json()

    if (!text || !config) {
      return NextResponse.json({ error: "Missing text or config" }, { status: 400 })
    }

    if (!config.apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 })
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model || "tts-1",
        input: text,
        voice: voice || "alloy",
        response_format: "mp3",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    return NextResponse.json({ audioUrl: `data:audio/mp3;base64,${base64Audio}` })
  } catch (error) {
    console.error("Error in generate-audio API route:", error)
    let errorMessage = "Failed to generate audio"
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


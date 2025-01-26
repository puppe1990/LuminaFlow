import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { AIConfig } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { text, config } = await req.json()

    if (!text || !config) {
      return NextResponse.json({ error: "Missing text or config" }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: config.apiKey })

    const mp3 = await openai.audio.speech.create({
      model: config.model,
      voice: "alloy", // You can make this configurable if needed
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    const base64Audio = buffer.toString("base64")

    // In a real-world scenario, you might want to save this file to a storage service
    // and return a URL. For this example, we'll return the base64 encoded audio.
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


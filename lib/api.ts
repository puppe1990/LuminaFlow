import type { AIConfig, Section } from "@/types"

export async function generateContent(concept: string, numParts: number, scriptConfig: AIConfig) {
  try {
    console.log("Sending request to /api/generate with:", { concept, numParts, scriptConfig })
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        concept,
        numParts,
        scriptConfig,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("API response not OK:", response.status, errorData)
      if (response.status === 401) {
        throw new Error("Authentication failed. Please check your API key and try again.")
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`)
    }

    const data = await response.json()
    console.log("Received data from /api/generate:", data)

    if (data.error) {
      console.error("Error in API response:", data.error)
      throw new Error(data.error)
    }

    if (!data.script || !Array.isArray(data.script)) {
      console.error("Invalid script data received:", data.script)
      throw new Error("Invalid script data received from the server")
    }

    return {
      script: data.script as Section[],
    }
  } catch (error) {
    console.error("Error in generateContent:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate content: ${error.message}`)
    } else {
      throw new Error("An unknown error occurred while generating content")
    }
  }
}


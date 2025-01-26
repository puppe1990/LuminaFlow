import type { AIConfig, Section } from "@/types"

function parseScriptData(content: string): Section[] {
  // First, try to parse as JSON
  try {
    const scriptData = JSON.parse(content)
    if (Array.isArray(scriptData.sections)) {
      return scriptData.sections.map((section: any, index: number) => ({
        id: `section-${index}`,
        title: section.title || `Section ${index + 1}`,
        content: section.content || "",
        imageSuggestion: section.imageSuggestion || `An image representing ${section.title}`,
      }))
    }
  } catch (e) {
    console.log("Failed to parse as JSON, attempting manual parsing")
  }

  // If JSON parsing fails, attempt to parse the content manually
  const sections: Section[] = []
  const lines = content.split("\n")
  let currentSection: Partial<Section> = {}

  for (const line of lines) {
    if (line.startsWith("**Title:")) {
      if (Object.keys(currentSection).length > 0) {
        sections.push(currentSection as Section)
      }
      currentSection = {
        id: `section-${sections.length}`,
        title: line.replace("**Title:", "").trim(),
        content: "",
        imageSuggestion: "",
      }
    } else if (line.startsWith("**Content:")) {
      currentSection.content = line.replace("**Content:", "").trim()
    } else if (line.startsWith("**Image Suggestion:")) {
      currentSection.imageSuggestion = line.replace("**Image Suggestion:", "").trim()
    } else if (currentSection.content) {
      currentSection.content += " " + line.trim()
    }
  }

  if (Object.keys(currentSection).length > 0) {
    sections.push(currentSection as Section)
  }

  return sections
}

export async function generateVideoScript(concept: string, numParts: number, config: AIConfig): Promise<Section[]> {
  const { provider, apiKey, model } = config

  if (provider !== "openai" && provider !== "deepseek") {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  const baseUrl = provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1"

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that generates video scripts. Create a script for a video about "${concept}" with ${numParts} main parts, plus an introduction and conclusion. Format each section as follows:

**Title: [Section Title]
**Content: [Section Content]
**Image Suggestion: [Image Suggestion]

Ensure that each section has a unique and descriptive image suggestion. Do not include any JSON formatting.`,
          },
          {
            role: "user",
            content: `Generate a video script about "${concept}" with ${numParts} main parts, an introduction, and a conclusion.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No completion choices returned from API")
    }

    const content = data.choices[0].message.content
    console.log("Raw content from API:", content)

    const sections = parseScriptData(content)

    if (sections.length === 0) {
      throw new Error("Failed to parse script data")
    }

    return sections
  } catch (error) {
    console.error("Error generating video script:", error)
    throw new Error(`Failed to generate video script: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function generateImagePrompt(concept: string, config: AIConfig): Promise<string> {
  const { provider, apiKey, model } = config

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  let prompt: string

  switch (provider) {
    case "openai":
      if (model === "dall-e-3") {
        prompt = `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: Create a high-quality, photorealistic image representing: ${concept}`
      } else {
        prompt = `Create a high-quality, photorealistic image representing: ${concept}. The image should be detailed and visually striking.`
      }
      break
    case "leonardo":
      prompt = `Generate a creative and artistic image inspired by: ${concept}. Use vibrant colors and unique artistic styles.`
      break
    case "stability":
      prompt = `Produce a detailed and imaginative image based on: ${concept}. Focus on intricate details and fantastical elements.`
      break
    default:
      prompt = `A visually striking image representing ${concept}`
  }

  return prompt
}

export async function generateLeonardoImage(prompt: string, apiKey: string): Promise<string> {
  const url = "https://cloud.leonardo.ai/api/rest/v1/generations"
  const payload = {
    alchemy: true,
    height: 832,
    modelId: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
    num_images: 1,
    presetStyle: "DYNAMIC",
    prompt: prompt,
    width: 1472,
  }
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.sdGenerationJob) {
      throw new Error(`Failed to initiate image generation. Response: ${JSON.stringify(data)}`)
    }

    const generationId = data.sdGenerationJob.generationId
    console.log(`Generation ID: ${generationId}`)

    const statusUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`

    // Poll for status
    const maxRetries = 10
    const retryInterval = 10000 // 10 seconds

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, retryInterval))

      const statusResponse = await fetch(statusUrl, { headers })
      if (!statusResponse.ok) {
        throw new Error(`HTTP error! status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      const status = statusData.generations_by_pk.status

      if (status === "COMPLETE") {
        const generatedImages = statusData.generations_by_pk.generated_images
        if (generatedImages && generatedImages.length > 0) {
          return generatedImages[0].url
        } else {
          throw new Error("No images generated")
        }
      } else if (status !== "PENDING") {
        throw new Error(`Unexpected status: ${status}`)
      }
    }

    throw new Error("Image generation timed out")
  } catch (error) {
    console.error("Error in generateLeonardoImage:", error)
    throw error
  }
}

export async function generateImage(prompt: string, config: AIConfig): Promise<string> {
  const { provider, apiKey, model } = config

  if (provider === "leonardo") {
    return generateLeonardoImage(prompt, apiKey)
  } else if (provider === "openai") {
    return generateDalleImage(prompt, apiKey, model)
  } else {
    throw new Error(`Unsupported image provider: ${provider}`)
  }
}

async function generateDalleImage(prompt: string, apiKey: string, model: string): Promise<string> {
  const url = "https://api.openai.com/v1/images/generations"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }
  const body = {
    model: model,
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`DALL-E API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      throw new Error("No image data returned from DALL-E")
    }

    return data.data[0].url
  } catch (error) {
    console.error("Error in generateDalleImage:", error)
    throw error
  }
}


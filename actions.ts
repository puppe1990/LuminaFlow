"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import type { Section } from "./types"

export async function generateVideoScript(
  concept: string,
  numParts: number,
  provider: string,
  apiKey: string,
): Promise<Section[]> {
  const sections: Section[] = []
  let model

  switch (provider) {
    case "openai":
      model = openai("gpt-4", apiKey)
      break
    case "anthropic":
      model = anthropic("claude-2", apiKey)
      break
    default:
      throw new Error("Unsupported AI provider")
  }

  // Generate introduction
  const introPrompt = `Write an engaging introduction for a video about: ${concept}`
  const { text: intro } = await generateText({
    model,
    prompt: introPrompt,
  })
  sections.push({ id: "intro", content: intro })

  // Generate main sections
  for (let i = 0; i < numParts; i++) {
    const sectionPrompt = `Write part ${i + 1} of ${numParts} for a video about: ${concept}`
    const { text: content } = await generateText({
      model,
      prompt: sectionPrompt,
    })
    sections.push({ id: `section-${i}`, content })
  }

  // Generate call to action (in the middle)
  const ctaIndex = Math.floor(sections.length / 2)
  const ctaPrompt = `Write a compelling call to action for a video about: ${concept}`
  const { text: cta } = await generateText({
    model,
    prompt: ctaPrompt,
  })
  sections.splice(ctaIndex, 0, { id: "cta", content: cta })

  // Generate conclusion
  const outroPrompt = `Write a strong conclusion for a video about: ${concept}`
  const { text: outro } = await generateText({
    model,
    prompt: outroPrompt,
  })
  sections.push({ id: "outro", content: outro })

  return sections
}

export async function generateImagePrompt(concept: string, provider: string, apiKey: string): Promise<string> {
  let model

  switch (provider) {
    case "openai":
      model = openai("gpt-4", apiKey)
      break
    case "anthropic":
      model = anthropic("claude-2", apiKey)
      break
    default:
      throw new Error("Unsupported AI provider")
  }

  const prompt = `Generate a detailed image prompt for a video thumbnail about: ${concept}`
  const { text: imagePrompt } = await generateText({
    model,
    prompt,
  })

  return imagePrompt
}


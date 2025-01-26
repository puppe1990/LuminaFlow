import { openai } from "@ai-sdk/openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables")
}

export const openaiModel = openai("gpt-4")


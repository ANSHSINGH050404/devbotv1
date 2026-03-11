import type { LLMClient } from "./llm";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export function createProvider(type: string, apiKey: string): LLMClient {
  if (type === "openai") {
    return new OpenAIProvider(apiKey);
  }

  if (type === "gemini") {
    return new GeminiProvider(apiKey);
  }

  throw new Error("Unknown provider");
}

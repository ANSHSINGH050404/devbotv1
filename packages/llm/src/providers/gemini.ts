import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  LLMClient,
  LLMMessage,
  LLMResponse,
  LLMStreamChunk,
} from "../llm";

export class GeminiProvider implements LLMClient {
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const prompt = messages.map((m) => m.content).join("\n");

    const result = await this.model.generateContent(prompt);

    return {
      message: {
        role: "assistant" as const,
        content: result.response.text(),
      },
    };
  }

  async *stream(messages: LLMMessage[]): AsyncIterable<LLMStreamChunk> {
    const prompt = messages.map((m) => m.content).join("\n");

    const stream = await this.model.generateContentStream(prompt);

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) {
        yield { delta: text };
      }
    }
  }
}

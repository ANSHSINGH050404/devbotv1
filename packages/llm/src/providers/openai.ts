import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LLMClient, LLMMessage, LLMResponse, LLMStreamChunk } from "../llm";

export class OpenAIProvider implements LLMClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const openAiMessages: ChatCompletionMessageParam[] = messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          tool_call_id: m.toolCallId || "unknown",
        };
      }

      return {
        role: m.role,
        content: m.content,
        name: m.name,
      } as ChatCompletionMessageParam;
    });

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAiMessages,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error("OpenAI response missing message");
    }

    return {
      message: {
        role: "assistant" as const,
        content: choice.message.content || "",
      },
    };
  }

  async *stream(messages: LLMMessage[]): AsyncIterable<LLMStreamChunk> {
    const openAiMessages: ChatCompletionMessageParam[] = messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          tool_call_id: m.toolCallId || "unknown",
        };
      }

      return {
        role: m.role,
        content: m.content,
        name: m.name,
      } as ChatCompletionMessageParam;
    });

    const stream = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { delta };
      }
    }
  }
}

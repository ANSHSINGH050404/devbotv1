export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMResponse {
  message: {
    role: "assistant";
    content: string;
    toolCall?: {
      name: string;
      args: unknown;
    };
  };
}

export interface LLMStreamChunk {
  delta: string;
}

export interface LLMClient {
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
  stream?(messages: LLMMessage[]): AsyncIterable<LLMStreamChunk>;
}

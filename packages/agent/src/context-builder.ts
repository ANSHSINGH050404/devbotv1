export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id?: string;
  name: string;
  args: unknown;
}

export interface ContextMessage {
  role: MessageRole;
  content?: string;
  name?: string;
  toolCallId?: string;
  toolCall?: ToolCall;
  toolCalls?: ToolCall[];
}

export function buildContext(messages: ContextMessage[]) {
  return messages
    .filter((msg) => msg && typeof msg.role === "string")
    .map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : undefined,
      name: typeof msg.name === "string" ? msg.name : undefined,
      toolCallId:
        typeof msg.toolCallId === "string" ? msg.toolCallId : undefined,
      toolCall: msg.toolCall,
      toolCalls: msg.toolCalls,
    }));
}

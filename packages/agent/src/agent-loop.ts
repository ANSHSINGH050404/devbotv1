import type { ContextMessage, ToolCall } from "./context-builder";

export interface LlmClient {
  chat(context: ContextMessage[]): Promise<{ message: AgentMessage }>;
}

export interface Tool {
  execute(args: unknown): Promise<unknown>;
}

export interface ToolRegistry {
  [name: string]: Tool | undefined;
}

export interface AgentMessage {
  role: "assistant" | "tool" | "user" | "system";
  content?: string;
  toolCall?: ToolCall;
  toolCalls?: ToolCall[];
}

export interface RunAgentLoopOptions {
  llm: LlmClient;
  tools: ToolRegistry;
  context: ContextMessage[];
  maxIterations?: number;
}

export async function runAgentLoop({
  llm,
  tools,
  context,
  maxIterations = 8,
}: RunAgentLoopOptions) {
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await llm.chat(context);

    const message = response.message;

    const toolCalls = message.toolCalls ?? (message.toolCall ? [message.toolCall] : []);

    if (toolCalls.length > 0) {
      context.push({
        role: "assistant",
        content: message.content ?? "",
        toolCall: message.toolCall,
        toolCalls: message.toolCalls,
      });

      for (const call of toolCalls) {
        const toolName = call.name;
        const args = call.args;

        const tool = tools[toolName];

        if (!tool) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        const result = await tool.execute(args);

        context.push({
          role: "tool",
          name: toolName,
          toolCallId: call.id,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    // Final assistant response
    return message;
  }

  throw new Error("Agent loop exceeded iteration limit");
}

import type { ContextMessage, ToolCall } from "./context-builder";

export interface LlmClient {
  chat(context: ContextMessage[]): Promise<{ message: AgentMessage }>;
  stream?(context: ContextMessage[]): AsyncIterable<{ delta: string }>;
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

export type AgentStreamEvent =
  | { type: "token"; text: string }
  | { type: "tool"; name: string; args: unknown; result: unknown }
  | { type: "final"; message: AgentMessage };

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

export async function* runAgentLoopStream({
  llm,
  tools,
  context,
  maxIterations = 8,
}: RunAgentLoopOptions): AsyncIterable<AgentStreamEvent> {
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
        yield { type: "tool", name: toolName, args, result };
        context.push({
          role: "tool",
          name: toolName,
          toolCallId: call.id,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    if (llm.stream) {
      for await (const chunk of llm.stream(context)) {
        if (chunk.delta) {
          yield { type: "token", text: chunk.delta };
        }
      }
      yield { type: "final", message };
      return;
    }

    if (message.content) {
      yield { type: "token", text: message.content };
    }
    yield { type: "final", message };
    return;
  }

  throw new Error("Agent loop exceeded iteration limit");
}

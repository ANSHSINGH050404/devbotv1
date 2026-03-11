import { Hono } from "hono";
import { listMemories } from "session";
import {
  buildContext,
  runAgentLoop,
  runAgentLoopStream,
  type LlmClient,
  type ToolRegistry,
  type ContextMessage,
  type AgentStreamEvent,
} from "agent";

type RunEnv = {
  Variables: {
    llm: LlmClient;
    tools: ToolRegistry;
  };
};

export const runRoute = new Hono<RunEnv>();

runRoute.post("/", async (c) => {
  let body: { messages?: ContextMessage[]; maxIterations?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.messages)) {
    return c.json({ error: "messages must be an array" }, 400);
  }

  const messages = body.messages as ContextMessage[];
  const llm = c.get("llm") as LlmClient | undefined;
  const tools = c.get("tools") as ToolRegistry | undefined;
  if (!llm || !tools) {
    return c.json({ error: "LLM or tools not configured" }, 501);
  }

  try {
    const projectId = c.req.query("projectId");
    let contextMessages = buildContext(messages);
    const toolList = Object.keys(tools);
    contextMessages = [
      {
        role: "system",
        content:
          "You are a coding agent with access to tools for reading, searching, and editing the local repository. " +
          `Available tools: ${toolList.join(", ")}. ` +
          "If the user asks to analyze the codebase, use the search and read tools to inspect files directly.",
        name: undefined,
        toolCallId: undefined,
        toolCall: undefined,
        toolCalls: undefined,
      },
      ...contextMessages,
    ];
    if (projectId) {
      const memories = await listMemories(projectId, 50);
      if (memories.length > 0) {
        const memoryText = memories
          .map((m) => `- [${m.type}] ${m.value}`)
          .join("\n");
        contextMessages = [
          {
            role: "system",
            content: `Project memory:\n${memoryText}`,
            name: undefined,
            toolCallId: undefined,
            toolCall: undefined,
            toolCalls: undefined,
          },
          ...contextMessages,
        ];
      }
    }

    const result = await runAgentLoop({
      llm,
      tools,
      context: contextMessages,
      maxIterations: body.maxIterations,
    });

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent run failed";
    return c.json({ error: message }, 500);
  }
});

runRoute.post("/stream", async (c) => {
  let body: { messages?: ContextMessage[]; maxIterations?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!Array.isArray(body.messages)) {
    return c.json({ error: "messages must be an array" }, 400);
  }

  const messages = body.messages as ContextMessage[];
  const llm = c.get("llm") as LlmClient | undefined;
  const tools = c.get("tools") as ToolRegistry | undefined;
  if (!llm || !tools) {
    return c.json({ error: "LLM or tools not configured" }, 501);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: AgentStreamEvent | string) => {
        const payload =
          typeof event === "string" ? event : JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
      }, 15000);

      try {
        const projectId = c.req.query("projectId");
        let contextMessages = buildContext(messages);
        const toolList = Object.keys(tools);
        contextMessages = [
          {
            role: "system",
            content:
              "You are a coding agent with access to tools for reading, searching, and editing the local repository. " +
              `Available tools: ${toolList.join(", ")}. ` +
              "If the user asks to analyze the codebase, use the search and read tools to inspect files directly.",
            name: undefined,
            toolCallId: undefined,
            toolCall: undefined,
            toolCalls: undefined,
          },
          ...contextMessages,
        ];
        if (projectId) {
          const memories = await listMemories(projectId, 50);
          if (memories.length > 0) {
            const memoryText = memories
              .map((m) => `- [${m.type}] ${m.value}`)
              .join("\n");
            contextMessages = [
              {
                role: "system",
                content: `Project memory:\n${memoryText}`,
                name: undefined,
                toolCallId: undefined,
                toolCall: undefined,
                toolCalls: undefined,
              },
              ...contextMessages,
            ];
          }
        }

        for await (const evt of runAgentLoopStream({
          llm,
          tools,
          context: contextMessages,
          maxIterations: body.maxIterations,
        })) {
          if (evt.type === "token") {
            send({ type: "token", text: evt.text.replace(/\r?\n/g, "\\n") });
          } else {
            send(evt);
          }
        }
        send("[DONE]");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent run failed";
        send(`ERROR: ${message}`);
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

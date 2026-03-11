import { Hono } from "hono";
import {
  buildContext,
  runAgentLoop,
  runAgentLoopStream,
  type LlmClient,
  type ToolRegistry,
  type ContextMessage,
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
    const result = await runAgentLoop({
      llm,
      tools,
      context: buildContext(messages),
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

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        for await (const token of runAgentLoopStream({
          llm,
          tools,
          context: buildContext(messages),
          maxIterations: body.maxIterations,
        })) {
          send(token.replace(/\r?\n/g, "\\n"));
        }
        send("[DONE]");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent run failed";
        send(`ERROR: ${message}`);
      } finally {
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

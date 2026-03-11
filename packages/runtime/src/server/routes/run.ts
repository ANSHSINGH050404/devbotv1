import { Hono } from "hono";
import {
  buildContext,
  runAgentLoop,
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

  const llm = c.get("llm") as LlmClient | undefined;
  const tools = c.get("tools") as ToolRegistry | undefined;
  if (!llm || !tools) {
    return c.json({ error: "LLM or tools not configured" }, 501);
  }

  try {
    const result = await runAgentLoop({
      llm,
      tools,
      context: buildContext(body.messages),
      maxIterations: body.maxIterations,
    });

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent run failed";
    return c.json({ error: message }, 500);
  }
});

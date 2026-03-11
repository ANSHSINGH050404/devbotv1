import { Hono } from "hono";
import type { ToolRegistry as ToolRegistryType } from "tools";

import { healthRoute } from "./routes/health";
import { configRoute } from "./routes/config";
import { sessionRoute } from "./routes/session";
import { eventsRoute } from "./routes/events";
import { messageRoute } from "./routes/message";
import { runRoute } from "./routes/run";
import {
  ToolRegistry,
  readFileTool,
  writeFileTool,
  searchReplaceTool,
  applyPatchTool,
  searchFilesTool,
  grepCodeTool,
  findSymbolsTool,
} from "tools";
import { createProvider, type LLMClient } from "llm";

type ServerEnv = {
  Variables: {
    tools: ToolRegistryType;
    llm?: LLMClient;
  };
};

export function createServer() {
  const app = new Hono<ServerEnv>();
  const tools = new ToolRegistry();

  tools.register(readFileTool);
  tools.register(writeFileTool);
  tools.register(searchReplaceTool);
  tools.register(applyPatchTool);
  tools.register(searchFilesTool);
  tools.register(grepCodeTool);
  tools.register(findSymbolsTool);

  const provider = process.env.LLM_PROVIDER;
  const apiKey = process.env.LLM_API_KEY;
  const llm = provider && apiKey ? createProvider(provider, apiKey) : undefined;

  app.use("*", async (c, next) => {
    c.set("tools", tools);
    if (llm) {
      c.set("llm", llm);
    }
    await next();
  });

  app.route("/health", healthRoute);
  app.route("/config", configRoute);
  app.route("/session", sessionRoute);
  app.route("/message", messageRoute);
  app.route("/run", runRoute);
  app.route("/events", eventsRoute);

  return app;
}

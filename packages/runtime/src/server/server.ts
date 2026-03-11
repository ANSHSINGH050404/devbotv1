import { Hono } from "hono";

import { healthRoute } from "./routes/health";
import { configRoute } from "./routes/config";
import { sessionRoute } from "./routes/session";
import { eventsRoute } from "./routes/events";
import { messageRoute } from "./routes/message";
import { runRoute } from "./routes/run";
import { ToolRegistry, readFileTool } from "tools";

export function createServer() {
  const app = new Hono();
  const tools = new ToolRegistry();

  tools.register(readFileTool);

  app.use("*", async (c, next) => {
    c.set("tools", tools);
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

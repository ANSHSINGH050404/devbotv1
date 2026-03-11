import { Hono } from "hono";

import { healthRoute } from "./routes/health";
import { configRoute } from "./routes/config";
import { sessionRoute } from "./routes/session";
import { eventsRoute } from "./routes/events";
import { messageRoute } from "./routes/message";

export function createServer() {
  const app = new Hono();

  app.route("/health", healthRoute);
  app.route("/config", configRoute);
  app.route("/session", sessionRoute);
  app.route("/message", messageRoute);
  app.route("/events", eventsRoute);

  return app;
}

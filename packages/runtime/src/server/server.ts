import { Hono } from "hono";

import { healthRoute } from "./routes/health";
import { configRoute } from "./routes/config";
import { sessionRoute } from "./routes/session";
import { eventsRoute } from "./routes/events";

export function createServer() {
  const app = new Hono();

  app.route("/health", healthRoute);
  app.route("/config", configRoute);
  app.route("/session", sessionRoute);
  app.route("/events", eventsRoute);

  return app;
}
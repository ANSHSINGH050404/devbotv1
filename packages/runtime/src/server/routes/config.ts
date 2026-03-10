import { Hono } from "hono";

export const configRoute = new Hono();

configRoute.get("/", (c) => {
  return c.json({
    runtime: "dev-agent",
    version: "0.1.0",
    providers: []
  });
});
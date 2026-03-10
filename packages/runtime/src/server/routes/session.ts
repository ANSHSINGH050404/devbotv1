import { Hono } from "hono";

export const sessionRoute = new Hono();

sessionRoute.post("/", async (c) => {
  return c.json({
    message: "session creation not implemented yet"
  });
});
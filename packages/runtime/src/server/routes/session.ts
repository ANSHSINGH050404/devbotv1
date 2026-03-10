import { Hono } from "hono";

export const sessionRoute = new Hono();

sessionRoute.post("/", async (c) => {
  const body = await c.req.json();

  const prompt = body.prompt;

  return c.json({
    received: prompt,
    message: "Agent execution not implemented yet"
  });
});
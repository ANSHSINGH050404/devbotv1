import { Hono } from "hono";
import { createMessage, addMessagePart } from "session";

export const messageRoute = new Hono();

messageRoute.post("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  let body: { role?: string; content?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const role = body?.role;
  if (role !== "user" && role !== "assistant" && role !== "system") {
    return c.json({ error: "Invalid role" }, 400);
  }
  const content = body?.content;
  if (typeof content !== "string" || content.trim() === "") {
    return c.json({ error: "Invalid content" }, 400);
  }

  try {
    const message = await createMessage(sessionId, role);
    await addMessagePart(message.id, "text", content);
    return c.json(message);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create message";
    if (message === "Session not found") {
      return c.json({ error: message }, 404);
    }
    return c.json({ error: message }, 500);
  }
});

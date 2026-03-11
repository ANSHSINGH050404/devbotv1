import { Hono } from "hono";
import {
  addMemory,
  listMemories,
  searchMemories,
  upsertMemory,
} from "session";

export const memoryRoute = new Hono();

memoryRoute.post("/", async (c) => {
  let body: {
    projectId?: string;
    type?: "fact" | "context" | "task" | "note";
    key?: string;
    value?: string;
    importance?: number;
    upsert?: boolean;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.projectId || !body.projectId.trim()) {
    return c.json({ error: "projectId is required" }, 400);
  }
  if (!body.type) {
    return c.json({ error: "type is required" }, 400);
  }
  if (!body.value || !body.value.trim()) {
    return c.json({ error: "value is required" }, 400);
  }

  try {
    const result = body.upsert && body.key
      ? await upsertMemory({
          projectId: body.projectId,
          type: body.type,
          key: body.key,
          value: body.value,
          importance: body.importance ?? 0,
        })
      : await addMemory({
          projectId: body.projectId,
          type: body.type,
          key: body.key,
          value: body.value,
          importance: body.importance ?? 0,
        });

    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add memory";
    return c.json({ error: message }, 500);
  }
});

memoryRoute.get("/", async (c) => {
  const projectId = c.req.query("projectId");
  const query = c.req.query("q");
  const limit = Number(c.req.query("limit") ?? "200");

  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  if (query && query.trim()) {
    const result = await searchMemories(projectId, query, limit);
    return c.json(result);
  }

  const result = await listMemories(projectId, limit);
  return c.json(result);
});

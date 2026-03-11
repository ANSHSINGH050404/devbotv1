import { Hono } from "hono";
import {
  createSession,
  listSessions,
  getSession,
} from "session";

export const sessionRoute = new Hono();

sessionRoute.post("/", async (c) => {
  let projectId = "default-project";
  let title: string | undefined;
  try {
    const body = await c.req.json();
    if (body && typeof body.projectId === "string" && body.projectId.trim()) {
      projectId = body.projectId.trim();
    }
    if (body && typeof body.prompt === "string" && body.prompt.trim()) {
      title = body.prompt.trim();
    }
  } catch {
    // ignore invalid JSON and use default
  }

  const session = await createSession(projectId, title);

  return c.json(session);
});

sessionRoute.get("/", async (c) => {
  const sessions = await listSessions();

  return c.json(sessions);
});

sessionRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  const session = await getSession(id);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(session);
});

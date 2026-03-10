import { Hono } from "hono";
import {
  createSession,
  listSessions,
  getSession,
} from "../../../../session/src/service/session-service";

export const sessionRoute = new Hono();

sessionRoute.post("/", async (c) => {
  const session = await createSession("default-project");

  return c.json(session);
});

sessionRoute.get("/", async (c) => {
  const sessions = await listSessions();

  return c.json(sessions);
});

sessionRoute.get("/:id", async (c) => {
  const id = c.req.param("id");

  const session = await getSession(id);

  return c.json(session);
});
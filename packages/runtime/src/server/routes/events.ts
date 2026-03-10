import { Hono } from "hono";

export const eventsRoute = new Hono();

eventsRoute.get("/", async (c) => {
  return c.text("event stream coming soon");
});
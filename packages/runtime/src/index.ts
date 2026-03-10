import { serve } from "bun";
import { createServer } from "./server/server";

export async function startRuntime() {
  const app = createServer();

  const port = 3000;

  console.log(`Runtime starting on http://localhost:${port}`);

  serve({
    port,
    fetch: app.fetch
  });
}

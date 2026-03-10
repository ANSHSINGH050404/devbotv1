import { serve } from "bun";
import { createServer } from "./server/server";
import { bootstrapProject } from "./project/bootstrap";

export async function startRuntime() {
  const app = createServer();
  const project = bootstrapProject();

  const port = 3000;

  console.log(`Runtime starting on http://localhost:${port}`);
  console.log(`Project: ${project.name}`);

  serve({
    port,
    fetch: app.fetch
  });
}

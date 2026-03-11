import { serve } from "bun";
import { createServer } from "./server/server";
import { bootstrapProject } from "./project/bootstrap";

export async function startRuntime() {
  const app = createServer();
  const project = bootstrapProject();

  const port = 3000;

 
  
  console.log("Project detected:");
  console.log(project);

  serve({
    port,
    fetch: app.fetch,
    idleTimeout: 0
  });

   console.log(`Runtime starting on http://localhost:${port}`);
}

import { startRuntime } from "runtime";

export const serveCommand = {
  command: "serve",
  describe: "Start the local runtime server",
  handler: async () => {
    console.log("Starting agent runtime...");
    await startRuntime();
  },
};
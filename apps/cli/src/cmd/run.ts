export const runCommand = {
  command: "run <prompt>",
  describe: "Send a prompt to the agent",
  handler: async (argv: { prompt: string }) => {
    const prompt = argv.prompt;

    console.log("Prompt:", prompt);

    const res = await fetch("http://localhost:3000/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    console.log("Response:", data);
  },
};

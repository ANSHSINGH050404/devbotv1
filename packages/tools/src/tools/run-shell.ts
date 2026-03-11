import { spawn } from "child_process"

export const runShellTool = {
  name: "run_shell",

  description: "Execute a shell command",

  async execute({ command }: { command: string }) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, {
        shell: true,
      })

      let output = ""

      process.stdout.on("data", (data) => {
        output += data.toString()
      })

      process.on("close", () => {
        resolve({ output })
      })

      process.on("error", reject)
    })
  },
}
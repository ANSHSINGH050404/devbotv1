import type { Tool } from "./tool"

export class ToolRegistry {
  private tools: Record<string, Tool> = {}

  register(tool: Tool) {
    this.tools[tool.name] = tool
  }

  get(name: string) {
    return this.tools[name]
  }

  list() {
    return Object.values(this.tools)
  }
}
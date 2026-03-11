import type { PermissionRule } from "./policy"

export class PermissionEngine {
  private rules: PermissionRule[]

  constructor(rules: PermissionRule[]) {
    this.rules = rules
  }

  check(tool: string, input: string) {
    for (const rule of this.rules) {
      if (rule.tool !== tool) continue

      if (!rule.pattern) return rule.mode

      if (input.includes(rule.pattern)) {
        return rule.mode
      }
    }

    return "allow"
  }
}
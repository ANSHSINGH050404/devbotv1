export type PermissionMode = "allow" | "deny" | "ask"

export interface PermissionRule {
  tool: string
  pattern?: string
  mode: PermissionMode
}
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  tool: text("tool").notNull(),
  pattern: text("pattern"),
  mode: text("mode").notNull()
});
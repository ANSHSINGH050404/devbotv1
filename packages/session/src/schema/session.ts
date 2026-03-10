import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  title: text("title"),
  status: text("status").default("active"),
  createdAt: text("created_at").notNull()
});
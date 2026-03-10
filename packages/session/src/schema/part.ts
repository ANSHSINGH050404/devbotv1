import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const parts = sqliteTable("parts", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  type: text("type").notNull(),
  content: text("content")
});
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { messages } from "../schema/message";
import { parts } from "../schema/part";
import { sessions } from "../schema/session";

export async function createMessage(
  sessionId: string,
  role: "user" | "assistant" | "system"
) {
  if (!sessionId || !sessionId.trim()) {
    throw new Error("sessionId is required");
  }

  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session[0]) {
    throw new Error("Session not found");
  }

  const id = randomUUID();

  await db.insert(messages).values({
    id,
    sessionId,
    role,
    createdAt: new Date().toISOString(),
  });

  return { id };
}
export async function addMessagePart(
  messageId: string,
  type: string,
  content: string
) {
  if (!messageId || !messageId.trim()) {
    throw new Error("messageId is required");
  }
  if (!type || !type.trim()) {
    throw new Error("type is required");
  }
  if (content == null || content.trim() === "") {
    throw new Error("content is required");
  }

  const message = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  if (!message[0]) {
    throw new Error("Message not found");
  }

  const id = randomUUID();

  await db.insert(parts).values({
    id,
    messageId,
    type,
    content,
  });

  return { id };
}

export async function getSessionMessages(sessionId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId));
}

export async function getMessageParts(messageId: string) {
  return db
    .select()
    .from(parts)
    .where(eq(parts.messageId, messageId));
}


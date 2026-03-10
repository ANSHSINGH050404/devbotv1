import { db } from "../db";
import { sessions } from "../schema/session";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export async function createSession(projectId: string) {
  const id = randomUUID();

  await db.insert(sessions).values({
    id,
    projectId,
    title: "New Session",
    status: "active",
    createdAt: new Date().toISOString(),
  });

  return { id };
}

export async function listSessions() {
  return db.select().from(sessions);
}


export async function getSession(sessionId: string) {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  return result[0];
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
) {
  await db
    .update(sessions)
    .set({ title })
    .where(eq(sessions.id, sessionId));
}

export async function archiveSession(sessionId: string) {
  await db
    .update(sessions)
    .set({ status: "archived" })
    .where(eq(sessions.id, sessionId));
}
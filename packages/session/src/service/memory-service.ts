import { randomUUID } from "crypto";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "../db";
import { memories } from "../schema/memory";

export type MemoryType = "fact" | "context" | "task" | "note";

export async function addMemory({
  projectId,
  type,
  key,
  value,
  importance = 0,
}: {
  projectId: string;
  type: MemoryType;
  key?: string;
  value: string;
  importance?: number;
}) {
  if (!projectId || !projectId.trim()) {
    throw new Error("projectId is required");
  }
  if (!value || !value.trim()) {
    throw new Error("value is required");
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(memories).values({
    id,
    projectId,
    type,
    key: key?.trim(),
    value: value.trim(),
    importance,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function upsertMemory({
  projectId,
  type,
  key,
  value,
  importance = 0,
}: {
  projectId: string;
  type: MemoryType;
  key: string;
  value: string;
  importance?: number;
}) {
  if (!projectId || !projectId.trim()) {
    throw new Error("projectId is required");
  }
  if (!key || !key.trim()) {
    throw new Error("key is required");
  }
  if (!value || !value.trim()) {
    throw new Error("value is required");
  }

  const existing = await db
    .select()
    .from(memories)
    .where(and(eq(memories.projectId, projectId), eq(memories.key, key)))
    .limit(1);

  const now = new Date().toISOString();

  if (existing[0]) {
    await db
      .update(memories)
      .set({
        value: value.trim(),
        type,
        importance,
        updatedAt: now,
      })
      .where(eq(memories.id, existing[0].id));
    return { id: existing[0].id };
  }

  return addMemory({ projectId, type, key, value, importance });
}

export async function listMemories(projectId: string, limit = 200) {
  return db
    .select()
    .from(memories)
    .where(eq(memories.projectId, projectId))
    .orderBy(desc(memories.importance), desc(memories.updatedAt))
    .limit(limit);
}

export async function searchMemories(
  projectId: string,
  query: string,
  limit = 50
) {
  const q = `%${query}%`;
  return db
    .select()
    .from(memories)
    .where(
      and(eq(memories.projectId, projectId), like(memories.value, q))
    )
    .orderBy(desc(memories.importance), desc(memories.updatedAt))
    .limit(limit);
}

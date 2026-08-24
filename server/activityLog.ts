/** CMS activity log: append-only, server-authenticated records that power the administrator dashboard audit trail. */
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { activityLogs, type ActivityLog } from "../drizzle/schema";
import { getDb } from "./db";

export type ActivityInput = { actorOpenId: string; actorName?: string | null; eventType: string; resourceType: string; resourceId?: string | null; summary: string; detail?: Record<string, unknown> | null };

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

export async function recordActivity(input: ActivityInput): Promise<ActivityLog> {
  const db = await requireDb();
  const row: typeof activityLogs.$inferInsert = { id: `activity_${nanoid(16)}`, actorOpenId: input.actorOpenId, actorName: input.actorName || null, eventType: input.eventType, resourceType: input.resourceType, resourceId: input.resourceId || null, summary: input.summary, detail: input.detail || null };
  await db.insert(activityLogs).values(row);
  const [created] = await db.select().from(activityLogs).where(eq(activityLogs.id, row.id)).limit(1);
  if (!created) throw new Error("Activity record could not be created.");
  return created;
}

export async function listRecentActivity(limit = 12) {
  const db = await requireDb();
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

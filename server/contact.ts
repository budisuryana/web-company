/** Contact form submissions: durable records for enquiries sent from the public contact page. */
import { and, count, desc, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { contactSubmissions, type ContactSubmission, type SubmissionStatus } from "../drizzle/schema";
import { getDb } from "./db";

export type SubmissionInput = {
  name: string;
  email: string;
  company?: string | null;
  message: string;
  ip?: string | null;
  userAgent?: string | null;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

/**
 * Per-IP throttle for the one publicly writable endpoint. In-memory and therefore
 * per-process — enough to blunt a naive flood, not a substitute for a real WAF. Entries
 * are pruned on each check so the map cannot grow without bound.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recentByIp = new Map<string, number[]>();

export function submissionRateLimited(ip: string): boolean {
  const now = Date.now();
  recentByIp.forEach((stamps: number[], key: string) => {
    const alive = stamps.filter((t: number) => now - t < WINDOW_MS);
    if (alive.length) recentByIp.set(key, alive);
    else recentByIp.delete(key);
  });
  const mine = recentByIp.get(ip) ?? [];
  if (mine.length >= MAX_PER_WINDOW) return true;
  mine.push(now);
  recentByIp.set(ip, mine);
  return false;
}

export async function createSubmission(input: SubmissionInput): Promise<ContactSubmission> {
  const db = await requireDb();
  const row: typeof contactSubmissions.$inferInsert = {
    id: `msg_${nanoid(16)}`,
    name: input.name,
    email: input.email,
    company: input.company?.trim() || null,
    message: input.message,
    ip: input.ip || null,
    userAgent: input.userAgent?.slice(0, 500) || null,
  };
  await db.insert(contactSubmissions).values(row);
  const [created] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, row.id)).limit(1);
  if (!created) throw new Error("Submission could not be saved.");
  return created;
}

export async function listSubmissions(status?: SubmissionStatus): Promise<ContactSubmission[]> {
  const db = await requireDb();
  const query = db.select().from(contactSubmissions);
  const rows = status
    ? await query.where(eq(contactSubmissions.status, status)).orderBy(desc(contactSubmissions.createdAt))
    : await query.orderBy(desc(contactSubmissions.createdAt));
  return rows;
}

export async function getSubmission(id: string): Promise<ContactSubmission | undefined> {
  const db = await requireDb();
  const [row] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id)).limit(1);
  return row;
}

export async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<ContactSubmission | undefined> {
  const db = await requireDb();
  await db
    .update(contactSubmissions)
    .set({ status, handledAt: status === "new" ? null : new Date() })
    .where(eq(contactSubmissions.id, id));
  return getSubmission(id);
}

export async function deleteSubmission(id: string): Promise<{ success: true }> {
  const db = await requireDb();
  await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
  return { success: true };
}

/** Counts for the CMS: unread total, plus how many landed in the last 7 days. */
export async function getSubmissionCounts() {
  const db = await requireDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [[unread], [recent]] = await Promise.all([
    db.select({ value: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
    db.select({ value: count() }).from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, weekAgo))),
  ]);
  return { unread: Number(unread?.value ?? 0), lastSevenDays: Number(recent?.value ?? 0) };
}

/** CMS overview service: compact counts and recent audit records for the private publishing dashboard. */
import { count, eq } from "drizzle-orm";
import { products, users } from "../drizzle/schema";
import { getDb } from "./db";
import { listRecentActivity } from "./activityLog";

export async function getCmsDashboard() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const [[registered], [published], [drafts], [administrators], [pending], recentActivity] = await Promise.all([
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(products).where(eq(products.publicationStatus, "published")),
    db.select({ total: count() }).from(products).where(eq(products.publicationStatus, "draft")),
    db.select({ total: count() }).from(users).where(eq(users.role, "admin")),
    db.select({ total: count() }).from(users).where(eq(users.role, "user")),
    listRecentActivity(12),
  ]);
  return { metrics: { products: Number(registered.total), publishedProducts: Number(published.total), draftProducts: Number(drafts.total), administrators: Number(administrators.total), pendingUsers: Number(pending.total) }, recentActivity };
}

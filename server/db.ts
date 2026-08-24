/** Core database access: authentication helpers are intentionally small; Product Registry queries live in registry.ts. */
import { eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: PostgresJsDatabase | null = null;

/** Keep role assignment authoritative in the database, except for the configured project owner who must retain bootstrap admin access. */
export function getRolePlan(openId: string, requestedRole: InsertUser["role"] | undefined, ownerOpenId = ENV.ownerOpenId) {
  const isConfiguredOwner = Boolean(ownerOpenId) && openId === ownerOpenId;
  const insertRole = requestedRole ?? (isConfiguredOwner ? "admin" : "user");
  const updateRole = requestedRole ?? (isConfiguredOwner ? "admin" : undefined);
  return { insertRole, updateRole };
}

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    try {
      database = drizzle(postgres(process.env.DATABASE_URL));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      database = null;
    }
  }
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field];
      updateSet[field] = user[field];
    }
  });
  const rolePlan = getRolePlan(user.openId, user.role);
  values.role = rolePlan.insertRole;
  // Never downgrade a database-appointed admin on routine OAuth sign-in.
  // The configured project owner is re-promoted deliberately as the bootstrap account.
  if (rolePlan.updateRole) updateSet.role = rolePlan.updateRole;
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

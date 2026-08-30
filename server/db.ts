import { eq, ilike, or } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { hashPassword } from "./_core/password";
import { demoSeedAllowed } from "./seedPolicy";

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
  (["name", "email", "username", "passwordHash", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field];
      updateSet[field] = user[field];
    }
  });
  const rolePlan = getRolePlan(user.openId, user.role);
  values.role = rolePlan.insertRole;
  if (rolePlan.updateRole) updateSet.role = rolePlan.updateRole;
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByUsernameOrEmail(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;
  const term = identifier.trim().toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(or(ilike(users.email, term), ilike(users.username, term), eq(users.openId, term)))
    .limit(1);
  return result[0];
}

export type DefaultAdminOutcome = "skipped" | "created" | "repaired" | "unchanged";

/**
 * Creates the local development admin account.
 *
 * Returns "skipped" without touching the database whenever demo seeding is not
 * allowed — the guard runs before any query so production cannot create, or
 * reset, a credential nobody chose.
 */
export async function ensureDefaultAdmin(): Promise<DefaultAdminOutcome> {
  if (!demoSeedAllowed()) return "skipped";
  const db = await getDb();
  if (!db) return "skipped";
  const existing = await getUserByUsernameOrEmail("admin");
  if (!existing) {
    await db.insert(users).values({
      openId: "local_admin",
      username: "admin",
      name: "Administrator",
      email: "admin@workshopcollective.co",
      passwordHash: hashPassword("admin123"),
      loginMethod: "credentials",
      role: "admin",
      lastSignedIn: new Date(),
    });
    return "created";
  }
  if (!existing.passwordHash) {
    await db
      .update(users)
      .set({
        username: existing.username || "admin",
        passwordHash: hashPassword("admin123"),
        role: "admin",
      })
      .where(eq(users.id, existing.id));
    return "repaired";
  }
  return "unchanged";
}

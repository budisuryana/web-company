/** CMS user administration: only server-verified admins may manage roles; the project owner and the final administrator cannot be demoted. */
import { asc, eq } from "drizzle-orm";
import { users, type User } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

export type ManagedUser = Pick<User, "id" | "openId" | "name" | "email" | "role" | "createdAt" | "lastSignedIn"> & { isProjectOwner: boolean };

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

function asManagedUser(user: User): ManagedUser {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn, isProjectOwner: Boolean(ENV.ownerOpenId) && user.openId === ENV.ownerOpenId };
}

export function getRoleChangeBlock(input: { actorOpenId: string; targetOpenId: string; targetRole: "admin" | "user"; nextRole: "admin" | "user"; ownerOpenId: string; adminCount: number }) {
  if (input.nextRole !== "user") return null;
  if (input.targetOpenId === input.ownerOpenId) return "The configured project owner cannot be demoted from the CMS.";
  if (input.targetOpenId === input.actorOpenId) return "You cannot remove your own administrator access.";
  if (input.targetRole === "admin" && input.adminCount <= 1) return "Keep at least one administrator for secure recovery.";
  return null;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const db = await requireDb();
  const rows = await db.select().from(users).orderBy(asc(users.name), asc(users.openId));
  return rows.map(asManagedUser);
}

export async function setManagedUserRole(input: { actorOpenId: string; targetOpenId: string; role: "admin" | "user" }): Promise<ManagedUser> {
  const db = await requireDb();
  const [target] = await db.select().from(users).where(eq(users.openId, input.targetOpenId)).limit(1);
  if (!target) throw new Error("User not found. Ask this person to sign in once before assigning a role.");
  const adminRows = input.role === "user" && target.role === "admin" ? await db.select({ openId: users.openId }).from(users).where(eq(users.role, "admin")) : [];
  const block = getRoleChangeBlock({ actorOpenId: input.actorOpenId, targetOpenId: input.targetOpenId, targetRole: target.role, nextRole: input.role, ownerOpenId: ENV.ownerOpenId, adminCount: adminRows.length });
  if (block) throw new Error(block);
  await db.update(users).set({ role: input.role }).where(eq(users.openId, input.targetOpenId));
  const [updated] = await db.select().from(users).where(eq(users.openId, input.targetOpenId)).limit(1);
  if (!updated) throw new Error("User role update could not be completed.");
  return asManagedUser(updated);
}

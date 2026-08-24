/** CMS user-management tRPC integration: exercise the same protected role mutations used by the administrator panel and restore the database afterward. */
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb, upsertUser } from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const temporaryOpenId = `user-management-test-${Date.now().toString(36)}`;
const adminCtx: TrpcContext = {
  user: { id: 880, openId: "user-management-test-actor", email: "role-manager@example.com", name: "Role manager", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};
const caller = appRouter.createCaller(adminCtx);

afterAll(async () => {
  const db = await getDb();
  if (db) await db.delete(users).where(eq(users.openId, temporaryOpenId));
});

describe("CMS user-management tRPC procedures", () => {
  it("lists a signed-in account, promotes it to admin, and safely revokes the temporary role", async () => {
    await upsertUser({ openId: temporaryOpenId, name: "Temporary reviewer", email: "temporary-reviewer@example.com", loginMethod: "test", role: "user", lastSignedIn: new Date() });
    const listed = await caller.registry.admin.users.list();
    expect(listed.find((user) => user.openId === temporaryOpenId)?.role).toBe("user");

    const promoted = await caller.registry.admin.users.setRole({ openId: temporaryOpenId, role: "admin" });
    expect(promoted.role).toBe("admin");
    const afterPromotion = await caller.registry.admin.users.list();
    expect(afterPromotion.find((user) => user.openId === temporaryOpenId)?.role).toBe("admin");

    const demoted = await caller.registry.admin.users.setRole({ openId: temporaryOpenId, role: "user" });
    expect(demoted.role).toBe("user");
  }, 30000);

  it("rejects self-demotion and configured-owner demotion before persisting a change", async () => {
    const selfCaller = appRouter.createCaller({ ...adminCtx, user: { ...adminCtx.user!, openId: temporaryOpenId } });
    await expect(selfCaller.registry.admin.users.setRole({ openId: temporaryOpenId, role: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    if (ENV.ownerOpenId) await expect(caller.registry.admin.users.setRole({ openId: ENV.ownerOpenId, role: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

/** Authentication role tests: owner bootstrap and database-appointed admin roles must remain server-enforced. */
import { describe, expect, it } from "vitest";
import { getRolePlan } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("administrator role bootstrap", () => {
  it("promotes the configured project owner on creation and routine sign-in", () => {
    expect(getRolePlan("owner-open-id", undefined, "owner-open-id")).toEqual({ insertRole: "admin", updateRole: "admin" });
  });

  it("creates other OAuth users as standard users without overwriting a database-appointed role later", () => {
    expect(getRolePlan("member-open-id", undefined, "owner-open-id")).toEqual({ insertRole: "user", updateRole: undefined });
  });

  it("honors an explicit role change from a trusted server-side database operation", () => {
    expect(getRolePlan("member-open-id", "admin", "owner-open-id")).toEqual({ insertRole: "admin", updateRole: "admin" });
  });
});

describe("CMS role enforcement", () => {
  it("rejects a signed-in non-admin before any registry procedure runs", async () => {
    const nonAdminCtx: TrpcContext = {
      user: { id: 44, openId: "member-open-id", email: "member@example.com", name: "Member", loginMethod: "oauth", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => undefined } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(nonAdminCtx);
    await expect(caller.registry.admin.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

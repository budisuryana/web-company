/** CMS user-management tests: sensitive role changes must retain an owner and a recovery administrator. */
import { describe, expect, it } from "vitest";
import { getRoleChangeBlock } from "./userManagement";

describe("CMS role-change safeguards", () => {
  it("allows an existing administrator to approve a signed-in standard user", () => {
    expect(getRoleChangeBlock({ actorOpenId: "admin-a", targetOpenId: "member-a", targetRole: "user", nextRole: "admin", ownerOpenId: "owner-a", adminCount: 1 })).toBeNull();
  });

  it("protects the configured owner, self, and final administrator from demotion", () => {
    expect(getRoleChangeBlock({ actorOpenId: "admin-a", targetOpenId: "owner-a", targetRole: "admin", nextRole: "user", ownerOpenId: "owner-a", adminCount: 2 })).toContain("owner");
    expect(getRoleChangeBlock({ actorOpenId: "admin-a", targetOpenId: "admin-a", targetRole: "admin", nextRole: "user", ownerOpenId: "owner-a", adminCount: 2 })).toContain("own");
    expect(getRoleChangeBlock({ actorOpenId: "admin-a", targetOpenId: "admin-b", targetRole: "admin", nextRole: "user", ownerOpenId: "owner-a", adminCount: 1 })).toContain("at least one");
  });
});

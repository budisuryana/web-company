/** Registry slug + timestamp contracts: duplicate slugs fail as CONFLICT and updates refresh updatedAt. */
import assert from "node:assert/strict";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { activityLogs, products } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const adminCtx: TrpcContext = {
  user: { id: 991, openId: "slug-contract-admin", email: "slug-contract@example.com", name: "Slug contract admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};
const caller = appRouter.createCaller(adminCtx);
const slugStamp = Date.now().toString(36);

function productInput(slug: string) {
  return {
    name: "Slug contract verification", slug, shortDescription: "Temporary integration record.", fullDescription: "A temporary record used only to verify registry contracts.", heroHeadline: "Verify the contract.", problem: "The CMS needs dependable rules.", solution: "This test calls the protected procedures.", outcome: "Temporary records are removed afterwards.",
    category: "Verification", productStatus: "planned" as const, publicationStatus: "draft" as const,
    capabilities: ["slug contract"], targetUsers: "Automated verification only.", demoUrl: "", workflowSteps: [{ title: "Create", copy: "Use the admin procedure." }],
    featured: false, displayOrder: 998,
  };
}

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(like(products.slug, `%${slugStamp}`));
  await db.delete(activityLogs).where(eq(activityLogs.actorOpenId, adminCtx.user!.openId));
});

describe("registry slug contract", () => {
  it("rejects creating a product whose slug already exists with a CONFLICT", async () => {
    const error = await caller.registry.admin.create(productInput("hris")).catch((cause: { code?: string; message?: string }) => cause);
    expect(error?.code).toBe("CONFLICT");
    expect(String(error?.message)).toContain("already used");
    const remaining = await caller.registry.admin.list();
    expect(remaining.filter((product) => product.name === "Slug contract verification").length, "no partial record may survive a rejected create").toBe(0);
  });

  it("allows saving a product that keeps its own slug", async () => {
    const created = await caller.registry.admin.create(productInput(`own-slug-${slugStamp}`));
    assert.ok(created);
    const updated = await caller.registry.admin.update({ id: created.id, product: productInput(`own-slug-${slugStamp}`) });
    expect(updated?.slug).toBe(`own-slug-${slugStamp}`);
  });

  it("rejects renaming a product onto another product's slug", async () => {
    const created = await caller.registry.admin.create(productInput(`rename-src-${slugStamp}`));
    assert.ok(created);
    const error = await caller.registry.admin.update({ id: created.id, product: productInput("hris") }).catch((cause: { code?: string }) => cause);
    expect(error?.code).toBe("CONFLICT");
  });

  it("refreshes updatedAt when an existing product is updated", async () => {
    const created = await caller.registry.admin.create(productInput(`stamp-${slugStamp}`));
    assert.ok(created);
    const before = created.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const updated = await caller.registry.admin.update({ id: created.id, product: productInput(`stamp-${slugStamp}`) });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(before);
  });
});

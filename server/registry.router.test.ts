/** Product Registry tRPC integration: verifies the same admin mutation contracts used by the CMS, with cleanup restoring the live registry. */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { activityLogs } from "../drizzle/schema";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const adminCtx: TrpcContext = {
  user: { id: 999, openId: "registry-test-admin", email: "registry-test@example.com", name: "Registry test admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};
const caller = appRouter.createCaller(adminCtx);
const stamp = Date.now().toString(36);
const originalOrder = (await caller.registry.admin.list()).map((product) => product.id);
let temporaryId: string | null = null;
const gifDataUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

afterAll(async () => {
  if (temporaryId) await caller.registry.admin.remove({ id: temporaryId }).catch(() => undefined);
  if (originalOrder.length) await caller.registry.admin.reorder({ ids: originalOrder });
  const db = await getDb();
  if (db) await db.delete(activityLogs).where(eq(activityLogs.actorOpenId, adminCtx.user!.openId));
});

describe("registry admin tRPC mutations", () => {
  it("creates, publishes, orders, attaches media to, and deletes a product through the CMS contract", async () => {
    const initialDashboard = await caller.registry.admin.dashboard();
    expect(initialDashboard.metrics.products).toBeGreaterThan(0);
    const created = await caller.registry.admin.create({ name: "Registry tRPC verification", slug: `registry-trpc-${stamp}`, shortDescription: "Temporary integration record.", fullDescription: "A temporary record used only to verify the CMS tRPC contract.", heroHeadline: "Verify the registry contract.", problem: "The CMS needs dependable state changes.", solution: "This test calls the exact protected procedures used by the admin UI.", outcome: "The product is removed and the original registry ordering is restored.", category: "Verification", productStatus: "planned", publicationStatus: "draft", capabilities: ["tRPC mutations", "Clean state"], targetUsers: "Automated verification only.", demoUrl: "", workflowSteps: [{ title: "Create", copy: "Use the admin procedure." }], featured: false, displayOrder: 999 });
    assert.ok(created);
    temporaryId = created.id;
    const dashboardAfterCreate = await caller.registry.admin.dashboard();
    expect(dashboardAfterCreate.recentActivity.some((activity) => activity.eventType === "product.created" && activity.resourceId === temporaryId)).toBe(true);

    const draftPublic = await caller.registry.public.list();
    expect(draftPublic.some((product) => product.id === temporaryId)).toBe(false);

    const published = await caller.registry.admin.update({ id: temporaryId, product: { name: "Registry tRPC verification", slug: `registry-trpc-${stamp}`, shortDescription: "Temporary integration record.", fullDescription: "A temporary record used only to verify the CMS tRPC contract.", heroHeadline: "Verify the registry contract.", problem: "The CMS needs dependable state changes.", solution: "This test calls the exact protected procedures used by the admin UI.", outcome: "The product is removed and the original registry ordering is restored.", category: "Verification", productStatus: "active", publicationStatus: "published", capabilities: ["tRPC mutations", "Clean state"], targetUsers: "Automated verification only.", demoUrl: "", workflowSteps: [{ title: "Publish", copy: "Expose the product publicly." }], featured: true, displayOrder: 999 } });
    expect(published?.publicationStatus).toBe("published");
    const publicAfterPublish = await caller.registry.public.list();
    expect(publicAfterPublish.some((product) => product.id === temporaryId)).toBe(true);

    await caller.registry.media.upload({ productId: temporaryId, assetType: "cover", fileName: "verification.gif", contentType: "image/gif", dataUrl: gifDataUrl, alt: "Verification cover" });
    await caller.registry.media.upload({ productId: temporaryId, assetType: "screenshot", fileName: "one.gif", contentType: "image/gif", dataUrl: gifDataUrl, alt: "Verification one" });
    const withFirstScreenshot = await caller.registry.media.upload({ productId: temporaryId, assetType: "screenshot", fileName: "two.gif", contentType: "image/gif", dataUrl: gifDataUrl, alt: "Verification two" });
    expect(withFirstScreenshot?.coverUrl).toContain("/manus-storage/");
    expect(withFirstScreenshot?.screenshots).toHaveLength(2);

    const reverseScreenshotIds = [...(withFirstScreenshot?.screenshots ?? [])].reverse().map((screenshot) => screenshot.id);
    const reorderedScreenshots = await caller.registry.media.reorderScreenshots({ productId: temporaryId, ids: reverseScreenshotIds });
    expect(reorderedScreenshots?.screenshots[0]?.id).toBe(reverseScreenshotIds[0]);

    const reorderedProducts = await caller.registry.admin.reorder({ ids: [temporaryId, ...originalOrder] });
    expect(reorderedProducts[0]?.id).toBe(temporaryId);

    const deletion = await caller.registry.admin.remove({ id: temporaryId });
    expect(deletion.success).toBe(true);
    temporaryId = null;
    await caller.registry.admin.reorder({ ids: originalOrder });
    const finalProducts = await caller.registry.admin.list();
    expect(finalProducts.map((product) => product.id)).toEqual(originalOrder);
  }, 30000);
});

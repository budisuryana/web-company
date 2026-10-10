/** Bilingual CMS API: admin-only edits, validation as BAD_REQUEST, and the public reader seeing saved and reset values. */
import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { activityLogs, pageContent } from "../drizzle/schema";
import { MESSAGES } from "@shared/i18n/messages";
import { getDb } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function ctx(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role
      ? { id: role === "admin" ? 981 : 982, openId: `content-router-${role}`, email: `${role}@example.com`, name: `Content ${role}`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const admin = appRouter.createCaller(ctx("admin"));
const member = appRouter.createCaller(ctx("user"));
const visitor = appRouter.createCaller(ctx(null));
const KEYS = ["upcoming.items.0.description", "about.storyTitle"];

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(pageContent).where(inArray(pageContent.key, KEYS));
  await db.delete(activityLogs).where(eq(activityLogs.actorOpenId, "content-router-admin"));
});

describe("content API access", () => {
  it("lets only admins list, update and reset", async () => {
    for (const caller of [member, visitor]) {
      await expect(caller.content.admin.list()).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|UNAUTHORIZED/) });
      await expect(caller.content.admin.update({ key: "about.storyTitle", locale: "en", value: "x" })).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|UNAUTHORIZED/) });
      await expect(caller.content.admin.reset({ key: "about.storyTitle", locale: "en" })).rejects.toMatchObject({ code: expect.stringMatching(/FORBIDDEN|UNAUTHORIZED/) });
    }
  });

  it("returns validation problems as BAD_REQUEST", async () => {
    await expect(admin.content.admin.update({ key: "about.storyTitle", locale: "en", value: " " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.content.admin.update({ key: "contact.consentLink", locale: "en", value: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("content API round trip", () => {
  it("publishes an Indonesian edit to the public reader immediately, and resets it", async () => {
    await admin.content.admin.update({ key: "upcoming.items.0.description", locale: "id", value: "Deskripsi ReportForge versi CMS." });
    expect((await visitor.content.public.forLocale({ locale: "id" })).overrides["upcoming.items.0.description"]).toBe("Deskripsi ReportForge versi CMS.");
    expect((await visitor.content.public.forLocale({ locale: "en" })).overrides["upcoming.items.0.description"]).toBeUndefined();

    const listed = (await admin.content.admin.list()).find((entry) => entry.key === "upcoming.items.0.description");
    expect(listed?.values.id.override).toBe("Deskripsi ReportForge versi CMS.");
    expect(listed?.values.id.default).toBe(MESSAGES.id.upcoming.items[0].description);

    await admin.content.admin.reset({ key: "upcoming.items.0.description", locale: "id" });
    expect((await visitor.content.public.all()).id?.["upcoming.items.0.description"]).toBeUndefined();
  });

  it("stores shared company fields once for both languages", async () => {
    const entry = (await admin.content.admin.list()).find((item) => item.key === "company.name");
    expect(entry).toMatchObject({ shared: true, section: "company" });
    expect(entry?.values.id.default).toBe("NUSAKARYA");
  });
});

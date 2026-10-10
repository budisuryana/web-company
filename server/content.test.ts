/** Bilingual CMS content: override → code fallback resolution, validation, storage, audit trail and SEO/browser parity. */
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { activityLogs, pageContent } from "../drizzle/schema";
import { MESSAGES } from "@shared/i18n/messages";
import {
  EDITABLE_FIELDS,
  defaultValue,
  publicOverrides,
  resolveCompany,
  resolveMessages,
  validateContent,
} from "@shared/i18n/editable";
import { SITE } from "@shared/site";
import { clearContentCache, listContentEntries, loadContentOverrides, resetContent, setContent } from "./content";
import { getDb } from "./db";
import { injectMeta } from "./seo";
import { resolvePageMeta } from "./seoRoutes";

const actor = { openId: "content-test-admin", name: "Content test" };
// Keys no other test asserts on, so parallel test files are unaffected.
const TOUCHED = ["about.ctaTitle", "meta.contactTitle", "contact.sentTitle"];

describe("resolution (override → code fallback)", () => {
  it("returns the code dictionary unchanged when nothing is overridden", () => {
    expect(resolveMessages("en", {})).toBe(MESSAGES.en);
    expect(resolveMessages("id", undefined)).toBe(MESSAGES.id);
  });

  it("applies an override only to its own language", () => {
    const resolved = resolveMessages("en", { en: { "home.title": "New English headline." } });
    expect(resolved.home.title).toBe("New English headline.");
    expect(resolveMessages("id", { en: { "home.title": "New English headline." } }).home.title).toBe(MESSAGES.id.home.title);
  });

  it("falls back when the override is blank or the key is not editable", () => {
    expect(resolveMessages("en", { en: { "home.title": "   " } }).home.title).toBe(MESSAGES.en.home.title);
    const resolved = resolveMessages("en", { en: { "home.aiNote": "Edited disclaimer", "legal.draftBanner": "x" } });
    expect(resolved.home.aiNote).toBe(MESSAGES.en.home.aiNote);
    expect(resolved.legal.draftBanner).toBe(MESSAGES.en.legal.draftBanner);
  });

  it("edits list items in place without changing the list length", () => {
    const resolved = resolveMessages("id", { id: { "home.method.1.title": "Judul baru", "upcoming.items.3.name": "Akuntansi Plus" } });
    expect(resolved.home.method[1].title).toBe("Judul baru");
    expect(resolved.home.method).toHaveLength(MESSAGES.id.home.method.length);
    expect(resolved.upcoming.items[3].name).toBe("Akuntansi Plus");
    expect(MESSAGES.id.home.method[1].title).not.toBe("Judul baru"); // the dictionary itself is never mutated
  });

  it("keeps message formatters working after overrides", () => {
    const resolved = resolveMessages("en", { en: { "home.title": "x" } });
    expect(resolved.common.tryProduct("Reconly")).toBe("Try Reconly");
  });

  it("shares company name and email across languages and carries the email into fixed copy", () => {
    const overrides = { en: { "company.email": "hello@nusakarya.tech", "company.name": "NUSAKARYA Labs" } };
    expect(resolveCompany("id", overrides)).toMatchObject({ name: "NUSAKARYA Labs", email: "hello@nusakarya.tech" });
    const id = resolveMessages("id", overrides);
    expect(JSON.stringify(id)).not.toContain(SITE.email);
    expect(id.about.facts.find((fact) => fact.label === "Email")?.value).toBe("hello@nusakarya.tech");
    expect(id.legal.privacy.sections.flatMap((section) => section.body).join(" ")).toContain("hello@nusakarya.tech");
  });

  it("filters stored rows down to editable, non-blank keys for the public site", () => {
    expect(publicOverrides({ en: { "home.title": "A", "legal.draftBanner": "B", "home.lead": " " } })).toEqual({ en: { "home.title": "A" } });
  });

  it("has a default for every editable key in both languages", () => {
    for (const item of EDITABLE_FIELDS) {
      for (const locale of ["en", "id"] as const) expect(defaultValue(item.key, locale), `${item.key} (${locale})`).not.toBe("");
    }
  });
});

describe("validation", () => {
  it("rejects unknown keys, blank values, over-long text and invalid email", () => {
    expect(validateContent("legal.draftBanner", "x")).toMatch(/tidak dapat diedit/);
    expect(validateContent("home.title", "   ")).toMatch(/tidak boleh kosong/);
    expect(validateContent("home.title", "x".repeat(500))).toMatch(/Maksimal/);
    expect(validateContent("company.email", "not-an-email")).toMatch(/email tidak valid/);
    expect(validateContent("home.title", "A fine headline.")).toBeNull();
  });
});

describe("storage, audit trail and SEO parity", () => {
  beforeEach(() => clearContentCache());
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    await db.delete(pageContent).where(inArray(pageContent.key, TOUCHED));
    await db.delete(activityLogs).where(eq(activityLogs.actorOpenId, actor.openId));
    clearContentCache();
  });

  it("saves EN and ID separately and serves them to the public reader", async () => {
    await setContent(actor, "about.ctaTitle", "en", "Talk to us about your workflow.");
    await setContent(actor, "about.ctaTitle", "id", "Ceritakan alur kerja Anda.");
    const overrides = await loadContentOverrides();
    expect(overrides.en?.["about.ctaTitle"]).toBe("Talk to us about your workflow.");
    expect(overrides.id?.["about.ctaTitle"]).toBe("Ceritakan alur kerja Anda.");
    expect(resolveMessages("id", overrides).about.ctaTitle).toBe("Ceritakan alur kerja Anda.");
  });

  it("lists every editable field with its default and override for the editor", async () => {
    await setContent(actor, "contact.sentTitle", "id", "Pesan diterima.");
    const entries = await listContentEntries();
    expect(entries).toHaveLength(EDITABLE_FIELDS.length);
    const entry = entries.find((item) => item.key === "contact.sentTitle");
    expect(entry?.values.id).toEqual({ default: MESSAGES.id.contact.sentTitle, override: "Pesan diterima." });
    expect(entry?.values.en.override).toBeNull();
  });

  it("records the previous value in the activity log", async () => {
    await setContent(actor, "contact.sentTitle", "id", "Pesan sudah diterima.");
    const db = await getDb();
    const [log] = await db!
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.actorOpenId, actor.openId), eq(activityLogs.resourceId, "id:contact.sentTitle")))
      .orderBy(activityLogs.createdAt);
    expect(log.eventType).toBe("page_content.updated");
    const logs = await db!.select().from(activityLogs).where(eq(activityLogs.resourceId, "id:contact.sentTitle"));
    const latest = logs.find((entry) => (entry.detail as { value?: string })?.value === "Pesan sudah diterima.");
    expect(latest?.detail).toMatchObject({ previous: "Pesan diterima.", previousWasDefault: false });
  });

  it("rejects invalid values without writing", async () => {
    await expect(setContent(actor, "meta.contactTitle", "en", "")).rejects.toThrow(/tidak boleh kosong/);
    await expect(setContent(actor, "legal.draftBanner", "en", "x")).rejects.toThrow();
    expect((await loadContentOverrides()).en?.["meta.contactTitle"]).toBeUndefined();
  });

  it("gives server metadata and the embedded browser copy the same resolved text", async () => {
    await setContent(actor, "meta.contactTitle", "en", "Get in touch");
    const meta = await resolvePageMeta("/contact");
    expect(meta.title).toBe("Get in touch — NUSAKARYA");
    expect(meta.content?.en?.["meta.contactTitle"]).toBe("Get in touch");
    // The browser resolves the embedded overrides with the same function.
    expect(resolveMessages("en", meta.content).meta.contactTitle).toBe("Get in touch");
    const html = injectMeta('<html lang="en"><head><title>x</title></head><body><div id="root"></div></body></html>', meta);
    expect(html).toContain('<script type="application/json" id="nk-content">');
    expect((await resolvePageMeta("/id/contact")).title).toBe(`${MESSAGES.id.meta.contactTitle} — NUSAKARYA`);
  });

  it("resets to the code default", async () => {
    await setContent(actor, "meta.contactTitle", "en", "Get in touch");
    const result = await resetContent(actor, "meta.contactTitle", "en");
    expect(result.changed).toBe(true);
    expect((await resolvePageMeta("/contact")).title).toBe(`${MESSAGES.en.meta.contactTitle} — NUSAKARYA`);
  });

  it("never lets CMS text close the embedded script tag", () => {
    const html = injectMeta("<html><head><title>x</title></head><body></body></html>", {
      title: "t", description: "d", canonical: "https://nusakarya.tech", ogType: "website", locale: "en_US", siteName: "NUSAKARYA", jsonLd: [],
      content: { en: { "home.title": "</script><script>alert(1)</script>" } },
    });
    expect(html).not.toContain("</script><script>alert(1)");
    expect(html).toContain("\\u003c/script>");
  });
});

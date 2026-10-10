/** Product bilingual management: CMS translation → code presentation → columns, CTA configuration, storage, audit and SEO. */
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { activityLogs } from "../drizzle/schema";
import { PRODUCT_PRESENTATION, localizeProduct, looksLikeDevelopmentUrl, meaningfulCopy, productCtaMode } from "@shared/i18n/products";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { resolvePageMeta } from "./seoRoutes";
import type { TrpcContext } from "./_core/context";

const record = {
  slug: "reconly",
  name: "Reconly",
  category: "Finance",
  shortDescription: "Rekonsiliasi dua sumber data.",
  fullDescription: "Deskripsi kolom.",
  heroHeadline: "Headline kolom.",
  problem: "p",
  solution: "s",
  outcome: "o",
  targetUsers: "t",
  capabilities: ["kolom"],
  workflowSteps: [{ title: "Kolom", copy: "Langkah kolom." }],
};

describe("product copy resolution", () => {
  it("prefers the CMS translation, then the code presentation, then the columns", () => {
    const withCms = { ...record, translations: { en: { heroHeadline: "CMS English headline." } } };
    const en = localizeProduct(withCms, "en");
    expect(en.heroHeadline).toBe("CMS English headline.");
    expect(en.fullDescription).toBe(PRODUCT_PRESENTATION.reconly.en?.fullDescription); // code layer
    const id = localizeProduct(withCms, "id");
    expect(id.heroHeadline).toBe("Headline kolom."); // columns
    expect(id.category).toBe(PRODUCT_PRESENTATION.reconly.id?.category); // code Indonesian rewording
  });

  it("lets an Indonesian CMS value replace the code rewording", () => {
    expect(localizeProduct({ ...record, translations: { id: { category: "Keuangan & Akuntansi" } } }, "id").category).toBe("Keuangan & Akuntansi");
  });

  it("falls back when a translation is blank, empty or incomplete", () => {
    const blank = { ...record, translations: { en: { heroHeadline: "  ", capabilities: [], workflowSteps: [{ title: "Only title", copy: "" }] } } };
    const en = localizeProduct(blank, "en");
    expect(en.heroHeadline).toBe(PRODUCT_PRESENTATION.reconly.en?.heroHeadline);
    expect(en.capabilities).toEqual(PRODUCT_PRESENTATION.reconly.en?.capabilities);
    expect(en.workflowSteps).toEqual(PRODUCT_PRESENTATION.reconly.en?.workflowSteps);
    expect(meaningfulCopy(blank.translations.en)).toEqual({});
  });

  it("uses the columns for a product with no translation anywhere", () => {
    const other = { ...record, slug: "unknown-product", translations: null };
    expect(localizeProduct(other, "en")).toBe(other);
  });

  it("flags development demo URLs so Try never exposes them unnoticed", () => {
    expect(looksLikeDevelopmentUrl("https://dev-karyapeople.nusakarya.tech")).toBe(true);
    expect(looksLikeDevelopmentUrl("http://localhost:3000")).toBe(true);
    expect(looksLikeDevelopmentUrl("https://reconly.nusakarya.tech")).toBe(false);
    expect(looksLikeDevelopmentUrl("")).toBe(false);
  });

  it("follows the configured CTA, else the code default", () => {
    expect(productCtaMode({ slug: "karya-people", primaryCta: "try" })).toBe("app");
    expect(productCtaMode({ slug: "reconly", primaryCta: "demo" })).toBe("demo");
    expect(productCtaMode({ slug: "karya-people", primaryCta: null })).toBe("demo");
    expect(productCtaMode({ slug: "reconly" })).toBe("app");
  });
});

const adminCtx: TrpcContext = {
  user: { id: 983, openId: "product-translation-admin", email: "pt@example.com", name: "Product translation admin", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};
const admin = appRouter.createCaller(adminCtx);
const visitor = appRouter.createCaller({ ...adminCtx, user: null });
const slug = `translation-check-${Date.now().toString(36)}`;
let productId: string | null = null;

const input = {
  name: "Translation check", slug, shortDescription: "Produk uji sementara.", fullDescription: "Deskripsi lengkap produk uji.", heroHeadline: "Headline Indonesia.", problem: "Masalah.", solution: "Solusi.", outcome: "Hasil.",
  category: "Uji", productStatus: "active" as const, publicationStatus: "published" as const, capabilities: ["Kapabilitas uji"], targetUsers: "Pengujian otomatis.", demoUrl: "https://example.com/app",
  workflowSteps: [{ title: "Mulai", copy: "Langkah uji." }], featured: false, displayOrder: 997,
};

afterAll(async () => {
  if (productId) await admin.registry.admin.remove({ id: productId }).catch(() => undefined);
  const db = await getDb();
  if (db) await db.delete(activityLogs).where(eq(activityLogs.actorOpenId, adminCtx.user!.openId));
});

describe("product translations through the CMS API", () => {
  it("stores EN/ID copy and the CTA, and the public site and SEO follow them", async () => {
    const created = await admin.registry.admin.create(input);
    productId = created!.id;
    expect(created?.translations ?? null).toBeNull();
    expect(created?.primaryCta ?? null).toBeNull();

    const updated = await admin.registry.admin.update({
      id: productId,
      product: {
        ...input,
        primaryCta: "demo",
        translations: { en: { heroHeadline: "English headline.", category: "Testing", capabilities: ["Test capability", " "] }, id: { heroHeadline: "  " } },
      },
    });
    // Blank values are not stored.
    expect(updated?.translations).toEqual({ en: { heroHeadline: "English headline.", category: "Testing", capabilities: ["Test capability"] } });
    expect(updated?.primaryCta).toBe("demo");

    const publicRecord = await visitor.registry.public.bySlug({ slug });
    expect(localizeProduct(publicRecord!, "en").heroHeadline).toBe("English headline.");
    expect(localizeProduct(publicRecord!, "id").heroHeadline).toBe("Headline Indonesia.");
    expect(productCtaMode(publicRecord!)).toBe("demo");

    const enMeta = await resolvePageMeta(`/products/${slug}`);
    expect(enMeta.heading).toBe("English headline.");
    expect((await resolvePageMeta(`/id/products/${slug}`)).heading).toBe("Headline Indonesia.");
  });

  it("keeps the previous copy and CTA in the activity log", async () => {
    const db = await getDb();
    const logs = await db!.select().from(activityLogs).where(eq(activityLogs.actorOpenId, adminCtx.user!.openId));
    const updateLog = logs.find((log) => log.eventType === "product.updated");
    expect(updateLog?.detail).toMatchObject({ previousTranslations: null, previousPrimaryCta: null, primaryCta: "demo" });
  });

  it("leaves translations and CTA untouched when an update does not send them", async () => {
    const { translations: _t, primaryCta: _c, ...withoutCopy } = { ...input, translations: undefined, primaryCta: undefined };
    const updated = await admin.registry.admin.update({ id: productId!, product: { ...withoutCopy, outcome: "Hasil baru." } });
    expect(updated?.primaryCta).toBe("demo");
    expect(updated?.translations?.en?.heroHeadline).toBe("English headline.");
  });

  it("rejects over-long translations", async () => {
    await expect(
      admin.registry.admin.update({ id: productId!, product: { ...input, translations: { en: { name: "x".repeat(200) } } } }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

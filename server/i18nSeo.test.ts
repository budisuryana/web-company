/** Bilingual routing and SEO contracts: locale paths, hreflang, html lang, real 404s, sitemap alternates, copy parity. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MESSAGES } from "@shared/i18n/messages";
import { PRODUCT_PRESENTATION, localizeProduct, productCtaMode } from "@shared/i18n/products";
import { localizePath, splitLocale } from "@shared/site";
import { injectMeta, sitemapXml } from "./seo";
import { resolvePageMeta } from "./seoRoutes";

const ORIGIN = "https://nusakarya.tech";
let previousSiteUrl: string | undefined;

beforeEach(() => {
  previousSiteUrl = process.env.SITE_URL;
  process.env.SITE_URL = ORIGIN;
});
afterEach(() => {
  if (previousSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = previousSiteUrl;
});

describe("locale paths", () => {
  it("treats unprefixed paths as Indonesian and /en as English", () => {
    expect(splitLocale("/")).toEqual({ locale: "id", path: "/" });
    expect(splitLocale("/about")).toEqual({ locale: "id", path: "/about" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/en/products/reconly?x=1")).toEqual({ locale: "en", path: "/products/reconly" });
  });

  it("does not mistake look-alike prefixes for the English tree", () => {
    expect(splitLocale("/english")).toEqual({ locale: "id", path: "/english" });
  });

  it("builds localized paths", () => {
    expect(localizePath("/", "id")).toBe("/");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/contact", "en")).toBe("/en/contact");
  });
});

describe("page metadata", () => {
  it("serves English copy, lang and canonical under /en", async () => {
    const meta = await resolvePageMeta("/en/about");
    expect(meta.htmlLang).toBe("en");
    expect(meta.locale).toBe("en_US");
    expect(meta.canonical).toBe(`${ORIGIN}/en/about`);
    expect(meta.title).toContain(MESSAGES.en.meta.aboutTitle);
    expect(meta.notFound).toBeFalsy();
  });

  it("advertises every language version plus x-default", async () => {
    const meta = await resolvePageMeta("/contact");
    expect(meta.alternates).toEqual([
      { hreflang: "id", href: `${ORIGIN}/contact` },
      { hreflang: "en", href: `${ORIGIN}/en/contact` },
      { hreflang: "x-default", href: `${ORIGIN}/contact` },
    ]);
  });

  it("gives the homepage a real title, description and hreflang", async () => {
    const meta = await resolvePageMeta("/");
    expect(meta.title).toBe(MESSAGES.id.meta.homeTitle);
    expect(meta.canonical).toBe(ORIGIN);
    expect(meta.alternates?.find((a) => a.hreflang === "en")?.href).toBe(`${ORIGIN}/en`);
  });

  it("flags unknown routes in both languages as 404", async () => {
    expect((await resolvePageMeta("/does-not-exist")).notFound).toBe(true);
    expect((await resolvePageMeta("/en/does-not-exist")).notFound).toBe(true);
  });

  it("keeps draft legal pages out of the index", async () => {
    const meta = await resolvePageMeta("/en/privacy");
    expect(meta.notFound).toBeFalsy();
    expect(meta.noindex).toBe(true);
  });
});

describe("html rendering", () => {
  it("rewrites <html lang> and emits alternate links", () => {
    const html = injectMeta('<html lang="id"><head><title>x</title></head><body><div id="root"></div></body></html>', {
      title: "T",
      description: "D",
      canonical: `${ORIGIN}/en`,
      ogType: "website",
      locale: "en_US",
      htmlLang: "en",
      siteName: "Ruang Karya",
      jsonLd: [],
      alternates: [{ hreflang: "id", href: ORIGIN }],
    });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(`<link rel="alternate" hreflang="id" href="${ORIGIN}" />`);
  });

  it("declares the xhtml namespace when sitemap entries carry alternates", () => {
    const xml = sitemapXml(ORIGIN, [{ path: "/en", alternates: [{ hreflang: "id", path: "/" }] }]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(`<loc>${ORIGIN}/en</loc>`);
    expect(xml).toContain(`hreflang="id" href="${ORIGIN}"`);
  });
});

describe("copy", () => {
  /** Shape of a value: object keys, array lengths and leaf types must match across locales. */
  function shape(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(shape);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]));
    }
    return typeof value;
  }

  it("has the same structure in Indonesian and English", () => {
    expect(shape(MESSAGES.en)).toEqual(shape(MESSAGES.id));
  });

  it("never names a company email other than the official one", () => {
    const text = JSON.stringify(MESSAGES);
    const placeholders = new Set([MESSAGES.id.contact.emailPlaceholder, MESSAGES.en.contact.emailPlaceholder]);
    const emails = new Set((text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).filter((email) => !placeholders.has(email)));
    expect([...emails]).toEqual(["info@nusakarya.tech"]);
  });

  it("does not claim a Claude API integration inside the products", () => {
    for (const locale of ["id", "en"] as const) {
      expect(JSON.stringify(MESSAGES[locale].home)).not.toMatch(/terintegrasi dengan Claude API|integrated with the Claude API/i);
    }
  });

  it("drops the unverified response-time and remote-work claims", () => {
    const text = JSON.stringify(MESSAGES);
    expect(text).not.toMatch(/hari kerja|business days|zona waktu|time zones/i);
  });
});

describe("products in development", () => {
  it("lists the four owner-confirmed products, named in the page language", () => {
    expect(MESSAGES.id.upcoming.items.map((item) => item.name)).toEqual(["ReportForge", "Work Management & Ticketing", "Remunerasi", "Akuntansi"]);
    expect(MESSAGES.en.upcoming.items.map((item) => item.name)).toEqual(["ReportForge", "Work Management & Ticketing", "Remuneration", "Accounting"]);
    expect(MESSAGES.id.upcoming.status).toBe("Sedang Dikembangkan");
    expect(MESSAGES.en.upcoming.status).toBe("In Development");
  });

  it("never claims availability for them", () => {
    const text = JSON.stringify([MESSAGES.id.upcoming, MESSAGES.en.upcoming]);
    expect(text).not.toMatch(/https?:|tersedia sekarang|now available|pelanggan|customers/i);
  });

  it("gives them no page: unknown in the router and absent from the sitemap", async () => {
    expect((await resolvePageMeta("/products/reportforge")).notFound).toBe(true);
    const xml = sitemapXml(ORIGIN, []);
    expect(xml).not.toMatch(/reportforge|ticketing|remuner|accounting/i);
  });
});

describe("product presentation", () => {
  const record = {
    slug: "reconly",
    category: "Finance",
    shortDescription: "id",
    fullDescription: "id",
    heroHeadline: "id",
    problem: "id",
    solution: "id",
    outcome: "id",
    targetUsers: "id",
    capabilities: ["id"],
    workflowSteps: [{ title: "id", copy: "id" }],
  };

  it("keeps the CMS text in Indonesian apart from plain-language rewording, and swaps in English copy", () => {
    const id = localizeProduct(record, "id");
    expect(id.heroHeadline).toBe(record.heroHeadline);
    expect(id.capabilities).toEqual(PRODUCT_PRESENTATION.reconly.id?.capabilities);
    expect(localizeProduct(record, "en").heroHeadline).toBe(PRODUCT_PRESENTATION.reconly.en?.heroHeadline);
  });

  it("keeps Indonesian and English capability lists the same length", () => {
    for (const presentation of Object.values(PRODUCT_PRESENTATION)) {
      if (presentation.id?.capabilities && presentation.en) {
        expect(presentation.id.capabilities.length).toBe(presentation.en.capabilities.length);
      }
    }
  });

  it("falls back to the CMS record for products without a translation", () => {
    const other = { ...record, slug: "unknown-product" };
    expect(localizeProduct(other, "en")).toBe(other);
  });

  it("routes KaryaPeople to a demo request until a production URL is confirmed", () => {
    expect(productCtaMode("karya-people")).toBe("demo");
    expect(productCtaMode("reconly")).toBe("app");
  });
});

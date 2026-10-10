/** Bilingual routing and SEO contracts: locale paths, hreflang, html lang, real 404s, sitemap alternates, copy parity. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MESSAGES } from "@shared/i18n/messages";
import { PRODUCT_PRESENTATION, localizeProduct, productCtaMode } from "@shared/i18n/products";
import { DEFAULT_LOCALE, SITE, legacyEnglishTarget, localizePath, splitLocale } from "@shared/site";
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
  it("defaults to English: unprefixed paths are English and /id is Indonesian", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(splitLocale("/")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/about")).toEqual({ locale: "en", path: "/about" });
    expect(splitLocale("/id")).toEqual({ locale: "id", path: "/" });
    expect(splitLocale("/id/products/reconly?x=1")).toEqual({ locale: "id", path: "/products/reconly" });
  });

  it("does not mistake look-alike prefixes for the Indonesian tree", () => {
    expect(splitLocale("/identity")).toEqual({ locale: "en", path: "/identity" });
  });

  it("builds localized paths", () => {
    expect(localizePath("/", "en")).toBe("/");
    expect(localizePath("/", "id")).toBe("/id");
    expect(localizePath("/contact", "id")).toBe("/id/contact");
    expect(localizePath("/contact", "en")).toBe("/contact");
  });

  it("maps legacy /en URLs to their unprefixed English page", () => {
    expect(legacyEnglishTarget("/en")).toBe("/");
    expect(legacyEnglishTarget("/en/products/reconly")).toBe("/products/reconly");
    expect(legacyEnglishTarget("/english")).toBeNull();
    expect(legacyEnglishTarget("/products")).toBeNull();
  });
});

describe("page metadata", () => {
  it("serves English copy, lang and canonical at the unprefixed path", async () => {
    const meta = await resolvePageMeta("/about");
    expect(meta.htmlLang).toBe("en");
    expect(meta.locale).toBe("en_US");
    expect(meta.canonical).toBe(`${ORIGIN}/about`);
    expect(meta.title).toContain(MESSAGES.en.meta.aboutTitle);
    expect(meta.notFound).toBeFalsy();
  });

  it("serves Indonesian copy, lang and canonical under /id", async () => {
    const meta = await resolvePageMeta("/id/about");
    expect(meta.htmlLang).toBe("id");
    expect(meta.locale).toBe("id_ID");
    expect(meta.canonical).toBe(`${ORIGIN}/id/about`);
    expect(meta.title).toContain(MESSAGES.id.meta.aboutTitle);
  });

  it("advertises every language version plus x-default", async () => {
    const meta = await resolvePageMeta("/contact");
    expect(meta.alternates).toEqual([
      { hreflang: "id", href: `${ORIGIN}/id/contact` },
      { hreflang: "en", href: `${ORIGIN}/contact` },
      { hreflang: "x-default", href: `${ORIGIN}/contact` },
    ]);
  });

  it("gives the homepage English copy, with Indonesian at /id and x-default on /", async () => {
    const meta = await resolvePageMeta("/");
    expect(meta.title).toBe(MESSAGES.en.meta.homeTitle);
    expect(meta.htmlLang).toBe("en");
    expect(meta.canonical).toBe(ORIGIN);
    expect(meta.alternates?.find((a) => a.hreflang === "id")?.href).toBe(`${ORIGIN}/id`);
    expect(meta.alternates?.find((a) => a.hreflang === "x-default")?.href).toBe(ORIGIN);
  });

  it("flags unknown routes in both languages as 404", async () => {
    expect((await resolvePageMeta("/does-not-exist")).notFound).toBe(true);
    expect((await resolvePageMeta("/id/does-not-exist")).notFound).toBe(true);
  });

  it("keeps draft legal pages out of the index", async () => {
    const meta = await resolvePageMeta("/id/privacy");
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
      siteName: "NUSAKARYA",
      jsonLd: [],
      alternates: [{ hreflang: "id", href: ORIGIN }],
    });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain(`<link rel="alternate" hreflang="id" href="${ORIGIN}" />`);
  });

  it("declares the xhtml namespace when sitemap entries carry alternates", () => {
    const xml = sitemapXml(ORIGIN, [{ path: "/id", alternates: [{ hreflang: "en", path: "/" }] }]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(`<loc>${ORIGIN}/id</loc>`);
    expect(xml).toContain(`hreflang="en" href="${ORIGIN}"`);
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

describe("brand", () => {
  it("is NUSAKARYA everywhere the public site names the company", async () => {
    expect(SITE.name).toBe("NUSAKARYA");
    expect(JSON.stringify(MESSAGES)).not.toMatch(/Ruang Karya/);
    // The CMS may still hold the previous company name; the page must not show it.
    const meta = await resolvePageMeta("/about");
    expect(meta.siteName).toBe("NUSAKARYA");
    expect(meta.title).toContain("NUSAKARYA");
    const org = meta.jsonLd.find((entry) => entry["@type"] === "Organization");
    expect(org?.name).toBe("NUSAKARYA");
    expect(String(org?.logo)).toMatch(/nusakarya-icon-512\.png$/);
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

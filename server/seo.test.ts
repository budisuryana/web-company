import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  escapeHtml,
  injectMeta,
  metaDescription,
  robotsTxt,
  sitemapXml,
  titleDescriptor,
  truncateAtWord,
  type PageMeta,
} from "./seo";

const TEMPLATE = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="fallback" />
    <title>Fallback Title</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const meta = (overrides: Partial<PageMeta> = {}): PageMeta => ({
  title: "Reconly — Aplikasi rekonsiliasi data Excel dan bank | Ruang Karya",
  description: "Aplikasi rekonsiliasi data Excel dan bank yang selesai dalam hitungan menit.",
  canonical: "https://ruang-karya.co.id/products/reconly",
  ogType: "article",
  locale: "id_ID",
  siteName: "Ruang Karya",
  jsonLd: [],
  ...overrides,
});

describe("truncation", () => {
  it("leaves text shorter than the limit alone", () => {
    expect(truncateAtWord("Rekonsiliasi cepat", 45)).toBe("Rekonsiliasi cepat");
  });

  it("cuts on a word boundary, never mid-word", () => {
    const result = truncateAtWord("Aplikasi rekonsiliasi data Excel dan bank yang selesai", 45);
    expect(result).toBe("Aplikasi rekonsiliasi data Excel dan bank");
    expect(result.length).toBeLessThanOrEqual(45);
  });

  it("drops punctuation left dangling at the cut", () => {
    expect(truncateAtWord("Rekonsiliasi cepat, akurat, dan bisa ditelusuri kembali", 20)).toBe("Rekonsiliasi cepat");
  });

  it("still cuts a single word longer than the limit", () => {
    expect(truncateAtWord("a".repeat(60), 10)).toHaveLength(10);
  });

  it("collapses whitespace so a title never carries a line break", () => {
    expect(truncateAtWord("Rekonsiliasi\n  data   Excel", 45)).toBe("Rekonsiliasi data Excel");
  });
});

describe("title descriptor", () => {
  it("keeps only the opening clause, which is the part that carries the keyword", () => {
    expect(
      titleDescriptor("Aplikasi rekonsiliasi data Excel dan bank yang selesai dalam hitungan menit, bukan berhari-hari.")
    ).toBe("Aplikasi rekonsiliasi data Excel dan bank");
  });

  it("produces a full title that survives Google's ~60 character cut", () => {
    const descriptor = titleDescriptor("Aplikasi rekonsiliasi data Excel dan bank yang selesai dalam hitungan menit.");
    const title = `Reconly — ${descriptor} | Ruang Karya`;
    // The brand suffix may be truncated; the product and the keyword must not be.
    expect(title.indexOf("rekonsiliasi")).toBeLessThan(60);
  });

  it("handles a description with no comma at all", () => {
    expect(titleDescriptor("Rekonsiliasi data antar sistem")).toBe("Rekonsiliasi data antar sistem");
  });
});

describe("meta description", () => {
  it("stays within the snippet limit", () => {
    expect(metaDescription("kata ".repeat(80)).length).toBeLessThanOrEqual(160);
  });
});

describe("escaping", () => {
  it("neutralises every character that could break an attribute", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });

  it("does not let CMS copy escape a meta attribute", () => {
    const html = injectMeta(TEMPLATE, meta({ description: `Rekonsiliasi " onload="alert(1)` }));
    expect(html).not.toContain(`content="Rekonsiliasi " onload=`);
    expect(html).toContain("&quot; onload=");
  });

  it("does not let a product name close the JSON-LD script early", () => {
    const html = injectMeta(
      TEMPLATE,
      meta({
        jsonLd: [{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "</script><script>x" }],
      })
    );
    const between = html.slice(html.indexOf("application/ld+json"));
    expect(between).not.toContain("</script><script>x");
    expect(between).toContain("<\\/script>");
  });
});

describe("injection", () => {
  it("replaces the title instead of adding a second one", () => {
    const html = injectMeta(TEMPLATE, meta());
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>Reconly — Aplikasi rekonsiliasi data Excel dan bank | Ruang Karya</title>");
    expect(html).not.toContain("Fallback Title");
  });

  it("replaces the description instead of adding a second one", () => {
    const html = injectMeta(TEMPLATE, meta());
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).not.toContain('content="fallback"');
  });

  it("emits the Open Graph tags a social scraper reads", () => {
    const html = injectMeta(TEMPLATE, meta());
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url" content="https://ruang-karya.co.id/products/reconly"');
    expect(html).toContain('property="og:locale" content="id_ID"');
    expect(html).toContain('rel="canonical" href="https://ruang-karya.co.id/products/reconly"');
  });

  it("omits og:image rather than pointing at an image that does not exist", () => {
    const html = injectMeta(TEMPLATE, meta());
    expect(html).not.toContain("og:image");
    expect(html).toContain('name="twitter:card" content="summary"');
  });

  it("upgrades the card to a large image once a cover exists", () => {
    const html = injectMeta(TEMPLATE, meta({ ogImage: "https://ruang-karya.co.id/manus-storage/cover.png" }));
    expect(html).toContain('property="og:image" content="https://ruang-karya.co.id/manus-storage/cover.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("seeds #root so a crawler that never runs JavaScript still reads the page", () => {
    const html = injectMeta(
      TEMPLATE,
      meta({ heading: "Temukan persis di mana dua catatan tidak cocok.", body: ["Paragraf pertama.", "Paragraf kedua."] })
    );
    expect(html).toContain("<h1>Temukan persis di mana dua catatan tidak cocok.</h1>");
    expect(html).toContain("<p>Paragraf pertama.</p>");
    expect(html).toContain("<p>Paragraf kedua.</p>");
  });

  it("leaves #root empty when there is nothing real to seed", () => {
    expect(injectMeta(TEMPLATE, meta())).toContain('<div id="root"></div>');
  });

  it("marks CMS routes noindex", () => {
    expect(injectMeta(TEMPLATE, meta({ noindex: true }))).toContain('name="robots" content="noindex, nofollow"');
  });

  it("leaves a public route without a robots meta tag", () => {
    expect(injectMeta(TEMPLATE, meta())).not.toContain('name="robots"');
  });
});

describe("absolute urls", () => {
  it("resolves a stored relative path against the site origin", () => {
    expect(absoluteUrl("https://ruang-karya.co.id", "/manus-storage/a.png")).toBe(
      "https://ruang-karya.co.id/manus-storage/a.png"
    );
  });

  it("leaves an already absolute url alone", () => {
    expect(absoluteUrl("https://ruang-karya.co.id", "https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("returns undefined for empty values so the tag is omitted", () => {
    expect(absoluteUrl("https://ruang-karya.co.id", "")).toBeUndefined();
    expect(absoluteUrl("https://ruang-karya.co.id", null)).toBeUndefined();
    expect(absoluteUrl("https://ruang-karya.co.id", "   ")).toBeUndefined();
  });
});

describe("robots.txt", () => {
  it("keeps the CMS out and points at the sitemap", () => {
    const txt = robotsTxt("https://ruang-karya.co.id/", "/studio");
    expect(txt).toContain("Disallow: /studio");
    expect(txt).toContain("Sitemap: https://ruang-karya.co.id/sitemap.xml");
  });

  it("follows a renamed CMS prefix", () => {
    expect(robotsTxt("https://ruang-karya.co.id", "portal/")).toContain("Disallow: /portal");
  });
});

describe("sitemap.xml", () => {
  it("lists each route as an absolute url", () => {
    const xml = sitemapXml("https://ruang-karya.co.id", [{ path: "/" }, { path: "/products/reconly" }]);
    expect(xml).toContain("<loc>https://ruang-karya.co.id</loc>");
    expect(xml).toContain("<loc>https://ruang-karya.co.id/products/reconly</loc>");
  });

  it("records lastmod as a plain date when one is known", () => {
    const xml = sitemapXml("https://ruang-karya.co.id", [
      { path: "/products/reconly", lastModified: new Date("2026-08-30T11:22:33Z") },
    ]);
    expect(xml).toContain("<lastmod>2026-08-30</lastmod>");
  });

  it("omits lastmod rather than inventing one", () => {
    const xml = sitemapXml("https://ruang-karya.co.id", [{ path: "/about", lastModified: null }]);
    expect(xml).not.toContain("<lastmod>");
  });

  it("ignores an unparseable timestamp instead of emitting Invalid Date", () => {
    const xml = sitemapXml("https://ruang-karya.co.id", [{ path: "/about", lastModified: "not a date" }]);
    expect(xml).not.toContain("Invalid");
    expect(xml).not.toContain("<lastmod>");
  });

  it("produces a well-formed document", () => {
    const xml = sitemapXml("https://ruang-karya.co.id", [{ path: "/" }]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
  });
});

describe("dangling words", () => {
  it("never ends a title on an Indonesian function word", () => {
    expect(truncateAtWord("Perangkat lunak terpadu untuk alur kerja yang terus bergerak.", 45)).toBe(
      "Perangkat lunak terpadu untuk alur kerja"
    );
  });

  it("drops a run of them rather than only the last", () => {
    expect(truncateAtWord("Rekonsiliasi cepat dan untuk semua tim", 26)).toBe("Rekonsiliasi cepat");
  });

  it("keeps a real word that merely looks short", () => {
    expect(truncateAtWord("Rekonsiliasi data bank", 45)).toBe("Rekonsiliasi data bank");
  });

  it("produces a readable homepage title from the tagline", () => {
    const title = `Ruang Karya — ${titleDescriptor("Perangkat lunak terpadu untuk alur kerja yang terus bergerak.")}`;
    expect(title).toBe("Ruang Karya — Perangkat lunak terpadu untuk alur kerja");
    expect(title).not.toMatch(/\b(yang|dan|untuk|dengan)$/);
  });
});

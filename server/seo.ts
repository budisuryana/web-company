/**
 * Server-side meta injection for a client-rendered site.
 *
 * This app is a Vite SPA: the HTML it serves is an empty `<div id="root">` and
 * everything visible is assembled by JavaScript in the browser. Search crawlers
 * eventually run that JavaScript; social scrapers — WhatsApp, LinkedIn,
 * Facebook, X — never do. Without this module every shared link previews as a
 * blank card and every route reports the same `<title>`.
 *
 * So the Express handler that serves index.html rewrites the head from the same
 * CMS data the page is about to render, and seeds `#root` with that page's
 * heading and copy. The client mounts with `createRoot`, not `hydrateRoot`, so
 * React discards the seeded children on first render: it is inert for real
 * visitors and is the only content a scraper ever sees.
 *
 * Everything here is pure — no database, no Express — so the string handling is
 * testable on its own. The data lookups live in `server/seoRoutes.ts`.
 */

export interface JsonLd {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute URL. Also used as og:url. */
  canonical: string;
  ogType: "website" | "article";
  /** Absolute URL, or undefined when no real image exists — never a placeholder. */
  ogImage?: string;
  locale: string;
  siteName: string;
  jsonLd: JsonLd[];
  /** Seeded into #root so a non-JS crawler reads real text. */
  heading?: string;
  body?: string[];
  /** CMS and admin routes must never be indexed. */
  noindex?: boolean;
}

export interface SitemapEntry {
  path: string;
  lastModified?: Date | string | null;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * CMS copy is written by admins, not the public, but it still lands inside HTML
 * attributes — a stray quote would silently break every meta tag on the page.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Trims to `max` on a word boundary, dropping punctuation left dangling at the cut. */
export function truncateAtWord(value: string, max: number): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length <= max) return stripTrailingPunctuation(text);

  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return stripTrailingPunctuation(lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max));
}

/**
 * Indonesian function words that cannot end a sentence. A cut landing on one
 * leaves a title reading "…untuk alur kerja yang", so they are dropped along
 * with the punctuation.
 */
const DANGLING_WORDS = new Set([
  "yang", "dan", "atau", "untuk", "dengan", "dari", "pada", "dalam", "ke", "di",
  "sebagai", "agar", "serta", "bagi", "oleh", "akan", "adalah", "ini", "itu", "the", "a",
]);

function stripTrailingPunctuation(value: string): string {
  let text = value.replace(/[\s,;:.—–-]+$/, "");
  // Repeated: "… dan untuk" must lose both words, not just the last.
  for (;;) {
    const match = text.match(/\s([^\s]+)$/);
    if (!match || !DANGLING_WORDS.has(match[1].toLowerCase())) return text;
    text = text.slice(0, match.index).replace(/[\s,;:.—–-]+$/, "");
  }
}

/** Search snippets are cut around 160 characters; anything past that is wasted. */
export function metaDescription(value: string): string {
  return truncateAtWord(value, 160);
}

/**
 * The keyword-bearing middle of a page title.
 *
 * A product's short description opens with what it does and then qualifies it
 * after a comma. Only the opening clause belongs in a title, and only as much
 * of it as survives Google's ~60-character cut once the brand suffix is added.
 */
export function titleDescriptor(shortDescription: string): string {
  const firstClause = shortDescription.split(/[,—–]/)[0] ?? shortDescription;
  return truncateAtWord(firstClause, 45);
}

/** Resolves a stored path or URL against the site origin. Returns null if neither. */
export function absoluteUrl(siteUrl: string, pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${siteUrl.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
}

function tag(property: "property" | "name", key: string, content: string): string {
  return `    <meta ${property}="${key}" content="${escapeHtml(content)}" />`;
}

/**
 * JSON-LD is data, not markup, so it is serialised rather than escaped — but a
 * literal `</script>` inside any string would still end the block early.
 */
function jsonLdBlock(entries: JsonLd[]): string[] {
  return entries.map(
    (entry) =>
      `    <script type="application/ld+json">${JSON.stringify(entry).replace(/<\//g, "<\\/")}</script>`
  );
}

function headTags(meta: PageMeta): string {
  const lines = [
    `    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    tag("property", "og:type", meta.ogType),
    tag("property", "og:site_name", meta.siteName),
    tag("property", "og:title", meta.title),
    tag("property", "og:description", meta.description),
    tag("property", "og:url", meta.canonical),
    tag("property", "og:locale", meta.locale),
    tag("name", "twitter:title", meta.title),
    tag("name", "twitter:description", meta.description),
  ];

  // Only ever emitted when a real image exists: a card with no image beats a
  // card pointing at a 404.
  if (meta.ogImage) {
    lines.push(tag("property", "og:image", meta.ogImage));
    lines.push(tag("name", "twitter:card", "summary_large_image"));
    lines.push(tag("name", "twitter:image", meta.ogImage));
  } else {
    lines.push(tag("name", "twitter:card", "summary"));
  }

  if (meta.noindex) lines.push(tag("name", "robots", "noindex, nofollow"));

  return [...lines, ...jsonLdBlock(meta.jsonLd)].join("\n");
}

/** The text a scraper reads, replaced by React the moment the bundle runs. */
function rootSeed(meta: PageMeta): string {
  if (!meta.heading && !meta.body?.length) return "";
  const parts: string[] = [];
  if (meta.heading) parts.push(`<h1>${escapeHtml(meta.heading)}</h1>`);
  for (const paragraph of meta.body ?? []) parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  return parts.join("");
}

/**
 * Rewrites the served index.html for one route.
 *
 * Replaces the placeholder title and description rather than appending
 * duplicates, so the document always carries exactly one of each.
 */
export function injectMeta(template: string, meta: PageMeta): string {
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  html = html.replace(/<\/head>/i, `${headTags(meta)}\n  </head>`);

  const seed = rootSeed(meta);
  if (seed) {
    html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${seed}</div>`);
  }

  return html;
}

export function robotsTxt(siteUrl: string, cmsPath: string): string {
  const origin = siteUrl.replace(/\/+$/, "");
  const cms = `/${cmsPath.replace(/^\/+|\/+$/g, "")}`;
  return [
    "User-agent: *",
    "Allow: /",
    `Disallow: ${cms}`,
    "Disallow: /admin",
    "Disallow: /api",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

export function sitemapXml(siteUrl: string, entries: SitemapEntry[]): string {
  const origin = siteUrl.replace(/\/+$/, "");
  const urls = entries.map((entry) => {
    const loc = `${origin}/${entry.path.replace(/^\/+/, "")}`.replace(/\/$/, "") || origin;
    const lastmod = toIsoDate(entry.lastModified);
    return [
      "  <url>",
      `    <loc>${escapeHtml(loc)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

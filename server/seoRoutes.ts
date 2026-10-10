/**
 * Route-aware metadata: the database lookups and Express wiring that feed the
 * pure string helpers in `server/seo.ts`.
 *
 * Copy comes from the same bilingual dictionary the client renders
 * (shared/i18n), so the title a crawler sees is the title a visitor sees.
 * English (the default) lives at "/", Indonesian at "/id"; every public page
 * advertises both through hreflang, and legacy "/en" URLs 301 to English.
 */
import type { Express, Request, Response } from "express";
import {
  absoluteUrl,
  metaDescription,
  robotsTxt,
  sitemapXml,
  type JsonLd,
  type PageMeta,
  type SitemapEntry,
} from "./seo";
import { getRegistryProductBySlug, listRegistryProducts, listSiteContent } from "./registry";
import { MESSAGES } from "@shared/i18n/messages";
import { localizeProduct } from "@shared/i18n/products";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LEGAL_PAGES_DRAFT,
  legacyEnglishTarget,
  LOCALES,
  OG_LOCALE,
  SITE,
  localizePath,
  splitLocale,
  type Locale,
} from "@shared/site";

/**
 * Where the site lives once deployed.
 *
 * Used when SITE_URL is not set in a production environment, so a forgotten
 * environment variable cannot quietly publish canonical URLs and a sitemap
 * pointing at the wrong host. An explicit SITE_URL always wins over it.
 */
export const PRODUCTION_SITE_URL = SITE.origin;

/**
 * Fallback card for pages with no image of their own. Regenerated from
 * design/og-default.svg — see design/README.md.
 */
export const DEFAULT_OG_IMAGE = "/og-default.png";

/** Mirrors the client's VITE_CMS_PATH so robots.txt and noindex stay in step with the real route. */
export function cmsPath(): string {
  const raw = process.env.VITE_CMS_PATH || "/studio";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Canonical URLs must be stable, so production sets SITE_URL explicitly. With
 * it unset we fall back to the requesting host, which keeps local development
 * and preview deployments honest without configuration.
 */
export function siteUrl(req?: Request): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;
  if (!req) return "http://localhost:3000";
  const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() || req.protocol || "http";
  const host = (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

type Content = Record<string, string>;

async function siteContentMap(): Promise<Content> {
  try {
    const rows = await listSiteContent();
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    // Metadata must never take the page down with it.
    return {};
  }
}

function organization(content: Content, origin: string, locale: Locale): JsonLd {
  const sameAs = ["company.instagramUrl", "company.linkedinUrl", "company.githubUrl"]
    .map((key) => content[key]?.trim())
    .filter((value): value is string => Boolean(value));

  const logo = absoluteUrl(origin, content["company.logoUrl"]);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content["company.name"] || SITE.name,
    url: origin,
    description: MESSAGES[locale].common.tagline,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region[locale],
      addressCountry: "ID",
    },
    ...(logo ? { logo } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * Best available card for a page: the product's own cover, then the company
 * logo, then the site default. Never empty, so a shared link always previews
 * with an image.
 */
function ogImageFor(content: Content, origin: string, preferred?: string | null): string | undefined {
  return (
    absoluteUrl(origin, preferred) ??
    absoluteUrl(origin, content["company.logoUrl"]) ??
    absoluteUrl(origin, DEFAULT_OG_IMAGE)
  );
}

function pathOf(url: string): string {
  const [pathname] = url.split("?");
  return pathname.replace(/\/+$/, "") || "/";
}

/** hreflang set for a page that exists in every locale; x-default points at the default (English). */
function alternatesFor(origin: string, path: string): PageMeta["alternates"] {
  const href = (locale: Locale) => {
    const localized = localizePath(path, locale);
    return localized === "/" ? origin : `${origin}${localized}`;
  };
  return [
    ...LOCALES.map((locale) => ({ hreflang: HTML_LANG[locale], href: href(locale) })),
    { hreflang: "x-default", href: href(DEFAULT_LOCALE) },
  ];
}

const STATIC_PAGES = ["/", "/products", "/about", "/contact"] as const;
const LEGAL_PAGES = ["/privacy", "/terms"] as const;

/** Builds the metadata for one request URL. Falls back to a 404 for anything unrecognised. */
export async function resolvePageMeta(url: string, req?: Request): Promise<PageMeta> {
  const origin = siteUrl(req);
  const pathname = pathOf(url);
  const content = await siteContentMap();
  const companyName = content["company.name"] || SITE.name;

  // The CMS is a private workspace; it must never reach an index.
  if (pathname === cmsPath() || pathname.startsWith(`${cmsPath()}/`) || pathname.startsWith("/admin")) {
    return {
      title: `Panel Admin — ${companyName}`,
      description: MESSAGES.id.common.tagline,
      canonical: `${origin}${pathname}`,
      ogType: "website",
      locale: OG_LOCALE.id,
      htmlLang: HTML_LANG.id,
      siteName: companyName,
      jsonLd: [],
      noindex: true,
    };
  }

  const { locale, path } = splitLocale(pathname);
  const t = MESSAGES[locale];
  const localized = localizePath(path, locale);
  const canonical = localized === "/" ? origin : `${origin}${localized}`;
  const base = {
    locale: OG_LOCALE[locale],
    htmlLang: HTML_LANG[locale],
    siteName: companyName,
    ogType: "website" as const,
    canonical,
  };
  const titled = (title: string) => `${title} — ${companyName}`;
  const notFound: PageMeta = {
    ...base,
    title: titled(t.meta.notFoundTitle),
    description: t.common.tagline,
    jsonLd: [],
    noindex: true,
    notFound: true,
  };

  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const record = await safeProduct(decodeURIComponent(productMatch[1]));
    if (!record) return notFound;
    const product = localizeProduct(record, locale);
    return {
      ...base,
      ogType: "article",
      title: `${product.name} — ${product.shortDescription.replace(/\.$/, "")} | ${companyName}`,
      description: metaDescription(product.fullDescription),
      ogImage: ogImageFor(content, origin, product.coverUrl),
      heading: product.heroHeadline,
      body: [product.fullDescription, product.problem, product.solution, product.outcome],
      alternates: alternatesFor(origin, path),
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: product.name,
          description: product.fullDescription,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: canonical,
          inLanguage: HTML_LANG[locale],
          ...(product.coverUrl ? { image: absoluteUrl(origin, product.coverUrl) } : {}),
          publisher: organization(content, origin, locale),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t.meta.breadcrumbHome, item: `${origin}${localizePath("/", locale) === "/" ? "" : localizePath("/", locale)}` },
            { "@type": "ListItem", position: 2, name: t.meta.breadcrumbProducts, item: `${origin}${localizePath("/products", locale)}` },
            { "@type": "ListItem", position: 3, name: product.name, item: canonical },
          ],
        },
      ],
    };
  }

  const page = (title: string, description: string, heading: string, body: string[], extra: Partial<PageMeta> = {}): PageMeta => ({
    ...base,
    title,
    description: metaDescription(description),
    ogImage: ogImageFor(content, origin),
    heading,
    body,
    alternates: alternatesFor(origin, path),
    jsonLd: [organization(content, origin, locale)],
    ...extra,
  });

  switch (path) {
    case "/":
      return page(t.meta.homeTitle, t.meta.homeDescription, t.home.title, [t.home.lead]);
    case "/products":
      return page(titled(t.meta.productsTitle), t.meta.productsDescription, t.products.title, [t.products.lead]);
    case "/about":
      return page(titled(t.meta.aboutTitle), t.meta.aboutDescription, t.about.title, [t.about.lead, ...t.about.story]);
    case "/contact":
      return page(titled(t.meta.contactTitle), t.meta.contactDescription, t.contact.title, [t.contact.lead]);
    case "/privacy":
    case "/terms": {
      const doc = path === "/privacy" ? t.legal.privacy : t.legal.terms;
      // Drafts stay out of the index until the owner approves the text.
      return page(titled(doc.title), doc.intro, doc.title, [doc.intro], { noindex: LEGAL_PAGES_DRAFT });
    }
    default:
      return notFound;
  }
}

async function safeProduct(slug: string) {
  try {
    return await getRegistryProductBySlug(slug, true);
  } catch {
    return null;
  }
}

/** One sitemap entry per locale, each listing every language version of the page. */
function localizedEntries(path: string, lastModified?: Date | string | null): SitemapEntry[] {
  const alternates = [
    ...LOCALES.map((locale) => ({ hreflang: HTML_LANG[locale], path: localizePath(path, locale) })),
    { hreflang: "x-default", path: localizePath(path, DEFAULT_LOCALE) },
  ];
  return LOCALES.map((locale) => ({ path: localizePath(path, locale), lastModified, alternates }));
}

export function registerSeoRoutes(app: Express) {
  // English moved from "/en" to "/": keep old links and index entries working.
  app.get(/^\/en(\/.*)?$/, (req: Request, res: Response) => {
    const target = legacyEnglishTarget(req.path) ?? "/";
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(301, `${target}${query}`);
  });

  app.get("/robots.txt", (req: Request, res: Response) => {
    res.type("text/plain").send(robotsTxt(siteUrl(req), cmsPath()));
  });

  // Generated from the database rather than written by hand, so unpublishing a
  // product in the CMS removes it from the sitemap on the next request.
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    const origin = siteUrl(req);
    const pages: string[] = [...STATIC_PAGES, ...(LEGAL_PAGES_DRAFT ? [] : LEGAL_PAGES)];
    const entries: SitemapEntry[] = pages.flatMap((path) => localizedEntries(path));

    try {
      const products = await listRegistryProducts(true);
      for (const product of products) {
        entries.push(...localizedEntries(`/products/${product.slug}`, product.updatedAt));
      }
    } catch {
      // A database hiccup should still leave the static routes discoverable.
    }

    res.type("application/xml").send(sitemapXml(origin, entries));
  });
}

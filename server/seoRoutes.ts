/**
 * Route-aware metadata: the database lookups and Express wiring that feed the
 * pure string helpers in `server/seo.ts`.
 */
import type { Express, Request, Response } from "express";
import {
  absoluteUrl,
  metaDescription,
  robotsTxt,
  sitemapXml,
  titleDescriptor,
  type JsonLd,
  type PageMeta,
  type SitemapEntry,
} from "./seo";
import { getRegistryProductBySlug, listRegistryProducts, listSiteContent } from "./registry";

const LOCALE = "id_ID";

/**
 * Where the site lives once deployed.
 *
 * Used when SITE_URL is not set in a production environment, so a forgotten
 * environment variable cannot quietly publish canonical URLs and a sitemap
 * pointing at the wrong host. An explicit SITE_URL always wins over it.
 */
export const PRODUCTION_SITE_URL = "https://ruang-karya.co.id";

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

function organization(content: Content, origin: string): JsonLd {
  const sameAs = ["company.instagramUrl", "company.linkedinUrl", "company.githubUrl"]
    .map((key) => content[key]?.trim())
    .filter((value): value is string => Boolean(value));

  const logo = absoluteUrl(origin, content["company.logoUrl"]);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content["company.name"] || "Ruang Karya",
    url: origin,
    ...(content["company.tagline"] ? { description: content["company.tagline"] } : {}),
    ...(logo ? { logo } : {}),
    ...(content["company.email"] ? { email: content["company.email"] } : {}),
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

/** Builds the metadata for one request URL. Falls back to site defaults on anything unrecognised. */
export async function resolvePageMeta(url: string, req?: Request): Promise<PageMeta> {
  const origin = siteUrl(req);
  const pathname = pathOf(url);
  const content = await siteContentMap();

  const companyName = content["company.name"] || "Ruang Karya";
  const tagline = content["company.tagline"] || "Perangkat lunak terpadu untuk alur kerja yang terus bergerak.";

  const base = {
    locale: LOCALE,
    siteName: companyName,
    ogType: "website" as const,
    canonical: `${origin}${pathname === "/" ? "" : pathname}`,
  };

  // The CMS is a private workspace; it must never reach an index.
  if (pathname === cmsPath() || pathname.startsWith(`${cmsPath()}/`) || pathname.startsWith("/admin")) {
    return {
      ...base,
      title: `Panel Admin — ${companyName}`,
      description: tagline,
      jsonLd: [],
      noindex: true,
    };
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const product = await safeProduct(decodeURIComponent(productMatch[1]));
    if (product) {
      const descriptor = titleDescriptor(product.shortDescription);
      return {
        ...base,
        ogType: "article",
        title: `${product.name} — ${descriptor} | ${companyName}`,
        description: metaDescription(product.shortDescription),
        ogImage: ogImageFor(content, origin, product.coverUrl),
        heading: product.heroHeadline,
        body: [product.shortDescription, product.problem, product.solution, product.outcome],
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: product.name,
            description: product.shortDescription,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: base.canonical,
            inLanguage: "id-ID",
            ...(product.coverUrl ? { image: absoluteUrl(origin, product.coverUrl) } : {}),
            publisher: organization(content, origin),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Beranda", item: origin },
              { "@type": "ListItem", position: 2, name: "Produk", item: `${origin}/products` },
              { "@type": "ListItem", position: 3, name: product.name, item: base.canonical },
            ],
          },
        ],
      };
    }
    // Unknown slug: the SPA renders its not-found state, so keep it out of the index.
    return { ...base, title: `Halaman tidak ditemukan — ${companyName}`, description: tagline, jsonLd: [], noindex: true };
  }

  if (pathname === "/products") {
    return {
      ...base,
      title: `Produk — ${companyName}`,
      ogImage: ogImageFor(content, origin),
      description: metaDescription(
        content["home.featuredDescription"] ||
          "Katalog produk perangkat lunak yang dirancang untuk menyelesaikan kendala nyata dalam operasional kerja."
      ),
      heading: "Koleksi produk kami",
      body: [tagline],
      jsonLd: [organization(content, origin)],
    };
  }

  if (pathname === "/about") {
    return {
      ...base,
      title: `Tentang Kami — ${companyName}`,
      ogImage: ogImageFor(content, origin),
      description: metaDescription(content["about.heroDescription"] || tagline),
      heading: content["about.heroTitle"] || "Tentang Kami",
      body: [content["about.heroDescription"] || tagline, content["about.statement"] || ""].filter(Boolean),
      jsonLd: [organization(content, origin)],
    };
  }

  if (pathname === "/contact") {
    return {
      ...base,
      title: `Kontak — ${companyName}`,
      ogImage: ogImageFor(content, origin),
      description: metaDescription(content["contact.intro"] || tagline),
      heading: content["contact.heroTitle"] || "Kontak",
      body: [content["contact.intro"] || tagline],
      jsonLd: [organization(content, origin)],
    };
  }

  if (pathname === "/") {
    return {
      ...base,
      title: `${companyName} — ${titleDescriptor(tagline)}`,
      ogImage: ogImageFor(content, origin),
      description: metaDescription(content["home.heroDescription"] || tagline),
      heading: content["home.heroTitle"] || companyName,
      body: [content["home.heroDescription"] || tagline],
      jsonLd: [organization(content, origin)],
    };
  }

  return { ...base, title: `Halaman tidak ditemukan — ${companyName}`, description: tagline, jsonLd: [], noindex: true };
}

async function safeProduct(slug: string) {
  try {
    return await getRegistryProductBySlug(slug, true);
  } catch {
    return null;
  }
}

const STATIC_ROUTES = ["/", "/products", "/about", "/contact"];

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (req: Request, res: Response) => {
    res.type("text/plain").send(robotsTxt(siteUrl(req), cmsPath()));
  });

  // Generated from the database rather than written by hand, so unpublishing a
  // product in the CMS removes it from the sitemap on the next request.
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    const origin = siteUrl(req);
    const entries: SitemapEntry[] = STATIC_ROUTES.map((path) => ({ path }));

    try {
      const products = await listRegistryProducts(true);
      for (const product of products) {
        entries.push({ path: `/products/${product.slug}`, lastModified: product.updatedAt });
      }
    } catch {
      // A database hiccup should still leave the static routes discoverable.
    }

    res.type("application/xml").send(sitemapXml(origin, entries));
  });
}

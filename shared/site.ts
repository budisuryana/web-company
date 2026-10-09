/**
 * Company facts and locale routing shared by the client and the server.
 *
 * These are the only company details the public site states. Anything not
 * listed here (legal entity, team, customers, revenue) is deliberately absent
 * until the owner confirms it — the site must never invent credibility.
 */

export const SITE = {
  /** Public brand. Do not rename — the brand and logo are owner decisions. */
  name: "Ruang Karya",
  domain: "nusakarya.tech",
  origin: "https://nusakarya.tech",
  email: "info@nusakarya.tech",
  city: "Bandung",
  region: { id: "Jawa Barat", en: "West Java" },
  country: { id: "Indonesia", en: "Indonesia" },
} as const;

/**
 * Privacy Policy and Terms of Service are drafts awaiting owner/legal review.
 * While true the pages show a draft banner, carry noindex, and stay out of the
 * sitemap. Flip to false only after the owner signs off on the text.
 */
export const LEGAL_PAGES_DRAFT = true;

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const HTML_LANG: Record<Locale, string> = { id: "id", en: "en" };
export const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US" };

/** Splits "/en/products" into { locale: "en", path: "/products" }. Indonesian has no prefix. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const clean = pathname.split(/[?#]/)[0] || "/";
  if (clean === "/en" || clean.startsWith("/en/")) {
    return { locale: "en", path: clean.slice(3) || "/" };
  }
  return { locale: "id", path: clean };
}

/** The public URL path of `path` in `locale`. */
export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "id") return normalized;
  return normalized === "/" ? "/en" : `/en${normalized}`;
}

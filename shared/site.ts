/**
 * Company facts and locale routing shared by the client and the server.
 *
 * These are the only company details the public site states. Anything not
 * listed here (legal entity, team, customers, revenue) is deliberately absent
 * until the owner confirms it — the site must never invent credibility.
 */

export const SITE = {
  /** Public brand. Do not rename — the brand and logo are owner decisions. */
  name: "NUSAKARYA",
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
export const DEFAULT_LOCALE: Locale = "en";

export const HTML_LANG: Record<Locale, string> = { id: "id", en: "en" };
export const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US" };

/** English (the default) has no prefix; Indonesian lives under "/id". */
const PREFIXED_LOCALE: Locale = "id";

function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Splits "/id/products" into { locale: "id", path: "/products" }. Unprefixed paths are English. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const clean = pathname.split(/[?#]/)[0] || "/";
  const prefix = `/${PREFIXED_LOCALE}`;
  if (underPrefix(clean, prefix)) {
    return { locale: PREFIXED_LOCALE, path: clean.slice(prefix.length) || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: clean };
}

/** The public URL path of `path` in `locale`. */
export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/**
 * English used to live under "/en" (production 1fe71b7). Those URLs may already
 * be shared or indexed, so they permanently redirect to the unprefixed English
 * page. Returns the target path, or null when `pathname` is not a legacy URL.
 */
export function legacyEnglishTarget(pathname: string): string | null {
  if (!underPrefix(pathname, "/en")) return null;
  return pathname.slice(3) || "/";
}

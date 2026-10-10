/**
 * The CMS-editable part of the public copy, and how CMS overrides combine with
 * the code dictionary.
 *
 * shared/i18n/messages.ts stays the source of every default. The CMS stores
 * overrides per key and language (table page_content); a missing or blank
 * override falls back to the default, so a page can never render empty.
 * Interface labels, the legal drafts and the Claude API disclaimer are not
 * listed here and therefore stay in code.
 *
 * The same functions run on the server (SEO metadata, crawler snapshot) and in
 * the browser, so both always show the same resolved text.
 */
import { MESSAGES, type Messages } from "./messages";
import { SITE, type Locale } from "../site";

export type ContentSection = "company" | "home" | "products" | "upcoming" | "about" | "contact";

export type EditableField = {
  key: string;
  section: ContentSection;
  label: string;
  /** Longer copy: edited in a textarea. */
  multiline?: boolean;
  max: number;
  /** Same value in every language (stored under locale "en"). */
  shared?: boolean;
  /** Extra validation for the value. */
  format?: "email";
};

/** Id of the inline JSON block (in each served page) holding the CMS overrides. */
export const CONTENT_ELEMENT_ID = "nk-content";

/** Overrides as stored: locale → key → value. */
export type ContentOverrides = Partial<Record<Locale, Record<string, string>>>;

export const CONTENT_SECTIONS: Array<{ id: ContentSection; title: string; titleEn: string }> = [
  { id: "company", title: "Profil Perusahaan", titleEn: "Company Profile" },
  { id: "home", title: "Home Page", titleEn: "Home Page" },
  { id: "products", title: "Halaman Produk", titleEn: "Products Page" },
  { id: "upcoming", title: "In Development", titleEn: "In Development" },
  { id: "about", title: "About Page", titleEn: "About Page" },
  { id: "contact", title: "Contact Page", titleEn: "Contact Page" },
];

/** English for each part of an editable field's Indonesian label ("Prinsip 2 — isi" → "Principle 2 — body"). */
export const FIELD_LABEL_PARTS_EN: Record<string, string> = {
  "Nama perusahaan": "Company name",
  "Tagline": "Tagline",
  "Email resmi": "Official email",
  "Lokasi": "Location",
  "SEO": "SEO",
  "judul halaman": "page title",
  "deskripsi": "description",
  "Hero": "Hero",
  "label": "label",
  "judul": "title",
  "paragraf": "paragraph",
  "fakta": "fact",
  "Produk": "Products",
  "Cara kami membangun": "How we build",
  "poin": "point",
  "isi": "body",
  "AI": "AI",
  "kartu": "card",
  "Penutup": "Closing",
  "Ajakan": "Call to action",
  "tombol": "button",
  "Judul bagian": "Section title",
  "Pengantar": "Introduction",
  "Label status": "Status label",
  "nama": "name",
  "Cerita": "Story",
  "Prinsip": "Principle",
  "Formulir": "Form",
  "keterangan": "note",
  "Setelah terkirim": "After sending",
};

/** A field's label in the admin language. Indonesian is the stored label; English is built from its parts. */
export function fieldLabel(label: string, locale: Locale): string {
  if (locale === "id") return label;
  return label
    .split(" — ")
    .map((part) => {
      // A part is a phrase optionally followed by an item number: "Prinsip 2", "isi".
      const [, phrase, number] = part.match(/^(.*?)(?: (\d+))?$/) ?? [part, part, undefined];
      const english = FIELD_LABEL_PARTS_EN[phrase] ?? phrase;
      return number ? `${english} ${number}` : english;
    })
    .join(" — ");
}

const TITLE = 160;
const SHORT = 80;
const DESCRIPTION = 320;
const PARAGRAPH = 900;

function field(section: ContentSection, key: string, label: string, max: number, extra: Partial<EditableField> = {}): EditableField {
  return { section, key, label, max, multiline: max > TITLE, ...extra };
}

/** One field per item of a fixed-length list (its length is taken from the dictionary). */
function listFields(section: ContentSection, base: string, label: string, max: number, parts?: Array<[string, string, number]>): EditableField[] {
  const list = valueAt(MESSAGES.en, base) as unknown[];
  return list.flatMap((_, index) =>
    parts
      ? parts.map(([part, partLabel, partMax]) => field(section, `${base}.${index}.${part}`, `${label} ${index + 1} — ${partLabel}`, partMax))
      : [field(section, `${base}.${index}`, `${label} ${index + 1}`, max)],
  );
}

export const COMPANY_FIELDS = {
  name: "company.name",
  email: "company.email",
  tagline: "common.tagline",
  location: "common.location",
} as const;

export const EDITABLE_FIELDS: EditableField[] = [
  field("company", COMPANY_FIELDS.name, "Nama perusahaan", SHORT, { shared: true }),
  field("company", COMPANY_FIELDS.tagline, "Tagline", TITLE),
  field("company", COMPANY_FIELDS.email, "Email resmi", 254, { shared: true, format: "email", multiline: false }),
  field("company", COMPANY_FIELDS.location, "Lokasi", TITLE),

  field("home", "meta.homeTitle", "SEO — judul halaman", TITLE),
  field("home", "meta.homeDescription", "SEO — deskripsi", DESCRIPTION),
  field("home", "home.eyebrow", "Hero — label", SHORT),
  field("home", "home.title", "Hero — judul", TITLE),
  field("home", "home.lead", "Hero — paragraf", PARAGRAPH),
  ...listFields("home", "home.facts", "Hero — fakta", SHORT),
  field("home", "home.productsEyebrow", "Produk — label", SHORT),
  field("home", "home.productsTitle", "Produk — judul", TITLE),
  field("home", "home.productsLead", "Produk — paragraf", PARAGRAPH),
  field("home", "home.methodEyebrow", "Cara kami membangun — label", SHORT),
  field("home", "home.methodTitle", "Cara kami membangun — judul", TITLE),
  ...listFields("home", "home.method", "Cara kami membangun — poin", 0, [["title", "judul", TITLE], ["body", "isi", PARAGRAPH]]),
  field("home", "home.aiEyebrow", "AI — label", SHORT),
  field("home", "home.aiTitle", "AI — judul", TITLE),
  field("home", "home.aiLead", "AI — paragraf", PARAGRAPH),
  ...listFields("home", "home.aiPractices", "AI — kartu", 0, [["title", "judul", TITLE], ["body", "isi", PARAGRAPH]]),
  field("home", "home.ctaTitle", "Penutup — judul", TITLE),
  field("home", "home.ctaLead", "Penutup — paragraf", PARAGRAPH),

  field("products", "meta.productsTitle", "SEO — judul halaman", TITLE),
  field("products", "meta.productsDescription", "SEO — deskripsi", DESCRIPTION),
  field("products", "products.eyebrow", "Hero — label", SHORT),
  field("products", "products.title", "Hero — judul", TITLE),
  field("products", "products.lead", "Hero — paragraf", PARAGRAPH),
  field("products", "products.ctaTitle", "Ajakan — judul", TITLE),
  field("products", "products.ctaButton", "Ajakan — tombol", SHORT),

  field("upcoming", "upcoming.title", "Judul bagian", SHORT),
  field("upcoming", "upcoming.lead", "Pengantar", DESCRIPTION),
  field("upcoming", "upcoming.status", "Label status", SHORT),
  ...listFields("upcoming", "upcoming.items", "Produk", 0, [["name", "nama", SHORT], ["description", "deskripsi", DESCRIPTION]]),

  field("about", "meta.aboutTitle", "SEO — judul halaman", TITLE),
  field("about", "meta.aboutDescription", "SEO — deskripsi", DESCRIPTION),
  field("about", "about.eyebrow", "Hero — label", SHORT),
  field("about", "about.title", "Hero — judul", TITLE),
  field("about", "about.lead", "Hero — paragraf", PARAGRAPH),
  field("about", "about.storyTitle", "Cerita — label", SHORT),
  ...listFields("about", "about.story", "Cerita — paragraf", PARAGRAPH),
  field("about", "about.valuesEyebrow", "Prinsip — label", SHORT),
  field("about", "about.valuesTitle", "Prinsip — judul", TITLE),
  ...listFields("about", "about.values", "Prinsip", 0, [["title", "judul", TITLE], ["body", "isi", PARAGRAPH]]),
  field("about", "about.aiTitle", "AI — judul", TITLE),
  field("about", "about.aiBody", "AI — isi", PARAGRAPH),
  field("about", "about.ctaTitle", "Penutup — judul", TITLE),

  field("contact", "meta.contactTitle", "SEO — judul halaman", TITLE),
  field("contact", "meta.contactDescription", "SEO — deskripsi", DESCRIPTION),
  field("contact", "contact.eyebrow", "Hero — label", SHORT),
  field("contact", "contact.title", "Hero — judul", TITLE),
  field("contact", "contact.lead", "Hero — paragraf", PARAGRAPH),
  field("contact", "contact.formEyebrow", "Formulir — label", SHORT),
  field("contact", "contact.formLead", "Formulir — keterangan", DESCRIPTION),
  field("contact", "contact.sentTitle", "Setelah terkirim — judul", TITLE),
  field("contact", "contact.sentBody", "Setelah terkirim — isi", DESCRIPTION),
];

const FIELD_BY_KEY = new Map(EDITABLE_FIELDS.map((item) => [item.key, item]));

export function editableField(key: string): EditableField | undefined {
  return FIELD_BY_KEY.get(key);
}

function valueAt(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, part) => (node == null ? undefined : (node as Record<string, unknown>)[part]), source);
}

/** The code default of an editable key in a language. */
export function defaultValue(key: string, locale: Locale): string {
  if (key === COMPANY_FIELDS.name) return SITE.name;
  if (key === COMPANY_FIELDS.email) return SITE.email;
  const value = valueAt(MESSAGES[locale], key);
  return typeof value === "string" ? value : "";
}

/** Locale a field's override is stored under. */
export function storageLocale(item: EditableField, locale: Locale): Locale {
  return item.shared ? "en" : locale;
}

/** Validates a CMS value for a key. Returns an error message, or null when acceptable. */
export function validateContent(key: string, value: string, locale: Locale = "id"): string | null {
  const en = locale === "en";
  const item = editableField(key);
  if (!item) return en ? "This field cannot be edited in the CMS." : "Field ini tidak dapat diedit melalui CMS.";
  const text = value.trim();
  if (!text) return en ? "This field cannot be empty. Use Reset to Default to return to the default text." : "Isi tidak boleh kosong. Gunakan Reset to Default untuk kembali ke teks bawaan.";
  if (text.length > item.max) return en ? `At most ${item.max} characters (currently ${text.length}).` : `Maksimal ${item.max} karakter (saat ini ${text.length}).`;
  if (item.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return en ? "Invalid email address." : "Alamat email tidak valid.";
  return null;
}

/** The override in effect for a key and language, or undefined when the default applies. */
export function overrideFor(overrides: ContentOverrides | undefined, key: string, locale: Locale): string | undefined {
  const item = editableField(key);
  if (!item || !overrides) return undefined;
  const value = overrides[storageLocale(item, locale)]?.[key];
  return value && value.trim() ? value : undefined;
}

export type CompanyProfile = { name: string; email: string; tagline: string; location: string };

export function resolveCompany(locale: Locale, overrides?: ContentOverrides): CompanyProfile {
  const pick = (key: string) => overrideFor(overrides, key, locale) ?? defaultValue(key, locale);
  return {
    name: pick(COMPANY_FIELDS.name),
    email: pick(COMPANY_FIELDS.email),
    tagline: pick(COMPANY_FIELDS.tagline),
    location: pick(COMPANY_FIELDS.location),
  };
}

function setAt(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.split(".");
  let node = target as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) node = node[part] as Record<string, unknown>;
  node[parts[parts.length - 1]] = value;
}

/** Copies plain data; functions (message formatters) are kept as they are. */
function cloneMessages(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneMessages);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, cloneMessages(inner)]));
  }
  return value;
}

/** Replaces a literal everywhere in the dictionary (strings only). */
function replaceEverywhere(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((inner) => replaceEverywhere(inner, from, to));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, replaceEverywhere(inner, from, to)]));
  }
  return value;
}

/**
 * The dictionary for a language with CMS overrides applied.
 *
 * Company email and location also appear inside fixed copy (About facts, the
 * legal drafts), so an edited value replaces the default literal there too and
 * every page shows the same contact details.
 */
export function resolveMessages(locale: Locale, overrides?: ContentOverrides): Messages {
  const base = MESSAGES[locale];
  const entries = overrides ? EDITABLE_FIELDS.map((item) => [item.key, overrideFor(overrides, item.key, locale)] as const).filter(([, value]) => value !== undefined) : [];
  if (!entries.length) return base;

  let resolved = cloneMessages(base) as Record<string, unknown>;
  const company = resolveCompany(locale, overrides);
  for (const [from, to] of [
    [SITE.email, company.email],
    [defaultValue(COMPANY_FIELDS.location, locale), company.location],
  ] as const) {
    if (from !== to) resolved = replaceEverywhere(resolved, from, to) as Record<string, unknown>;
  }
  for (const [key, value] of entries) {
    if (key.startsWith("company.")) continue; // not part of the dictionary
    setAt(resolved, key, value!);
  }
  return resolved as Messages;
}

/** Only the overrides that may reach the public site (known keys, non-blank), for embedding and the public API. */
export function publicOverrides(overrides: ContentOverrides): ContentOverrides {
  const result: ContentOverrides = {};
  for (const [locale, values] of Object.entries(overrides) as Array<[Locale, Record<string, string>]>) {
    const kept = Object.fromEntries(Object.entries(values ?? {}).filter(([key, value]) => FIELD_BY_KEY.has(key) && value.trim()));
    if (Object.keys(kept).length) result[locale] = kept;
  }
  return result;
}

/**
 * Bilingual page content: CMS overrides stored in page_content, resolved
 * against the code dictionary (see shared/i18n/editable.ts).
 *
 * Reads never fail the page. If the table is missing (migration 0003 not yet
 * applied) or the database is unreachable, the site renders the code defaults.
 * Overrides are cached in memory and the cache is cleared on every write; the
 * app runs as a single process, so no shared cache is needed.
 */
import { and, eq } from "drizzle-orm";
import { pageContent } from "../drizzle/schema";
import { recordActivity } from "./activityLog";
import { getDb } from "./db";
import {
  EDITABLE_FIELDS,
  defaultValue,
  editableField,
  publicOverrides,
  storageLocale,
  validateContent,
  type ContentOverrides,
} from "@shared/i18n/editable";
import type { Locale } from "@shared/site";

const CACHE_MS = 60_000;
let cache: { at: number; overrides: ContentOverrides } | null = null;
let warnedUnavailable = false;

export function clearContentCache() {
  cache = null;
}

/** Every stored override, by locale and key. Empty when the table or database is unavailable. */
export async function loadContentOverrides(): Promise<ContentOverrides> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.overrides;
  let overrides: ContentOverrides = {};
  try {
    const db = await getDb();
    if (db) {
      const rows = await db.select().from(pageContent);
      for (const row of rows) (overrides[row.locale] ??= {})[row.key] = row.value;
      overrides = publicOverrides(overrides);
      warnedUnavailable = false;
    }
  } catch (error) {
    if (!warnedUnavailable) {
      console.warn("[content] page_content unavailable, serving code defaults:", (error as Error)?.message);
      warnedUnavailable = true;
    }
    // Do not cache a failure for long: the migration may land while the app runs.
    cache = { at: Date.now() - CACHE_MS + 5_000, overrides: {} };
    return {};
  }
  cache = { at: Date.now(), overrides };
  return overrides;
}

export type ContentEntry = {
  key: string;
  section: string;
  label: string;
  multiline: boolean;
  max: number;
  shared: boolean;
  format: string | null;
  values: Record<Locale, { default: string; override: string | null }>;
};

/** Every editable field with its defaults and current overrides, for the CMS editor. */
export async function listContentEntries(): Promise<ContentEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows = await db.select().from(pageContent);
  const stored = new Map(rows.map((row) => [`${row.locale}:${row.key}`, row.value]));
  return EDITABLE_FIELDS.map((item) => {
    const valueFor = (locale: Locale) => ({
      default: defaultValue(item.key, locale),
      override: stored.get(`${storageLocale(item, locale)}:${item.key}`) ?? null,
    });
    return {
      key: item.key,
      section: item.section,
      label: item.label,
      multiline: Boolean(item.multiline),
      max: item.max,
      shared: Boolean(item.shared),
      format: item.format ?? null,
      values: { en: valueFor("en"), id: valueFor("id") },
    };
  });
}

type Actor = { openId: string; name: string | null };

export class ContentValidationError extends Error {}

/** Saves an override (live immediately) and records the previous value in the activity log. */
export async function setContent(actor: Actor, key: string, locale: Locale, value: string) {
  const item = editableField(key);
  const problem = validateContent(key, value);
  if (!item || problem) throw new ContentValidationError(problem ?? "Field tidak dikenal.");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const target = storageLocale(item, locale);
  const text = value.trim();
  const [previous] = await db.select().from(pageContent).where(and(eq(pageContent.key, key), eq(pageContent.locale, target))).limit(1);
  if (previous?.value === text) return { key, locale: target, value: text, changed: false };

  await db
    .insert(pageContent)
    .values({ key, locale: target, value: text, updatedAt: new Date(), updatedBy: actor.openId })
    .onConflictDoUpdate({ target: [pageContent.key, pageContent.locale], set: { value: text, updatedAt: new Date(), updatedBy: actor.openId } });
  clearContentCache();
  await recordActivity({
    actorOpenId: actor.openId,
    actorName: actor.name,
    eventType: "page_content.updated",
    resourceType: "page_content",
    resourceId: `${target}:${key}`,
    summary: `Updated ${item.label} (${item.shared ? "EN/ID" : target.toUpperCase()})`,
    detail: { key, locale: target, previous: previous?.value ?? null, previousWasDefault: !previous, value: text },
  });
  return { key, locale: target, value: text, changed: true };
}

/** Removes an override so the code default applies again. */
export async function resetContent(actor: Actor, key: string, locale: Locale) {
  const item = editableField(key);
  if (!item) throw new ContentValidationError("Field ini tidak dapat diedit melalui CMS.");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const target = storageLocale(item, locale);
  const [previous] = await db.select().from(pageContent).where(and(eq(pageContent.key, key), eq(pageContent.locale, target))).limit(1);
  if (!previous) return { key, locale: target, changed: false };
  await db.delete(pageContent).where(and(eq(pageContent.key, key), eq(pageContent.locale, target)));
  clearContentCache();
  await recordActivity({
    actorOpenId: actor.openId,
    actorName: actor.name,
    eventType: "page_content.reset",
    resourceType: "page_content",
    resourceId: `${target}:${key}`,
    summary: `Reset ${item.label} (${item.shared ? "EN/ID" : target.toUpperCase()}) to default`,
    detail: { key, locale: target, previous: previous.value },
  });
  return { key, locale: target, changed: true };
}

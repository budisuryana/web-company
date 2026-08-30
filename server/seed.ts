/**
 * One-time content bootstrap for an empty database.
 *
 * `ensureRegistrySeeded()` cannot be used for this: it also calls
 * `ensureDefaultAdmin()`, which is exactly the credential seeding that must
 * never reach production. This entrypoint writes site content only.
 *
 * It is additive by design — it inserts the keys a database does not have and
 * never updates or deletes one it does. Re-running it on a populated database
 * is a no-op, and copy edited through the CMS is never overwritten.
 *
 *   pnpm db:seed
 */
import "dotenv/config";
import { siteContent } from "../drizzle/schema";
import { getDb } from "./db";
import { siteContentSeed } from "./registrySeed";

function maskedTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[seed] DATABASE_URL is not set. Refusing to run.");
    console.error("[seed] Set it in the environment, e.g. DATABASE_URL=... pnpm db:seed");
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error(`[seed] Could not connect to ${maskedTarget(url)}. Nothing was written.`);
    process.exit(1);
  }

  console.log(`[seed] Target: ${maskedTarget(url)}`);

  const existing = await db.select({ key: siteContent.key }).from(siteContent);
  const present = new Set(existing.map((row) => row.key));
  const missing = siteContentSeed.filter((item) => !present.has(item.key));

  if (missing.length) {
    await db.insert(siteContent).values(missing);
  }

  console.log(`[seed] site_content: ${missing.length} inserted, ${present.size} left untouched.`);
  for (const item of missing) console.log(`[seed]   + ${item.key}`);

  // The only product seed in this repository is the retired catalogue kept for
  // local development. Publishing it here would restore products that are no
  // longer offered, so the live catalogue is built in the CMS instead.
  console.log("[seed] products: skipped — the catalogue is managed in the CMS.");
  console.log("[seed] users: never touched by this script.");

  process.exit(0);
}

main().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});

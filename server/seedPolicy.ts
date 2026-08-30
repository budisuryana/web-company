/**
 * Whether demo data may be written to this database.
 *
 * `ensureRegistrySeeded()` runs on every public product read, and it used to
 * create an `admin` account with a password published in the source tree. In
 * production that means the first visitor to load /products silently arms a
 * known-credential admin login. The sample product catalogue has the same
 * shape of problem: it would republish placeholder products into a live site.
 *
 * So demo seeding is opt-in, and production is never opted in by default.
 * ALLOW_DEMO_SEED=true exists for a staging box that genuinely wants the
 * sample data; it has to be set deliberately.
 */
export function demoSeedAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ALLOW_DEMO_SEED === "true") return true;
  // An unset NODE_ENV means someone is running the app locally by hand.
  const mode = env.NODE_ENV?.trim() || "development";
  return mode === "development" || mode === "test";
}

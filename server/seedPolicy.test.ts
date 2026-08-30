import { afterEach, describe, expect, it } from "vitest";
import { demoSeedAllowed } from "./seedPolicy";
import { ensureDefaultAdmin } from "./db";

/**
 * Regression lock for the reported defect: `ensureRegistrySeeded()` runs on
 * every public product read and used to create an `admin` account whose
 * password is published in this repository. One visitor loading /products was
 * enough to arm it in production.
 */

const ORIGINAL = { env: process.env.NODE_ENV, allow: process.env.ALLOW_DEMO_SEED };

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL.env;
  if (ORIGINAL.allow === undefined) delete process.env.ALLOW_DEMO_SEED;
  else process.env.ALLOW_DEMO_SEED = ORIGINAL.allow;
});

describe("demo seed policy", () => {
  it("refuses production", () => {
    expect(demoSeedAllowed({ NODE_ENV: "production" })).toBe(false);
  });

  it("allows development and test", () => {
    expect(demoSeedAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(demoSeedAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("treats an unset NODE_ENV as local development", () => {
    expect(demoSeedAllowed({})).toBe(true);
    expect(demoSeedAllowed({ NODE_ENV: "  " })).toBe(true);
  });

  it("refuses any environment it does not recognise, rather than assuming it is safe", () => {
    for (const mode of ["staging", "preview", "prod", "PRODUCTION", "qa"]) {
      expect(demoSeedAllowed({ NODE_ENV: mode })).toBe(false);
    }
  });

  it("opts in only on an exact ALLOW_DEMO_SEED=true", () => {
    expect(demoSeedAllowed({ NODE_ENV: "production", ALLOW_DEMO_SEED: "true" })).toBe(true);
    for (const value of ["TRUE", "1", "yes", "", "false"]) {
      expect(demoSeedAllowed({ NODE_ENV: "production", ALLOW_DEMO_SEED: value })).toBe(false);
    }
  });
});

describe("default admin account", () => {
  it("is never created or reset in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_DEMO_SEED;
    // "skipped" is returned by the guard that runs before the first query, so
    // this also asserts production never reaches the insert or the password reset.
    await expect(ensureDefaultAdmin()).resolves.toBe("skipped");
  });

  it("stays skipped in an unrecognised environment such as staging", async () => {
    process.env.NODE_ENV = "staging";
    delete process.env.ALLOW_DEMO_SEED;
    await expect(ensureDefaultAdmin()).resolves.toBe("skipped");
  });

  it("reports a real outcome once seeding is allowed", async () => {
    process.env.NODE_ENV = "test";
    const outcome = await ensureDefaultAdmin();
    expect(outcome).not.toBe("skipped");
    expect(["created", "repaired", "unchanged"]).toContain(outcome);
  });
});

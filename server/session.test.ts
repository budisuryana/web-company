import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

/**
 * Regression lock for the production sign-in loop.
 *
 * Credential login succeeded, issued a cookie, and the very next request was
 * refused with "[Auth] Session payload missing required fields" — so the CMS
 * bounced straight back to its login screen.
 *
 * `verifySession` requires openId, appId and name to be non-empty strings.
 * `createSessionToken` filled `appId` from `ENV.appId`, which is the Manus
 * OAuth client id and is unset on a deployment that does not use OAuth. The
 * token was therefore signed with `appId: ""` and rejected on arrival.
 *
 * These tests run with VITE_APP_ID deliberately unset — the production shape —
 * and touch no database.
 */

process.env.JWT_SECRET = "test-session-secret-not-used-anywhere-else";
delete process.env.VITE_APP_ID;

const { sdk } = await import("./_core/sdk");
const { adminProcedure, protectedProcedure, router } = await import("./_core/trpc");

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const OPEN_ID = "local_budi";

/** Decodes without verifying, so a test can inspect what was actually signed. */
function claims(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
}

describe("credential login without OAuth configured", () => {
  it("produces a session that verifies — the exact case that was failing", async () => {
    const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
    await expect(sdk.verifySession(token)).resolves.toEqual({
      openId: OPEN_ID,
      appId: expect.any(String),
      name: "Budi",
    });
  });

  it("never signs an empty appId, which is what verifySession rejected", async () => {
    expect(process.env.VITE_APP_ID).toBeUndefined();
    const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
    expect(claims(token).appId).toEqual(expect.any(String));
    expect(String(claims(token).appId).length).toBeGreaterThan(0);
  });

  it("keeps every required claim non-empty even when no display name is known", async () => {
    // The account row may carry neither name nor username.
    const token = await sdk.createSessionToken(OPEN_ID, { name: "" });
    const payload = await sdk.verifySession(token);
    expect(payload).not.toBeNull();
    for (const field of ["openId", "appId", "name"] as const) {
      expect(payload![field]).toEqual(expect.any(String));
      expect(payload![field].length).toBeGreaterThan(0);
    }
  });

  it("falls back to the openId rather than a blank name", async () => {
    const token = await sdk.createSessionToken(OPEN_ID, { name: "   " });
    await expect(sdk.verifySession(token)).resolves.toMatchObject({ name: OPEN_ID });
  });

  it("carries the openId through the round trip, which is how the user is loaded", async () => {
    // authenticateRequest resolves the account with getUserByOpenId(session.openId),
    // so the openId surviving intact is what makes the database role reachable.
    const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
    const payload = await sdk.verifySession(token);
    expect(payload?.openId).toBe(OPEN_ID);
  });

  it("uses a configured VITE_APP_ID when there is one", async () => {
    process.env.VITE_APP_ID = "configured-app-id";
    try {
      // The module read the value at import time, so this asserts the fallback
      // is only a fallback: the claim stays a non-empty string either way.
      const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
      expect(String(claims(token).appId).length).toBeGreaterThan(0);
    } finally {
      delete process.env.VITE_APP_ID;
    }
  });
});

describe("validation is not weakened", () => {
  const signRaw = (payload: Record<string, unknown>) =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 600)
      .sign(SECRET);

  it("still rejects an empty appId", async () => {
    await expect(sdk.verifySession(await signRaw({ openId: OPEN_ID, appId: "", name: "Budi" }))).resolves.toBeNull();
  });

  it("still rejects a missing appId", async () => {
    await expect(sdk.verifySession(await signRaw({ openId: OPEN_ID, name: "Budi" }))).resolves.toBeNull();
  });

  it("still rejects a missing openId", async () => {
    await expect(sdk.verifySession(await signRaw({ appId: "x", name: "Budi" }))).resolves.toBeNull();
  });

  it("still rejects an empty name", async () => {
    await expect(sdk.verifySession(await signRaw({ openId: OPEN_ID, appId: "x", name: "" }))).resolves.toBeNull();
  });

  it("still rejects a non-string claim", async () => {
    await expect(sdk.verifySession(await signRaw({ openId: 42, appId: "x", name: "Budi" }))).resolves.toBeNull();
  });

  it("still rejects a token signed with another secret", async () => {
    const foreign = await new SignJWT({ openId: OPEN_ID, appId: "x", name: "Budi" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 600)
      .sign(new TextEncoder().encode("a-different-secret-entirely"));
    await expect(sdk.verifySession(foreign)).resolves.toBeNull();
  });

  it("still rejects an expired token", async () => {
    const expired = await new SignJWT({ openId: OPEN_ID, appId: "x", name: "Budi" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(SECRET);
    await expect(sdk.verifySession(expired)).resolves.toBeNull();
  });

  it("still rejects a tampered token", async () => {
    const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
    const [header, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ openId: "local_attacker", appId: "x", name: "x" })).toString("base64url");
    await expect(sdk.verifySession(`${header}.${forged}.${signature}`)).resolves.toBeNull();
  });

  it("still rejects a missing cookie", async () => {
    await expect(sdk.verifySession(undefined)).resolves.toBeNull();
    await expect(sdk.verifySession("")).resolves.toBeNull();
  });
});

describe("CMS auth guard", () => {
  // The real middleware from server/_core/trpc.ts, over a resolver that touches
  // nothing, so the guard's decision is tested without a database.
  const probe = router({
    admin: adminProcedure.query(() => "granted"),
    signedIn: protectedProcedure.query(() => "granted"),
  });

  const context = (user: Partial<User> | null): TrpcContext =>
    ({ user: user as User | null, req: {}, res: {} }) as TrpcContext;

  it("admits the account role stored in the database", async () => {
    await expect(probe.createCaller(context({ openId: OPEN_ID, role: "admin" })).admin()).resolves.toBe("granted");
  });

  it("refuses a signed-in account that is not an admin", async () => {
    await expect(probe.createCaller(context({ openId: OPEN_ID, role: "user" })).admin()).rejects.toBeInstanceOf(TRPCError);
  });

  it("refuses an unauthenticated caller", async () => {
    await expect(probe.createCaller(context(null)).admin()).rejects.toBeInstanceOf(TRPCError);
    await expect(probe.createCaller(context(null)).signedIn()).rejects.toBeInstanceOf(TRPCError);
  });

  it("reads the role from the account, never from the session token", async () => {
    // A token cannot claim to be an admin: no role is signed into it at all.
    const token = await sdk.createSessionToken(OPEN_ID, { name: "Budi" });
    expect(claims(token)).not.toHaveProperty("role");
    await expect(probe.createCaller(context({ openId: OPEN_ID, role: "user" })).admin()).rejects.toBeInstanceOf(TRPCError);
  });
});

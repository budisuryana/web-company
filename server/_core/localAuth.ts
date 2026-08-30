import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function safeRedirectPath(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/admin";
}

export function registerLocalAuthRoutes(app: Express) {
  if (ENV.isProduction || ENV.oAuthServerUrl) return;

  app.get("/api/auth/local-signin", async (req: Request, res: Response) => {
    const name = (getQueryParam(req, "name") || "Local Admin").trim().slice(0, 80);
    const role = getQueryParam(req, "role") === "user" ? "user" : "admin";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "admin";
    const openId = `local_${slug}`;

    try {
      await db.upsertUser({
        openId,
        name,
        email: `${slug}@localhost`,
        loginMethod: "local",
        role,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        path: "/",
        sameSite: req.protocol === "https" ? "none" : "lax",
        secure: req.protocol === "https",
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, safeRedirectPath(getQueryParam(req, "redirect")));
    } catch (error) {
      console.error("[LocalAuth] Sign-in failed", error);
      res.status(500).json({ error: "Local sign-in failed" });
    }
  });
}

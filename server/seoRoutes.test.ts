import { afterEach, describe, expect, it } from "vitest";
import { PRODUCTION_SITE_URL, cmsPath, siteUrl } from "./seoRoutes";
import type { Request } from "express";

/**
 * Canonical URLs, the sitemap and every OG tag are built on this one value. A
 * wrong origin at launch publishes a sitemap pointing at the wrong host, so the
 * fallbacks are pinned here rather than left to a deployment checklist.
 */

const ORIGINAL = { site: process.env.SITE_URL, env: process.env.NODE_ENV, cms: process.env.VITE_CMS_PATH };

afterEach(() => {
  process.env.SITE_URL = ORIGINAL.site;
  process.env.NODE_ENV = ORIGINAL.env;
  process.env.VITE_CMS_PATH = ORIGINAL.cms;
});

const request = (headers: Record<string, string> = {}, host = "localhost:3000") =>
  ({ headers, protocol: "http", get: () => host }) as unknown as Request;

describe("site origin", () => {
  it("uses SITE_URL when it is set", () => {
    process.env.SITE_URL = "https://ruang-karya.co.id";
    expect(siteUrl(request())).toBe("https://ruang-karya.co.id");
  });

  it("drops a trailing slash so URLs never double up", () => {
    process.env.SITE_URL = "https://ruang-karya.co.id/";
    expect(siteUrl(request())).toBe("https://ruang-karya.co.id");
  });

  it("falls back to the production domain when SITE_URL is forgotten in production", () => {
    process.env.SITE_URL = "";
    process.env.NODE_ENV = "production";
    expect(siteUrl(request({}, "some-preview-host.internal"))).toBe(PRODUCTION_SITE_URL);
  });

  it("still lets an explicit SITE_URL override the production default", () => {
    process.env.SITE_URL = "https://staging.ruang-karya.co.id";
    process.env.NODE_ENV = "production";
    expect(siteUrl(request())).toBe("https://staging.ruang-karya.co.id");
  });

  it("derives from the request outside production, so local development is honest", () => {
    process.env.SITE_URL = "";
    process.env.NODE_ENV = "development";
    expect(siteUrl(request())).toBe("http://localhost:3000");
  });

  it("honours a proxy's forwarded protocol and host", () => {
    process.env.SITE_URL = "";
    process.env.NODE_ENV = "development";
    const req = request({ "x-forwarded-proto": "https", "x-forwarded-host": "preview.example.com" });
    expect(siteUrl(req)).toBe("https://preview.example.com");
  });

  it("takes the first entry when a proxy chain forwards several", () => {
    process.env.SITE_URL = "";
    process.env.NODE_ENV = "development";
    const req = request({ "x-forwarded-proto": "https, http", "x-forwarded-host": "a.example.com, b.internal" });
    expect(siteUrl(req)).toBe("https://a.example.com");
  });
});

describe("cms path", () => {
  it("defaults to /studio", () => {
    delete process.env.VITE_CMS_PATH;
    expect(cmsPath()).toBe("/studio");
  });

  it("normalises a configured prefix to a single leading slash", () => {
    process.env.VITE_CMS_PATH = "portal/";
    expect(cmsPath()).toBe("/portal");
    process.env.VITE_CMS_PATH = "/workspace";
    expect(cmsPath()).toBe("/workspace");
  });
});

import { describe, expect, it } from "vitest";
import { generateVisitorHash, parseUserAgent, recordPageView, resolveGeoLocation } from "./analytics";

describe("Visitor Analytics & Geo-Location", () => {
  it("generates consistent visitor hash for same IP and user agent", () => {
    const hash1 = generateVisitorHash("192.168.1.1", "Mozilla/5.0");
    const hash2 = generateVisitorHash("192.168.1.1", "Mozilla/5.0");
    const hash3 = generateVisitorHash("192.168.1.2", "Mozilla/5.0");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(32);
  });

  it("parses user agents accurately into device, browser, and OS", () => {
    const mobileUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const desktopUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const mobileParsed = parseUserAgent(mobileUa);
    expect(mobileParsed.deviceType).toBe("Mobile");
    expect(mobileParsed.os).toBe("iOS");
    expect(mobileParsed.browser).toBe("Safari");

    const desktopParsed = parseUserAgent(desktopUa);
    expect(desktopParsed.deviceType).toBe("Desktop");
    expect(desktopParsed.os).toBe("macOS");
    expect(desktopParsed.browser).toBe("Chrome");
  });

  it("resolves local IP to Jakarta Indonesia fallback", () => {
    const localGeo = resolveGeoLocation("127.0.0.1");
    expect(localGeo.country).toBe("Indonesia");
    expect(localGeo.countryCode).toBe("ID");
    expect(localGeo.city).toBe("Jakarta");
  });

  it("does not record views for internal admin and api routes", async () => {
    const adminView = await recordPageView({ path: "/admin/products" });
    const apiView = await recordPageView({ path: "/api/trpc/hello" });
    expect(adminView).toBeNull();
    expect(apiView).toBeNull();
  });
});

/** Visitor analytics service: Geo-location, IP tracking, and device parsing. */
import { createHash } from "crypto";
import { count, countDistinct, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import geoip from "geoip-lite";
import { pageViews } from "../drizzle/schema";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  return db;
}

export function generateVisitorHash(ip: string = "127.0.0.1", userAgent: string = ""): string {
  return createHash("sha256").update(`${ip}:${userAgent}:workshop_salt`).digest("hex").slice(0, 32);
}

export function parseUserAgent(ua: string = ""): {
  deviceType: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
} {
  const lower = ua.toLowerCase();

  // Device Type
  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) {
    deviceType = "Tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(lower)) {
    deviceType = "Mobile";
  }

  // OS
  let os = "Other";
  if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod") || lower.includes("ios")) os = "iOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("linux")) os = "Linux";

  // Browser
  let browser = "Other";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("chrome") && !lower.includes("edg")) browser = "Chrome";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";

  return { deviceType, browser, os };
}

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  SG: "Singapura",
  MY: "Malaysia",
  US: "Amerika Serikat",
  AU: "Australia",
  JP: "Jepang",
  GB: "Inggris",
  DE: "Jerman",
  NL: "Belanda",
  IN: "India",
};

export function resolveGeoLocation(ip: string = "127.0.0.1"): {
  city: string;
  region: string;
  country: string;
  countryCode: string;
} {
  const cleanIp = ip.replace(/^::ffff:/, "").trim();

  // Local / Development IPs -> Default to Bandung, Indonesia
  if (
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("172.16.") ||
    cleanIp === "localhost"
  ) {
    return {
      city: "Bandung",
      region: "Jawa Barat",
      country: "Indonesia",
      countryCode: "ID",
    };
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const countryCode = geo.country || "ID";
      const country = COUNTRY_NAMES[countryCode] || geo.country || "Indonesia";
      const city = geo.city || "Bandung";
      const region = geo.region || "Jawa Barat";
      return { city, region, country, countryCode };
    }
  } catch {
    // Fallback on error
  }

  return {
    city: "Bandung",
    region: "Jawa Barat",
    country: "Indonesia",
    countryCode: "ID",
  };
}

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  ip?: string;
  userAgent?: string;
}) {
  const cmsPrefix = process.env.VITE_CMS_PATH || "/studio";
  // Never track internal admin / studio routes
  if (input.path.startsWith("/admin") || input.path.startsWith(cmsPrefix) || input.path.startsWith("/api")) return null;

  const db = await requireDb();
  const rawIp = input.ip || "127.0.0.1";
  const userAgent = input.userAgent || "";
  const visitorHash = generateVisitorHash(rawIp, userAgent);
  const cleanPath = input.path.split("?")[0].slice(0, 255);
  const cleanReferrer = input.referrer ? input.referrer.slice(0, 500) : null;

  const { deviceType, browser, os } = parseUserAgent(userAgent);
  const { city, region, country, countryCode } = resolveGeoLocation(rawIp);

  const [created] = await db
    .insert(pageViews)
    .values({
      path: cleanPath,
      referrer: cleanReferrer,
      visitorHash,
      ip: rawIp.replace(/^::ffff:/, "").slice(0, 45),
      city,
      region,
      country,
      countryCode,
      deviceType,
      browser,
      os,
      createdAt: new Date(),
    })
    .returning();

  return created;
}

export async function getVisitorAnalytics() {
  const db = await requireDb();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [[totalCount], [uniqueCount], [todayCount], [todayUniqueCount]] = await Promise.all([
    db.select({ total: count() }).from(pageViews),
    db.select({ total: countDistinct(pageViews.visitorHash) }).from(pageViews),
    db.select({ total: count() }).from(pageViews).where(gte(pageViews.createdAt, startOfToday)),
    db.select({ total: countDistinct(pageViews.visitorHash) }).from(pageViews).where(gte(pageViews.createdAt, startOfToday)),
  ]);

  const totalViewsNum = Number(totalCount.total) || 1;

  // Top 5 Visited Paths
  const topPagesRaw = await db
    .select({
      path: pageViews.path,
      views: count(),
      uniques: countDistinct(pageViews.visitorHash),
    })
    .from(pageViews)
    .groupBy(pageViews.path)
    .orderBy(desc(count()))
    .limit(5);

  // Top 5 Cities
  const topCitiesRaw = await db
    .select({
      city: pageViews.city,
      country: pageViews.country,
      countryCode: pageViews.countryCode,
      views: count(),
      uniques: countDistinct(pageViews.visitorHash),
    })
    .from(pageViews)
    .where(isNotNull(pageViews.city))
    .groupBy(pageViews.city, pageViews.country, pageViews.countryCode)
    .orderBy(desc(count()))
    .limit(6);

  // Device Breakdown
  const deviceRaw = await db
    .select({
      deviceType: pageViews.deviceType,
      views: count(),
    })
    .from(pageViews)
    .where(isNotNull(pageViews.deviceType))
    .groupBy(pageViews.deviceType);

  const deviceMap: Record<string, number> = {};
  deviceRaw.forEach((r) => {
    if (r.deviceType) deviceMap[r.deviceType] = Number(r.views);
  });

  // Browser Breakdown
  const browserRaw = await db
    .select({
      browser: pageViews.browser,
      views: count(),
    })
    .from(pageViews)
    .where(isNotNull(pageViews.browser))
    .groupBy(pageViews.browser)
    .orderBy(desc(count()))
    .limit(4);

  // Daily Trends for the past 7 days
  const dailyRows = await db
    .select({
      day: sql<string>`TO_CHAR("createdAt", 'YYYY-MM-DD')`,
      views: count(),
      uniques: countDistinct(pageViews.visitorHash),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sevenDaysAgo))
    .groupBy(sql`TO_CHAR("createdAt", 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR("createdAt", 'YYYY-MM-DD')`);

  const dailyMap = new Map(dailyRows.map((r) => [r.day, { views: Number(r.views), uniques: Number(r.uniques) }]));

  const dailyTrends: Array<{ date: string; label: string; views: number; uniques: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d);
    const found = dailyMap.get(dateStr) ?? { views: 0, uniques: 0 };
    dailyTrends.push({
      date: dateStr,
      label,
      views: found.views,
      uniques: found.uniques,
    });
  }

  // Recent 50 Live Visitors Log
  const recentVisitors = await db
    .select({
      id: pageViews.id,
      path: pageViews.path,
      ip: pageViews.ip,
      city: pageViews.city,
      region: pageViews.region,
      country: pageViews.country,
      countryCode: pageViews.countryCode,
      deviceType: pageViews.deviceType,
      browser: pageViews.browser,
      os: pageViews.os,
      createdAt: pageViews.createdAt,
    })
    .from(pageViews)
    .orderBy(desc(pageViews.createdAt))
    .limit(50);

  return {
    totalViews: Number(totalCount.total),
    uniqueVisitors: Number(uniqueCount.total),
    todayViews: Number(todayCount.total),
    todayUniques: Number(todayUniqueCount.total),
    topPages: topPagesRaw.map((p) => ({
      path: p.path,
      views: Number(p.views),
      uniques: Number(p.uniques),
    })),
    topCities: topCitiesRaw.map((c) => ({
      city: c.city || "Jakarta",
      country: c.country || "Indonesia",
      countryCode: c.countryCode || "ID",
      views: Number(c.views),
      percentage: Math.round((Number(c.views) / totalViewsNum) * 100) || 1,
    })),
    deviceBreakdown: {
      desktop: deviceMap["Desktop"] || 0,
      mobile: deviceMap["Mobile"] || 0,
      tablet: deviceMap["Tablet"] || 0,
    },
    browserBreakdown: browserRaw.map((b) => ({
      browser: b.browser || "Chrome",
      views: Number(b.views),
    })),
    dailyTrends,
    recentVisitors,
  };
}

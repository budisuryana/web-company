/** Product Registry schema: durable, editor-friendly records for the public portfolio and core site copy. */
import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const productStatuses = ["active", "planned", "retired"] as const;
export const publicationStatuses = ["draft", "published"] as const;
export const submissionStatuses = ["new", "read", "archived"] as const;

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const productStatusEnum = pgEnum("product_status", productStatuses);
export const publicationStatusEnum = pgEnum("publication_status", publicationStatuses);
export const submissionStatusEnum = pgEnum("submission_status", submissionStatuses);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 80 }),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  shortDescription: text("shortDescription").notNull(),
  fullDescription: text("fullDescription").notNull(),
  heroHeadline: text("heroHeadline").notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  outcome: text("outcome").notNull(),
  category: varchar("category", { length: 160 }).notNull(),
  productStatus: productStatusEnum("productStatus").default("active").notNull(),
  publicationStatus: publicationStatusEnum("publicationStatus").default("draft").notNull(),
  logoUrl: text("logoUrl"),
  logoKey: text("logoKey"),
  coverUrl: text("coverUrl"),
  coverKey: text("coverKey"),
  capabilities: jsonb("capabilities").$type<string[]>().notNull(),
  targetUsers: text("targetUsers").notNull(),
  demoUrl: varchar("demoUrl", { length: 500 }),
  workflowSteps: jsonb("workflowSteps").$type<Array<{ title: string; copy: string }>>().notNull(),
  featured: integer("featured").default(0).notNull(),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("products_public_order_idx").on(table.publicationStatus, table.displayOrder)]);

export const productMedia = pgTable("product_media", {
  id: varchar("id", { length: 40 }).primaryKey(),
  productId: varchar("productId", { length: 40 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  storageKey: text("storageKey").notNull(),
  alt: varchar("alt", { length: 240 }),
  displayOrder: integer("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("product_media_order_idx").on(table.productId, table.displayOrder)]);

export const siteContent = pgTable("site_content", {
  key: varchar("key", { length: 100 }).primaryKey(),
  label: varchar("label", { length: 180 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id", { length: 40 }).primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  actorName: varchar("actorName", { length: 180 }),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: varchar("resourceId", { length: 190 }),
  summary: varchar("summary", { length: 500 }).notNull(),
  detail: jsonb("detail").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("activity_logs_created_idx").on(table.createdAt), index("activity_logs_resource_idx").on(table.resourceType, table.resourceId)]);

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 255 }).notNull(),
  referrer: varchar("referrer", { length: 500 }),
  visitorHash: varchar("visitorHash", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }),
  countryCode: varchar("countryCode", { length: 10 }),
  deviceType: varchar("deviceType", { length: 50 }),
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("page_views_created_at_idx").on(table.createdAt),
  index("page_views_path_idx").on(table.path),
  index("page_views_city_idx").on(table.city),
  index("page_views_country_idx").on(table.countryCode),
]);

/** Contact form submissions. The public form used to only open a mailto: draft, so every
    enquiry depended on the visitor having a working mail client and no record was kept. */
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 180 }),
  message: text("message").notNull(),
  status: submissionStatusEnum("status").default("new").notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  handledAt: timestamp("handledAt", { withTimezone: true }),
}, (table) => [
  index("contact_submissions_created_idx").on(table.createdAt),
  index("contact_submissions_status_idx").on(table.status),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductMedia = typeof productMedia.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;
export type SubmissionStatus = (typeof submissionStatuses)[number];

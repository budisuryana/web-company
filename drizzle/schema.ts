/** Product Registry schema: durable, editor-friendly records for the public portfolio and core site copy. */
import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const productStatuses = ["active", "planned", "retired"] as const;
export const publicationStatuses = ["draft", "published"] as const;

export const products = mysqlTable("products", {
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
  productStatus: mysqlEnum("productStatus", productStatuses).default("active").notNull(),
  publicationStatus: mysqlEnum("publicationStatus", publicationStatuses).default("draft").notNull(),
  logoUrl: text("logoUrl"),
  logoKey: text("logoKey"),
  coverUrl: text("coverUrl"),
  coverKey: text("coverKey"),
  capabilities: json("capabilities").$type<string[]>().notNull(),
  targetUsers: text("targetUsers").notNull(),
  demoUrl: varchar("demoUrl", { length: 500 }),
  workflowSteps: json("workflowSteps").$type<Array<{ title: string; copy: string }>>().notNull(),
  featured: int("featured").default(0).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("products_public_order_idx").on(table.publicationStatus, table.displayOrder)]);

export const productMedia = mysqlTable("product_media", {
  id: varchar("id", { length: 40 }).primaryKey(),
  productId: varchar("productId", { length: 40 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  storageKey: text("storageKey").notNull(),
  alt: varchar("alt", { length: 240 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("product_media_order_idx").on(table.productId, table.displayOrder)]);

export const siteContent = mysqlTable("site_content", {
  key: varchar("key", { length: 100 }).primaryKey(),
  label: varchar("label", { length: 180 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 40 }).primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  actorName: varchar("actorName", { length: 180 }),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: varchar("resourceId", { length: 190 }),
  summary: varchar("summary", { length: 500 }).notNull(),
  detail: json("detail").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("activity_logs_created_idx").on(table.createdAt), index("activity_logs_resource_idx").on(table.resourceType, table.resourceId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductMedia = typeof productMedia.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

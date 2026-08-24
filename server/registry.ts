/** Product Registry service: a single data layer for product records, attached media, ordering, publishing, and site copy. */
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { productMedia, products, siteContent, type InsertProduct, type Product, type ProductMedia } from "../drizzle/schema";
import { getDb } from "./db";
import { registryProductSeed, siteContentSeed } from "./registrySeed";

export type WorkflowStepInput = { title: string; copy: string };
export type RegistryProductInput = {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  heroHeadline: string;
  problem: string;
  solution: string;
  outcome: string;
  category: string;
  productStatus: "active" | "planned" | "retired";
  publicationStatus: "draft" | "published";
  logoUrl?: string | null;
  logoKey?: string | null;
  coverUrl?: string | null;
  coverKey?: string | null;
  capabilities: string[];
  targetUsers: string;
  demoUrl?: string | null;
  workflowSteps: WorkflowStepInput[];
  featured: boolean;
  displayOrder: number;
};

export type RegistryMedia = ProductMedia;
export type RegistryProduct = Omit<Product, "featured"> & { featured: boolean; screenshots: RegistryMedia[] };

function requireDb() {
  return getDb().then((database) => {
    if (!database) throw new Error("Database is not available.");
    return database;
  });
}

function asRegistryProduct(product: Product, media: RegistryMedia[]): RegistryProduct {
  return { ...product, featured: product.featured === 1, screenshots: media };
}

function productValues(input: RegistryProductInput): Omit<InsertProduct, "id" | "createdAt" | "updatedAt"> {
  return {
    name: input.name,
    slug: input.slug,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    heroHeadline: input.heroHeadline,
    problem: input.problem,
    solution: input.solution,
    outcome: input.outcome,
    category: input.category,
    productStatus: input.productStatus,
    publicationStatus: input.publicationStatus,
    logoUrl: input.logoUrl || null,
    logoKey: input.logoKey || null,
    coverUrl: input.coverUrl || null,
    coverKey: input.coverKey || null,
    capabilities: input.capabilities,
    targetUsers: input.targetUsers,
    demoUrl: input.demoUrl || null,
    workflowSteps: input.workflowSteps,
    featured: input.featured ? 1 : 0,
    displayOrder: input.displayOrder,
  };
}

export async function ensureRegistrySeeded() {
  const db = await requireDb();
  const [{ total }] = await db.select({ total: count() }).from(products);
  if (Number(total) === 0) await db.insert(products).values(registryProductSeed);

  const existingContent = await db.select({ key: siteContent.key }).from(siteContent);
  const existingKeys = new Set(existingContent.map((item) => item.key));
  const missingContent = siteContentSeed.filter((item) => !existingKeys.has(item.key));
  if (missingContent.length) await db.insert(siteContent).values(missingContent);
}

async function hydrateProducts(rows: Product[]): Promise<RegistryProduct[]> {
  if (!rows.length) return [];
  const db = await requireDb();
  const media = await db.select().from(productMedia).where(inArray(productMedia.productId, rows.map((product) => product.id))).orderBy(asc(productMedia.displayOrder));
  return rows.map((product) => asRegistryProduct(product, media.filter((item) => item.productId === product.id)));
}

export async function listRegistryProducts(publicOnly = false) {
  await ensureRegistrySeeded();
  const db = await requireDb();
  const rows = publicOnly
    ? await db.select().from(products).where(eq(products.publicationStatus, "published")).orderBy(asc(products.displayOrder))
    : await db.select().from(products).orderBy(asc(products.displayOrder));
  return hydrateProducts(rows);
}

export async function getRegistryProductBySlug(slug: string, publicOnly = false) {
  await ensureRegistrySeeded();
  const db = await requireDb();
  const rows = publicOnly
    ? await db.select().from(products).where(and(eq(products.slug, slug), eq(products.publicationStatus, "published"))).limit(1)
    : await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  const hydrated = await hydrateProducts(rows);
  return hydrated[0] ?? null;
}

export async function getRegistryProductById(id: string) {
  const db = await requireDb();
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const hydrated = await hydrateProducts(rows);
  return hydrated[0] ?? null;
}

export async function createRegistryProduct(input: RegistryProductInput) {
  const db = await requireDb();
  const id = `product_${nanoid(14)}`;
  await db.insert(products).values({ id, ...productValues(input) });
  return getRegistryProductById(id);
}

export async function updateRegistryProduct(id: string, input: RegistryProductInput) {
  const db = await requireDb();
  await db.update(products).set(productValues(input)).where(eq(products.id, id));
  return getRegistryProductById(id);
}

export async function deleteRegistryProduct(id: string) {
  const db = await requireDb();
  await db.delete(products).where(eq(products.id, id));
  return { success: true as const };
}

export async function reorderRegistryProducts(ids: string[]) {
  const db = await requireDb();
  await Promise.all(ids.map((id, index) => db.update(products).set({ displayOrder: index + 1 }).where(eq(products.id, id))));
  return listRegistryProducts(false);
}

export async function addProductScreenshot(input: { productId: string; url: string; storageKey: string; alt?: string | null; displayOrder: number }) {
  const db = await requireDb();
  const media: typeof productMedia.$inferInsert = { id: `media_${nanoid(14)}`, ...input, alt: input.alt || null };
  await db.insert(productMedia).values(media);
  return media;
}

export async function deleteProductScreenshot(id: string) {
  const db = await requireDb();
  await db.delete(productMedia).where(eq(productMedia.id, id));
  return { success: true as const };
}

export async function reorderProductScreenshots(productId: string, ids: string[]) {
  const db = await requireDb();
  await Promise.all(ids.map((id, index) => db.update(productMedia).set({ displayOrder: index + 1 }).where(and(eq(productMedia.id, id), eq(productMedia.productId, productId)))));
  return getRegistryProductById(productId);
}

export async function updateProductAsset(productId: string, asset: "logo" | "cover", url: string, storageKey: string) {
  const db = await requireDb();
  const patch = asset === "logo" ? { logoUrl: url, logoKey: storageKey } : { coverUrl: url, coverKey: storageKey };
  await db.update(products).set(patch).where(eq(products.id, productId));
  return getRegistryProductById(productId);
}

export async function listSiteContent() {
  await ensureRegistrySeeded();
  const db = await requireDb();
  return db.select().from(siteContent).orderBy(asc(siteContent.key));
}

export async function updateSiteContent(key: string, value: string) {
  const db = await requireDb();
  await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
  const [updated] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
  return updated ?? null;
}

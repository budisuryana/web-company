/** Product Registry router: public read access and owner-only CMS mutations share one typed contract. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { addProductScreenshot, createRegistryProduct, deleteProductScreenshot, deleteRegistryProduct, getRegistryProductById, getRegistryProductBySlug, listRegistryProducts, listSiteContent, reorderProductScreenshots, reorderRegistryProducts, updateProductAsset, updateRegistryProduct, updateSiteContent } from "../registry";
import { decodeImageDataUrl, safeUploadName } from "../registryUpload";
import { listManagedUsers, setManagedUserRole } from "../userManagement";

const productInput = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens."),
  shortDescription: z.string().trim().min(1),
  fullDescription: z.string().trim().min(1),
  heroHeadline: z.string().trim().min(1),
  problem: z.string().trim().min(1),
  solution: z.string().trim().min(1),
  outcome: z.string().trim().min(1),
  category: z.string().trim().min(1).max(160),
  productStatus: z.enum(["active", "planned", "retired"]),
  publicationStatus: z.enum(["draft", "published"]),
  logoUrl: z.string().nullable().optional(),
  logoKey: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverKey: z.string().nullable().optional(),
  capabilities: z.array(z.string().trim().min(1)).max(12),
  targetUsers: z.string().trim().min(1),
  demoUrl: z.string().url().nullable().optional().or(z.literal("")),
  workflowSteps: z.array(z.object({ title: z.string().trim().min(1), copy: z.string().trim().min(1) })).max(8),
  featured: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export const registryRouter = router({
  public: router({
    list: publicProcedure.query(() => listRegistryProducts(true)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => getRegistryProductBySlug(input.slug, true)),
    siteContent: publicProcedure.query(() => listSiteContent()),
  }),
  admin: router({
    list: adminProcedure.query(() => listRegistryProducts(false)),
    byId: adminProcedure.input(z.object({ id: z.string().min(1) })).query(({ input }) => getRegistryProductById(input.id)),
    create: adminProcedure.input(productInput).mutation(({ input }) => createRegistryProduct({ ...input, demoUrl: input.demoUrl || null })),
    update: adminProcedure.input(z.object({ id: z.string().min(1), product: productInput })).mutation(({ input }) => updateRegistryProduct(input.id, { ...input.product, demoUrl: input.product.demoUrl || null })),
    remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => deleteRegistryProduct(input.id)),
    reorder: adminProcedure.input(z.object({ ids: z.array(z.string().min(1)).min(1) })).mutation(({ input }) => reorderRegistryProducts(input.ids)),
    siteContent: adminProcedure.query(() => listSiteContent()),
    updateSiteContent: adminProcedure.input(z.object({ key: z.string().min(1), value: z.string().trim().min(1) })).mutation(({ input }) => updateSiteContent(input.key, input.value)),
    users: router({
      list: adminProcedure.query(() => listManagedUsers()),
      setRole: adminProcedure.input(z.object({ openId: z.string().min(1), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
        try {
          return await setManagedUserRole({ actorOpenId: ctx.user.openId, targetOpenId: input.openId, role: input.role });
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "User role update failed." });
        }
      }),
    }),
  }),
  media: router({
    upload: adminProcedure.input(z.object({ productId: z.string().min(1), assetType: z.enum(["logo", "cover", "screenshot"]), fileName: z.string().min(1).max(160), contentType: z.string().min(1).max(100), dataUrl: z.string().min(1), alt: z.string().trim().max(240).optional() })).mutation(async ({ input }) => {
      const product = await getRegistryProductById(input.productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      const bytes = decodeImageDataUrl(input.dataUrl, input.contentType);
      const folder = input.assetType === "screenshot" ? "screenshots" : input.assetType;
      const stored = await storagePut(`product-registry/${input.productId}/${folder}/${safeUploadName(input.fileName)}`, bytes, input.contentType);
      if (input.assetType === "screenshot") {
        await addProductScreenshot({ productId: input.productId, url: stored.url, storageKey: stored.key, alt: input.alt, displayOrder: product.screenshots.length + 1 });
      } else {
        await updateProductAsset(input.productId, input.assetType, stored.url, stored.key);
      }
      return getRegistryProductById(input.productId);
    }),
    removeScreenshot: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ input }) => deleteProductScreenshot(input.id)),
    reorderScreenshots: adminProcedure.input(z.object({ productId: z.string().min(1), ids: z.array(z.string().min(1)) })).mutation(({ input }) => reorderProductScreenshots(input.productId, input.ids)),
  }),
});

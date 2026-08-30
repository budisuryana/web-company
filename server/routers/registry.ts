/** Product Registry router: public reads plus server-enforced CMS mutations, dashboard summaries, and append-only audit events. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { addProductScreenshot, createRegistryProduct, deleteProductScreenshot, deleteRegistryProduct, getRegistryProductById, getRegistryProductBySlug, listRegistryProducts, listSiteContent, reorderProductScreenshots, reorderRegistryProducts, updateProductAsset, updateRegistryProduct, updateSiteContent } from "../registry";
import { decodeImageDataUrl, safeUploadName } from "../registryUpload";
import { listManagedUsers, setManagedUserRole } from "../userManagement";
import { recordActivity } from "../activityLog";
import { getCmsDashboard } from "../dashboard";
import { getVisitorAnalytics, recordPageView } from "../analytics";
import { createSubmission, deleteSubmission, getSubmission, getSubmissionCounts, listSubmissions, setSubmissionStatus, submissionRateLimited } from "../contact";

const productInput = z.object({
  name: z.string().trim().min(1).max(160), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens."), shortDescription: z.string().trim().min(1), fullDescription: z.string().trim().min(1), heroHeadline: z.string().trim().min(1), problem: z.string().trim().min(1), solution: z.string().trim().min(1), outcome: z.string().trim().min(1), category: z.string().trim().min(1).max(160), productStatus: z.enum(["active", "planned", "retired"]), publicationStatus: z.enum(["draft", "published"]), logoUrl: z.string().nullable().optional(), logoKey: z.string().nullable().optional(), coverUrl: z.string().nullable().optional(), coverKey: z.string().nullable().optional(), capabilities: z.array(z.string().trim().min(1)).max(12), targetUsers: z.string().trim().min(1), demoUrl: z.string().url().nullable().optional().or(z.literal("")), workflowSteps: z.array(z.object({ title: z.string().trim().min(1), copy: z.string().trim().min(1) })).max(8), featured: z.boolean(), displayOrder: z.number().int().min(0),
});

async function logAdminActivity(ctx: { user: { openId: string; name: string | null } }, input: { eventType: string; resourceType: string; resourceId?: string | null; summary: string; detail?: Record<string, unknown> | null }) {
  await recordActivity({ actorOpenId: ctx.user.openId, actorName: ctx.user.name, ...input });
}

/** Turn duplicate-slug failures into a friendly CONFLICT for the editor UI. */
function mapSlugConflict(error: unknown): unknown {
  const pgCode = (error as { code?: string })?.code;
  if ((error instanceof Error && error.message === "SLUG_TAKEN") || pgCode === "23505") {
    return new TRPCError({ code: "CONFLICT", message: "That slug is already used by another product. Choose a different URL slug." });
  }
  return error;
}

export const registryRouter = router({
  public: router({
    list: publicProcedure.query(() => listRegistryProducts(true)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => getRegistryProductBySlug(input.slug, true)),
    siteContent: publicProcedure.query(() => listSiteContent()),
    trackView: publicProcedure
      .input(z.object({ path: z.string().min(1), referrer: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || ctx.req.socket.remoteAddress || "127.0.0.1";
        const userAgent = ctx.req.headers["user-agent"] || "";
        await recordPageView({ path: input.path, referrer: input.referrer, ip, userAgent });
        return { success: true };
      }),
    submitContact: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1, "Nama wajib diisi.").max(180),
        email: z.string().trim().email("Alamat email tidak valid.").max(320),
        company: z.string().trim().max(180).optional(),
        message: z.string().trim().min(1, "Pesan wajib diisi.").max(5000),
        // Honeypot: a real person never sees this field, so anything in it is a bot.
        botField: z.string().max(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || ctx.req.socket.remoteAddress || "127.0.0.1";
        if (submissionRateLimited(ip)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Terlalu banyak pesan dari jaringan ini. Coba lagi nanti." });
        }
        await createSubmission({
          name: input.name,
          email: input.email,
          company: input.company,
          message: input.message,
          ip,
          userAgent: ctx.req.headers["user-agent"] || null,
        });
        // Deliberately returns nothing about the stored row: this endpoint is public.
        return { success: true };
      }),
  }),
  admin: router({
    list: adminProcedure.query(() => listRegistryProducts(false)),
    byId: adminProcedure.input(z.object({ id: z.string().min(1) })).query(({ input }) => getRegistryProductById(input.id)),
    dashboard: adminProcedure.query(() => getCmsDashboard()),
    analytics: adminProcedure.query(() => getVisitorAnalytics()),
    create: adminProcedure.input(productInput).mutation(async ({ ctx, input }) => { let product; try { product = await createRegistryProduct({ ...input, demoUrl: input.demoUrl || null }); } catch (error) { throw mapSlugConflict(error); } if (product) await logAdminActivity(ctx, { eventType: "product.created", resourceType: "product", resourceId: product.id, summary: `Created ${product.name}`, detail: { slug: product.slug, publicationStatus: product.publicationStatus } }); return product; }),
    update: adminProcedure.input(z.object({ id: z.string().min(1), product: productInput })).mutation(async ({ ctx, input }) => { let product; try { product = await updateRegistryProduct(input.id, { ...input.product, demoUrl: input.product.demoUrl || null }); } catch (error) { throw mapSlugConflict(error); } if (product) await logAdminActivity(ctx, { eventType: "product.updated", resourceType: "product", resourceId: product.id, summary: `Updated ${product.name}`, detail: { publicationStatus: product.publicationStatus, featured: product.featured } }); return product; }),
    remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => { const product = await getRegistryProductById(input.id); const result = await deleteRegistryProduct(input.id); if (product) await logAdminActivity(ctx, { eventType: "product.deleted", resourceType: "product", resourceId: product.id, summary: `Deleted ${product.name}`, detail: { slug: product.slug } }); return result; }),
    reorder: adminProcedure.input(z.object({ ids: z.array(z.string().min(1)).min(1) })).mutation(async ({ ctx, input }) => { const result = await reorderRegistryProducts(input.ids); await logAdminActivity(ctx, { eventType: "product.reordered", resourceType: "product", summary: `Reordered ${input.ids.length} products`, detail: { ids: input.ids } }); return result; }),
    submissions: router({
      list: adminProcedure
        .input(z.object({ status: z.enum(["new", "read", "archived"]).optional() }).optional())
        .query(({ input }) => listSubmissions(input?.status)),
      counts: adminProcedure.query(() => getSubmissionCounts()),
      setStatus: adminProcedure
        .input(z.object({ id: z.string().min(1), status: z.enum(["new", "read", "archived"]) }))
        .mutation(async ({ ctx, input }) => {
          const updated = await setSubmissionStatus(input.id, input.status);
          if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Pesan tidak ditemukan." });
          await logAdminActivity(ctx, { eventType: "submission.status_changed", resourceType: "contact_submission", resourceId: updated.id, summary: `Pesan dari ${updated.name} ditandai ${input.status}`, detail: { status: input.status } });
          return updated;
        }),
      remove: adminProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          const existing = await getSubmission(input.id);
          if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Pesan tidak ditemukan." });
          const result = await deleteSubmission(input.id);
          await logAdminActivity(ctx, { eventType: "submission.deleted", resourceType: "contact_submission", resourceId: existing.id, summary: `Menghapus pesan dari ${existing.name}`, detail: { email: existing.email } });
          return result;
        }),
    }),
    siteContent: adminProcedure.query(() => listSiteContent()),
    updateSiteContent: adminProcedure.input(z.object({ key: z.string().min(1), value: z.string().trim() })).mutation(async ({ ctx, input }) => { const updated = await updateSiteContent(input.key, input.value); if (updated) await logAdminActivity(ctx, { eventType: "site_content.updated", resourceType: "site_content", resourceId: updated.key, summary: `Updated ${updated.label}`, detail: { key: updated.key } }); return updated; }),
    users: router({
      list: adminProcedure.query(() => listManagedUsers()),
      setRole: adminProcedure.input(z.object({ openId: z.string().min(1), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
        try {
          const updated = await setManagedUserRole({ actorOpenId: ctx.user.openId, targetOpenId: input.openId, role: input.role });
          await logAdminActivity(ctx, { eventType: "user.role_changed", resourceType: "user", resourceId: updated.openId, summary: `${updated.name || updated.email || updated.openId} is now ${updated.role}`, detail: { role: updated.role } });
          return updated;
        } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "User role update failed." }); }
      }),
    }),
  }),
  media: router({
    upload: adminProcedure.input(z.object({ productId: z.string().min(1), assetType: z.enum(["logo", "cover", "screenshot"]), fileName: z.string().min(1).max(160), contentType: z.string().min(1).max(100), dataUrl: z.string().min(1), alt: z.string().trim().max(240).optional() })).mutation(async ({ ctx, input }) => {
      const product = await getRegistryProductById(input.productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      const bytes = decodeImageDataUrl(input.dataUrl, input.contentType);
      const folder = input.assetType === "screenshot" ? "screenshots" : input.assetType;
      const stored = await storagePut(`product-registry/${input.productId}/${folder}/${safeUploadName(input.fileName)}`, bytes, input.contentType);
      if (input.assetType === "screenshot") await addProductScreenshot({ productId: input.productId, url: stored.url, storageKey: stored.key, alt: input.alt, displayOrder: product.screenshots.length + 1 });
      else await updateProductAsset(input.productId, input.assetType, stored.url, stored.key);
      await logAdminActivity(ctx, { eventType: "product.media_uploaded", resourceType: "product", resourceId: input.productId, summary: `Uploaded ${input.assetType} for ${product.name}`, detail: { assetType: input.assetType, fileName: input.fileName } });
      return getRegistryProductById(input.productId);
    }),
    removeScreenshot: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => { const result = await deleteProductScreenshot(input.id); await logAdminActivity(ctx, { eventType: "product.media_removed", resourceType: "product_media", resourceId: input.id, summary: "Removed a product screenshot" }); return result; }),
    reorderScreenshots: adminProcedure.input(z.object({ productId: z.string().min(1), ids: z.array(z.string().min(1)) })).mutation(async ({ ctx, input }) => { const result = await reorderProductScreenshots(input.productId, input.ids); await logAdminActivity(ctx, { eventType: "product.updated", resourceType: "product", resourceId: input.productId, summary: "Reordered product screenshots", detail: { screenshotIds: input.ids } }); return result; }),
    uploadCompanyLogo: adminProcedure.input(z.object({ fileName: z.string().min(1).max(160), contentType: z.string().min(1).max(100), dataUrl: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const bytes = decodeImageDataUrl(input.dataUrl, input.contentType);
      const stored = await storagePut(`company/logo/${safeUploadName(input.fileName)}`, bytes, input.contentType);
      await updateSiteContent("company.logoUrl", stored.url);
      await logAdminActivity(ctx, { eventType: "site_content.updated", resourceType: "site_content", resourceId: "company.logoUrl", summary: `Uploaded company logo`, detail: { url: stored.url } });
      return { url: stored.url };
    }),
    removeCompanyLogo: adminProcedure.mutation(async ({ ctx }) => {
      await updateSiteContent("company.logoUrl", "");
      await logAdminActivity(ctx, { eventType: "site_content.updated", resourceType: "site_content", resourceId: "company.logoUrl", summary: `Removed company logo` });
      return { success: true };
    }),
  }),
});

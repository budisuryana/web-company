/** Bilingual page content: public reads of CMS overrides, and admin-only editing (live on save, audited, resettable). */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { ContentValidationError, listContentEntries, loadContentOverrides, resetContent, setContent } from "../content";
import { contentLocales } from "../../drizzle/schema";

const locale = z.enum(contentLocales);

function asBadRequest(error: unknown): never {
  if (error instanceof ContentValidationError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const contentRouter = router({
  public: router({
    /** Overrides in effect for one language (shared fields included). Empty when nothing is overridden. */
    forLocale: publicProcedure.input(z.object({ locale })).query(async ({ input }) => {
      const overrides = await loadContentOverrides();
      return { locale: input.locale, overrides: { ...(overrides.en ?? {}), ...(input.locale === "id" ? overrides.id ?? {} : {}) } };
    }),
    /** Every override in both languages: what the server embeds into each page. */
    all: publicProcedure.query(() => loadContentOverrides()),
  }),
  admin: router({
    /** Every editable field with its code default and current override, per language. */
    list: adminProcedure.query(() => listContentEntries()),
    /** Saves one value. It is public immediately. */
    update: adminProcedure
      .input(z.object({ key: z.string().min(1).max(160), locale, value: z.string().max(5000) }))
      .mutation(({ ctx, input }) => setContent(ctx.user, input.key, input.locale, input.value).catch(asBadRequest)),
    /** Removes an override so the code default applies again. */
    reset: adminProcedure
      .input(z.object({ key: z.string().min(1).max(160), locale }))
      .mutation(({ ctx, input }) => resetContent(ctx.user, input.key, input.locale).catch(asBadRequest)),
  }),
});

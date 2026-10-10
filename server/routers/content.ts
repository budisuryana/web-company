/** Bilingual page content: public reads of CMS overrides (resolved against the code dictionary on both server and client). */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { loadContentOverrides } from "../content";
import { contentLocales } from "../../drizzle/schema";

export const contentRouter = router({
  public: router({
    /** Overrides in effect for one language (shared fields included). Empty when nothing is overridden. */
    forLocale: publicProcedure.input(z.object({ locale: z.enum(contentLocales) })).query(async ({ input }) => {
      const overrides = await loadContentOverrides();
      return { locale: input.locale, overrides: { ...(overrides.en ?? {}), ...(input.locale === "id" ? overrides.id ?? {} : {}) } };
    }),
    /** Every override in both languages: what the server embeds into each page. */
    all: publicProcedure.query(() => loadContentOverrides()),
  }),
});

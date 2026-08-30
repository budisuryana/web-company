/** Application router: system authentication, credential login, and the Product Registry remain explicit, typed entry points. */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../drizzle/schema";
import { getDb, getUserByUsernameOrEmail } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { registryRouter } from "./routers/registry";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    login: publicProcedure
      .input(
        z.object({
          usernameOrEmail: z.string().trim().min(1, "Username atau Email wajib diisi."),
          password: z.string().min(1, "Password wajib diisi."),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByUsernameOrEmail(input.usernameOrEmail);
        if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Username/Email atau password salah. Silakan periksa kembali.",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const db = await getDb();
        if (db) {
          await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
        }

        return {
          id: user.id,
          openId: user.openId,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true as const };
    }),
  }),
  registry: registryRouter,
});

export type AppRouter = typeof appRouter;

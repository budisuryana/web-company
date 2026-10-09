import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectMeta } from "../seo";
import { resolvePageMeta } from "../seoRoutes";
import type { Request } from "express";

/**
 * Rewrites the served document's head for the requested route, and decides
 * the status code: unknown routes are a real 404, not a soft 200.
 *
 * Metadata is a nice-to-have; the page is not. Any failure here falls back to
 * the untouched template rather than turning a crawler concern into an outage.
 */
async function withRouteMeta(html: string, url: string, req: Request): Promise<{ html: string; status: number }> {
  try {
    const meta = await resolvePageMeta(url, req);
    return { html: injectMeta(html, meta), status: meta.notFound ? 404 : 200 };
  } catch (error) {
    console.error("[seo] meta injection failed, serving template as-is:", error);
    return { html, status: 200 };
  }
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      const rendered = await withRouteMeta(page, url, req);
      res.status(rendered.status).set({ "Content-Type": "text/html" }).end(rendered.html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // index:false — "/" must go through the meta-injecting handler below like every
  // other route; letting express.static answer it served the homepage with no
  // canonical, Open Graph or JSON-LD at all.
  app.use(express.static(distPath, { index: false }));

  // The built index.html never changes while the process runs, so it is read
  // once; only the per-route head is rebuilt per request.
  const indexPath = path.resolve(distPath, "index.html");
  let cachedTemplate: string | null = null;
  const template = () => (cachedTemplate ??= fs.readFileSync(indexPath, "utf-8"));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const rendered = await withRouteMeta(template(), req.originalUrl, req);
      res.status(rendered.status).set({ "Content-Type": "text/html" }).end(rendered.html);
    } catch (e) {
      next(e);
    }
  });
}

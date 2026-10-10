/** Product detail: problem, solution, workflow, capabilities, real screenshots (when uploaded), and audience. */
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ProductPrimaryCta, ProductStatus } from "@/components/ProductCta";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { useDocumentTitle, useLocale, useMessages } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { localizeProduct, productCtaMode } from "@shared/i18n/products";

export default function ProductDetail() {
  const locale = useLocale();
  const t = useMessages();
  const [, params] = useRoute("/products/:slug");
  const productQuery = trpc.registry.public.bySlug.useQuery(
    { slug: params?.slug ?? "" },
    { enabled: Boolean(params?.slug) }
  );
  const product = productQuery.data ? localizeProduct(productQuery.data, locale) : null;
  useDocumentTitle(product ? product.name : productQuery.isLoading ? undefined : t.meta.notFoundTitle);

  if (productQuery.isLoading) {
    return (
      <SiteShell>
        <main className="not-found">
          <Loader2 className="mb-5 h-7 w-7 animate-spin" aria-label={t.common.loading} />
        </main>
      </SiteShell>
    );
  }

  if (!product) {
    return (
      <SiteShell>
        <main className="not-found">
          <span className="section-label">
            <i /> {t.productDetail.notFoundEyebrow}
          </span>
          <h1>{t.productDetail.notFoundTitle}</h1>
          <p>{t.productDetail.notFoundBody}</p>
          <Link href="/products" className="button button-ink">
            <ArrowLeft size={17} /> {t.productDetail.backToProducts}
          </Link>
        </main>
      </SiteShell>
    );
  }

  const screenshots = product.screenshots;

  return (
    <SiteShell>
      <main className={`product-detail detail-${product.slug}`}>
        <section className="detail-hero">
          <div className="detail-hero-copy">
            <Link href="/products" className="back-link">
              <ArrowLeft size={15} /> {t.common.allProducts}
            </Link>
            <div className="product-card-meta">
              <span className="section-label">
                <i /> {product.category}
              </span>
              <ProductStatus status={product.productStatus} />
            </div>
            <h1>{product.heroHeadline}</h1>
            <p>{product.fullDescription}</p>
            <div className="hero-actions">
              <ProductPrimaryCta product={product} />
              {/* When the primary CTA already opens the contact form, a second link to it is noise. */}
              {productCtaMode(product.slug) === "app" && product.demoUrl && (
                <Link href="/contact" className="text-link">
                  {t.productDetail.discuss(product.name)} <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
            {productCtaMode(product.slug) === "demo" && <p className="cta-note">{t.productDetail.demoNote}</p>}
          </div>
          <div className="detail-hero-visual">
            <RegistryProductVisual product={product} alt={`${product.name} — ${product.shortDescription}`} />
          </div>
        </section>

        <section className="problem-solution">
          <div className="problem-column">
            <span>{t.productDetail.challenge}</span>
            <p>{product.problem}</p>
          </div>
          <div className="solution-column">
            <span>{t.productDetail.solution}</span>
            <p>{product.solution}</p>
            <blockquote>{product.outcome}</blockquote>
          </div>
        </section>

        <section className="how-section">
          <div className="how-title">
            <span className="section-label">
              <i /> {t.productDetail.workflowEyebrow}
            </span>
            <h2>{t.productDetail.workflowTitle}</h2>
          </div>
          <div className="steps-list">
            {product.workflowSteps.map((step, index) => (
              <article className="step-card" key={`${step.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="capability-section">
          <div>
            <span className="section-label">
              <i /> {t.productDetail.capabilitiesEyebrow}
            </span>
            <h2>{t.productDetail.capabilitiesTitle}</h2>
          </div>
          <div className="capability-list">
            {product.capabilities.map((capability, index) => (
              <div key={capability}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{capability}</p>
                <Check size={17} aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        {/* Only real uploaded screenshots — never a mockup standing in for one. */}
        {screenshots.length > 0 && (
          <section className="detail-screen-section">
            <div className="screen-section-heading">
              <span>{t.productDetail.screensEyebrow}</span>
              <p>{t.productDetail.screensLead}</p>
            </div>
            <div className="screen-grid">
              {screenshots.map((screenshot, index) => (
                <img
                  key={screenshot.id}
                  src={screenshot.url}
                  alt={screenshot.alt && !/screenshot$/i.test(screenshot.alt) ? screenshot.alt : `${product.name} — ${t.productDetail.screensEyebrow} ${index + 1}`}
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        <section className="audience-section">
          <div>
            <span className="section-label">
              <i /> {t.productDetail.audienceEyebrow}
            </span>
            <h2>{t.productDetail.audienceTitle}</h2>
          </div>
          <p>{product.targetUsers}</p>
          <ProductPrimaryCta product={product} className="button button-accent" />
        </section>
      </main>
    </SiteShell>
  );
}

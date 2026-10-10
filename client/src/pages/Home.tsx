/** Homepage: Ruang Karya as a business software & SaaS company — products first, then how we build, including AI. */
import { useEffect } from "react";
import { ArrowUpRight, Bot, Check, GitBranch, ListChecks, Workflow } from "lucide-react";
import { Link } from "wouter";
import { ConfettiBits, SparkCluster, TiltFrame } from "@/components/Decor";
import { ProductPrimaryCta, ProductStatus } from "@/components/ProductCta";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import UpcomingProducts from "@/components/UpcomingProducts";
import { useDocumentTitle, useLocale, useMessages } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { localizeProduct } from "@shared/i18n/products";
import { SITE } from "@shared/site";

const AI_ICONS = [Bot, Workflow, GitBranch, ListChecks];

export default function Home() {
  const locale = useLocale();
  const t = useMessages();
  useDocumentTitle(t.meta.homeTitle);
  const productsQuery = trpc.registry.public.list.useQuery();
  const products = (productsQuery.data ?? []).map((product) => localizeProduct(product, locale));
  const [lead, second] = products;

  // Client-side navigation to "/#ai" (from About) does not scroll by itself.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <SiteShell>
      <main>
        <section className="hero-home">
          <SparkCluster />
          <div className="home-hero-copy">
            <span className="section-label">
              <i /> {t.home.eyebrow}
            </span>
            <h1>{t.home.title}</h1>
            <p>{t.home.lead}</p>
            <div className="hero-actions">
              <Link href="/products" className="button button-ink">
                {t.common.exploreProducts} <ArrowUpRight size={17} />
              </Link>
              <Link href="/contact" className="button button-outline">
                {t.common.contactUs}
              </Link>
            </div>
            <ul className="hero-facts">
              {t.home.facts.map((fact) => (
                <li key={fact}>
                  <Check size={14} aria-hidden="true" /> {fact}
                </li>
              ))}
            </ul>
          </div>
          <div className="home-hero-visual" aria-hidden={!lead}>
            {second && (
              <div className="hero-card hero-card-back">
                <RegistryProductVisual product={second} alt={`${second.name} — ${second.shortDescription}`} />
              </div>
            )}
            {lead ? (
              <div className="hero-card hero-card-front">
                <RegistryProductVisual product={lead} alt={`${lead.name} — ${lead.shortDescription}`} />
              </div>
            ) : (
              <div className="hero-card hero-card-front hero-card-skeleton" />
            )}
          </div>
        </section>

        <section className="products-showcase" id="products">
          <div className="section-intro split-intro">
            <div>
              <span className="section-label">
                <i /> {t.home.productsEyebrow}
              </span>
              <h2>{t.home.productsTitle}</h2>
            </div>
            <p>{t.home.productsLead}</p>
          </div>

          <div className="product-cards">
            {productsQuery.isLoading && <p className="loading-note">{t.common.loading}</p>}
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <Link href={`/products/${product.slug}`} className="product-card-media" tabIndex={-1} aria-hidden="true">
                  <RegistryProductVisual product={product} alt="" />
                </Link>
                <div className="product-card-body">
                  <div className="product-card-meta">
                    <span>{product.category}</span>
                    <ProductStatus status={product.productStatus} />
                  </div>
                  <h3>
                    <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <p>{product.fullDescription}</p>
                  <div className="product-card-caps">
                    <span>{t.home.keyCapabilities}</span>
                    <ul>
                      {product.capabilities.slice(0, 4).map((capability) => (
                        <li key={capability}>
                          <Check size={14} aria-hidden="true" /> {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="product-card-actions">
                    <ProductPrimaryCta product={product} />
                    <Link href={`/products/${product.slug}`} className="text-link">
                      {t.common.viewDetails} <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <UpcomingProducts />

        <section className="working-method">
          <TiltFrame />
          <div className="method-heading">
            <span className="section-label">
              <i /> {t.home.methodEyebrow}
            </span>
            <h2>{t.home.methodTitle}</h2>
          </div>
          <div className="method-items">
            {t.home.method.map((item, index) => (
              <article className="method-item" key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <Check size={18} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="ai-section" id="ai">
          <div className="ai-intro">
            <span className="section-label">
              <i /> {t.home.aiEyebrow}
            </span>
            <h2>{t.home.aiTitle}</h2>
            <p>{t.home.aiLead}</p>
            <div className="stack-list">
              <span>{t.home.stackTitle}</span>
              <ul>
                {t.home.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ai-grid">
            {t.home.aiPractices.map((practice, index) => {
              const Icon = AI_ICONS[index % AI_ICONS.length];
              return (
                <article className="ai-card" key={practice.title}>
                  <Icon size={20} aria-hidden="true" />
                  <h3>{practice.title}</h3>
                  <p>{practice.body}</p>
                </article>
              );
            })}
          </div>
          <p className="ai-note">{t.home.aiNote}</p>
        </section>

        <section className="closing-cta">
          <ConfettiBits className="decor-confetti-a" />
          <span className="section-label">
            <i /> {SITE.name}
          </span>
          <h2>{t.home.ctaTitle}</h2>
          <p className="cta-lead">{t.home.ctaLead}</p>
          <div className="cta-actions">
            <Link href="/contact" className="button button-ink">
              {t.common.contactUs} <ArrowUpRight size={17} />
            </Link>
            <a href={`mailto:${SITE.email}`} className="text-link">
              {SITE.email}
            </a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

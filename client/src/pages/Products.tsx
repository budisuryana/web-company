/** Product catalogue: every published product with its status, audience, and primary call to action. */
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { ProductPrimaryCta, ProductStatus } from "@/components/ProductCta";
import RegistryProductVisual from "@/components/RegistryProductVisual";
import SiteShell from "@/components/SiteShell";
import { useDocumentTitle, useLocale, useMessages } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { localizeProduct } from "@shared/i18n/products";

export default function Products() {
  const locale = useLocale();
  const t = useMessages();
  useDocumentTitle(t.meta.productsTitle);
  const productsQuery = trpc.registry.public.list.useQuery();
  const products = (productsQuery.data ?? []).map((product) => localizeProduct(product, locale));

  return (
    <SiteShell>
      <main className="products-page">
        <section className="page-hero products-hero">
          <div>
            <span className="section-label">
              <i /> {t.products.eyebrow}
            </span>
            <h1>{t.products.title}</h1>
          </div>
          <p>{t.products.lead}</p>
        </section>

        <section className="product-archive">
          {productsQuery.isLoading && <p className="loading-note">{t.common.loading}</p>}

          {products.map((product, index) => (
            <article className="archive-product" key={product.id}>
              <div className="archive-meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{product.category}</span>
                <ProductStatus status={product.productStatus} />
              </div>
              <div className="archive-copy">
                <h2>
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </h2>
                <p>{product.fullDescription}</p>
                <div className="archive-problem">
                  <span>{t.products.builtFor}</span>
                  <p>{product.targetUsers}</p>
                </div>
                <div className="product-card-actions">
                  <ProductPrimaryCta product={product} />
                  <Link href={`/products/${product.slug}`} className="text-link">
                    {t.common.viewDetails} <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
              <Link href={`/products/${product.slug}`} className="archive-visual" tabIndex={-1} aria-hidden="true">
                <RegistryProductVisual product={product} alt="" />
              </Link>
            </article>
          ))}
        </section>

        <section className="mini-cta">
          <p>{t.products.ctaTitle}</p>
          <Link href="/contact" className="button button-ink">
            {t.products.ctaButton} <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
